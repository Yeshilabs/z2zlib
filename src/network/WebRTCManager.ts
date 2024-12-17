import { Socket } from 'socket.io-client';
import { JsonProof } from 'o1js';

export type JsonData = JsonProof | { [key: string]: any };

export function isJsonProof(data: unknown): data is JsonProof {
  return (
    typeof data === 'object' &&
    data !== null &&
    'publicInput' in data &&
    'publicOutput' in data &&
    'maxProofsVerified' in data &&
    'proof' in data
  );
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onMessageCallback: ((data: JsonData) => void) | null = null;
  private isHost: boolean = false;

  constructor(
    private socket: Socket,
    private roomName: string,
    private iceServers: RTCConfiguration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  ) { 
    console.log("WebRTCManager created with room:", roomName);

  }

  async init(isHost: boolean): Promise<void> {
    this.isHost = isHost;
    this.peerConnection = new RTCPeerConnection(this.iceServers);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate");
        this.socket.emit('ice-candidate', event.candidate, this.roomName);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', this.peerConnection?.iceConnectionState);
    };

    if (this.isHost) {
      console.log("Creating data channel as host");
      this.dataChannel = this.peerConnection.createDataChannel('jsonChannel');
      this.setupDataChannel(this.dataChannel);
    } else {
      console.log("Setting up data channel handler as peer");
      this.peerConnection.ondatachannel = (event) => {
        console.log("Received data channel");
        this.dataChannel = event.channel;
        this.setupDataChannel(event.channel);
      };
    }
  }


  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => console.log('Data channel opened');
    channel.onclose = () => console.log('Data channel closed');
    channel.onmessage = (event: MessageEvent) => {
      try {
        const jsonData = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(jsonData);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    if (this.isHost) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit('answer', answer, this.roomName);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    if (!this.isHost) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (this.peerConnection?.remoteDescription) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        console.log("Queuing ICE candidate - no remote description");
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }

  async createAndSendOffer(): Promise<void> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    if (!this.isHost) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.socket.emit('offer', offer, this.roomName);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }

  setOnMessageCallback(callback: (data: JsonData) => void): void {
    this.onMessageCallback = callback;
  }

  sendData(data: JsonData): void {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(JSON.stringify(data));
    } else {
      console.log("Data channel is not open - state :", this.dataChannel?.readyState);
      console.error("Data channel is not open - state :", this.dataChannel?.readyState);
    }
  }

  close(): void {
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.peerConnection = null;
    this.dataChannel = null;
  }
}