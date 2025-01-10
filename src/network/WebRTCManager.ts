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
  dataChannel: RTCDataChannel | null = null;
  private onMessageCallback: ((data: JsonData) => void) | null = null;
  isHost: boolean = false;

  constructor(
    private socket: Socket,
    private roomName: string,
    private iceServers: RTCConfiguration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  ) {}
  
  init(): void {
    console.log('Initializing WebRTCManager');
    this.setupWSListeners();    
  }

  private setupWSListeners = ():void => {
    console.log('Setting up WebRTCManager listeners');
    this.socket.on('connect', this.handleConnect);
    this.socket.on('created', this.handleRoomCreated);
    this.socket.on('joined', this.handleRoomJoined);
    this.socket.on('ready', this.initiateCall);
    this.socket.on('offer', this.handleOffer);
    this.socket.on('answer', this.handleAnswer);
    this.socket.on('ice-candidate', this.handleIceCandidate)
    this.socket.on('leave', this.close);
  }

  private handleConnect = ():void =>{
    console.log('Connected to signaling server');
    this.socket.emit('join', this.roomName);
  }

  private handleRoomCreated = ():void => {
    console.log('Room created - You are the host!');
    this.isHost = true;
  }

  private handleRoomJoined= ():void =>  {
    console.log('Room joined - You are the peer');
    this.isHost = false;
    this.socket.emit('ready', this.roomName);
  }

  private initiateCall = async ():Promise<void> => {
    if (this.isHost) {
      try {
        this.peerConnection = this.createPeerConnection();
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        console.log("Sending offer:", offer);
       this.socket.emit('offer', offer, this.roomName);
      } catch (error) {
        console.error("Error initiating call:", error);
      }
    }
  };

  private createPeerConnection = ():RTCPeerConnection  => {
    const connection = new RTCPeerConnection(this.iceServers);

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate");
        this.socket.emit('ice-candidate', event.candidate, this.roomName);
      }
    };

    connection.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', connection.iceConnectionState);
    };

    if (this.isHost) {
      console.log("Creating data channel as host");
      const dataChannel = connection.createDataChannel('jsonChannel');
      this.setupDataChannelListener(dataChannel);
      this.dataChannel = dataChannel;
    } else {
      console.log("Setting up data channel handler as peer");
      connection.ondatachannel = (dc) => {
        this.setupDataChannelListener(dc.channel);
        this.dataChannel = dc.channel;
      };
    }

    return connection;
  }
  
  private setupDataChannelListener = (channel: RTCDataChannel): void  => {
    channel.onopen = () => console.log('Data channel opened');
    channel.onclose = () => console.log('Data channel closed');
    channel.onmessage = this.handleDataChannelMessage;
  }

  private handleDataChannelMessage = (event: MessageEvent): void  => {
    try {
      const jsonData = JSON.parse(event.data);
      if (this.onMessageCallback) {
        this.onMessageCallback(jsonData);
      } else {
        console.log("Received JSON data : ", jsonData);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }

  // private setupDataChannel(channel: RTCDataChannel): void {
  //   channel.onopen = () => console.log('Data channel opened');
  //   channel.onclose = () => console.log('Data channel closed');
  //   channel.onmessage = (event: MessageEvent) => {
  //     try {
  //       const jsonData = JSON.parse(event.data);
  //       if (this.onMessageCallback) {
  //         this.onMessageCallback(jsonData);
  //       }
  //     } catch (error) {
  //       console.error("Error parsing message:", error);
  //     }
  //   };
  // }

  private handleOffer = async (offer: RTCSessionDescriptionInit): Promise<void>  => {
    //if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    if (this.isHost) return;
    this.peerConnection = this.createPeerConnection();

    try {
      const sessionDescription = new RTCSessionDescription({
        type: offer.type,
        sdp: offer.sdp
      });
      await this.peerConnection.setRemoteDescription(sessionDescription);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit('answer', answer, this.roomName);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }

  private handleAnswer = async (answer: RTCSessionDescriptionInit): Promise<void>  =>{
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    if (!this.isHost) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("Remote description set successfully");
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }

  private handleIceCandidate = async (candidate: RTCIceCandidateInit): Promise<void> => {
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

  private createAndSendOffer = async (): Promise<void> => {
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

  setOnMessageCallback = (callback: (data: JsonData) => void): void  => {
    this.onMessageCallback = callback;
  }

  sendData = (data: JsonData): void  => {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(JSON.stringify(data));
    } else {
      console.log("Data channel is not open - state :", this.dataChannel?.readyState);
      console.error("Data channel is not open - state :", this.dataChannel?.readyState);
    }
  }

  close = (): void => {
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.peerConnection = null;
    this.dataChannel = null;
  }
}
