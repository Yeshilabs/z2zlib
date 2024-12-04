type JsonData = { [key: string]: any };

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onMessageCallback: ((data: JsonData) => void) | null = null;

  constructor(private signalingUrl: string) {}

  async init(): Promise<void> {
    this.peerConnection = new RTCPeerConnection();

    this.dataChannel = this.peerConnection.createDataChannel("jsonChannel");
    this.dataChannel.onopen = () => console.log("Data channel is open");
    this.dataChannel.onclose = () => console.log("Data channel is closed");
    this.dataChannel.onmessage = (event: MessageEvent) => {
      const jsonData: JsonData = JSON.parse(event.data);
      if (this.onMessageCallback) this.onMessageCallback(jsonData);
    };

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.sendSignalingMessage({ candidate: event.candidate });
      }
    };
  }

  setOnMessageCallback(callback: (data: JsonData) => void): void {
    this.onMessageCallback = callback;
  }

  async createOffer(): Promise<void> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    await this.sendSignalingMessage({ offer });
  }

  async receiveOfferAndAnswer(): Promise<void> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");

    const { offer } = await this.fetchSignalingMessage("offer");
    if (offer) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      await this.sendSignalingMessage({ answer });
    }
  }

  async connectToPeer(): Promise<void> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");

    const { answer } = await this.fetchSignalingMessage("answer");
    if (answer) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    const { candidates } = await this.fetchSignalingMessage("candidates");
    candidates.forEach((candidate: RTCIceCandidateInit) => {
      this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }

  sendJSONData(data: JsonData): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(JSON.stringify(data));
    } else {
      console.error("Data channel is not open");
    }
  }

  close(): void {
    this.peerConnection?.close();
    this.peerConnection = null;
    this.dataChannel = null;
    console.log("WebRTC connection closed");
  }

  private async sendSignalingMessage(message: JsonData): Promise<void> {
    await fetch(this.signalingUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
  }

  private async fetchSignalingMessage(type: string): Promise<JsonData> {
    const response = await fetch(`${this.signalingUrl}?type=${type}`);
    return await response.json();
  }
}
