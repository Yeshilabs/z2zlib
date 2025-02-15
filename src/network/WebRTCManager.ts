import { Socket } from 'socket.io-client';
import { KeyExchangeManager } from './KeyExchangeManager';

export type JsonData = { [key: string]: any };


const isBrowser = typeof window !== 'undefined';
if (!isBrowser) {
  throw new Error("WebRTCManager can only be used in a browser environment !");
}
export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  dataChannel: RTCDataChannel | null = null;
  private onMessageCallback: ((data: JsonData) => void) | null = null;
  private keyExchangeManager: KeyExchangeManager | null;
  private messageListeners: Map<string, (message: JsonData) => void> = new Map();


  isHost: boolean = false;



  constructor(
    private socket: Socket,
    private roomName: string,
    private iceServers: RTCConfiguration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  ) {
    this.keyExchangeManager = new KeyExchangeManager();
  }


  init(): void {
    console.log('Initializing WebRTCManager');
    this.setupWSListeners();
    this.setupMessageListeners();
  }




  private setupMessageListeners = () => {
    this.messageListeners.set('PublicKeyExchange', this.handleKeyExchange);
    this.messageListeners.set('SignedData', this.handleSignedData);
  }


  private handleSignedData = (payload: any) => {
    console.log("Received signed data payload:", payload);
    const { message, signature } = payload;
    console.log("verifying message:", message);
    const isValid = this.keyExchangeManager?.verifySignature(signature, JSON.stringify(message));
    console.log("Signature is valid:", isValid);
    if (isValid) {
      const { label, payload } = message;
      const handler = this.messageListeners.get(label);
      if (handler) {
        handler(payload);
      }
    }
  };



  private handleKeyExchange = (payload: any) => {
    console.log("Received key exchange payload:", payload);
    if (payload.publicKey) {
      const { x, y } = payload.publicKey;
      console.log("Received peer's public key - x:", x, "y:", y);
      if (this.keyExchangeManager) {
        this.keyExchangeManager.setPeerPublicKey(x, y);
      } else {
        console.log("KeyExchangeManager not initialized");
      }
    } else {
      console.log("Received key exchange payload but no public key");
    }
  }

  private setupWSListeners = (): void => {
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

  private handleConnect = (): void => {
    console.log('Connected to signaling server');
    this.socket.emit('join', this.roomName);
  }

  private handleRoomCreated = (): void => {
    console.log('Room created - You are the host!');
    this.isHost = true;
  }

  private handleRoomJoined = (): void => {
    console.log('Room joined - You are the peer');
    this.isHost = false;
    this.socket.emit('ready', this.roomName);
  }

  private initiateCall = async (): Promise<void> => {
    if (this.isHost) {
      try {
        this.peerConnection = this.createPeerConnection();
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        console.log("HOST Sending offer:", offer);
        this.socket.emit('offer', offer, this.roomName);
      } catch (error) {
        console.error("Error initiating call:", error);
      }
    }
  };

  private createPeerConnection = (): RTCPeerConnection => {
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
      this.dataChannel = dataChannel;
      this.setupDataChannelListener(dataChannel);
    } else {
      console.log("Setting up data channel handler as peer");
      connection.ondatachannel = (dc) => {
        this.dataChannel = dc.channel;
        this.setupDataChannelListener(dc.channel);
      };
    }

    return connection;
  }

  private setupDataChannelListener = (channel: RTCDataChannel): void => {
    channel.onopen = (event) => {
      console.log('Data channel opened');
      this.sendLocalPublicKey();
    };
    channel.onclose = () => console.log('Data channel closed');
    channel.onmessage = this.handleDataChannelMessage;
  }

  private sendLocalPublicKey() {
    console.log("sending public key");
    if (!this.keyExchangeManager) {
      throw new Error("Trying to send local public key over the channel keys when the keyExchangeManager is not initialized");
    }
    const myPublicKey = this.keyExchangeManager.getMyPublicKey();
    console.log("my public key:", myPublicKey);
    const message = {
      publicKey: {
        x: myPublicKey.x,
        y: myPublicKey.y,
      }
    };
    this.sendData('PublicKeyExchange', message);
  }



  private handleDataChannelMessage = (event: MessageEvent): void => {
    try {
      const data = JSON.parse(event.data);

      // Check if message has a label
      if (!data.label) {
        console.log("Received unlabeled message:", data);
        return;
      }

      // Get the handler for this label
      const handler = this.messageListeners.get(data.label);
      if (handler) {
        console.log(`Handling message with label: ${data.label}`);
        handler(data.payload);
      } else {
        console.log(`No handler registered for message label: ${data.label}`);
      }
    } catch (error) {
      console.error("Error handling data channel message:", error);
    }
  }

  private handleOffer = async (offer: RTCSessionDescriptionInit): Promise<void> => {
    if (this.isHost || this.peerConnection) return;
    console.log("peer handling offer")
    this.peerConnection = this.createPeerConnection();

    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      this.socket.emit('answer', answer, this.roomName);
      await this.peerConnection.setLocalDescription(answer);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }

  private handleAnswer = async (answer: RTCSessionDescriptionInit): Promise<void> => {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    if (!this.isHost) throw new Error("Peer cannot handle answer");

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("Remote description set successfully");
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }

  private handleIceCandidate = async (candidate: RTCIceCandidateInit): Promise<void> => {
    try {
      if (this.peerConnection) {
        if (this.peerConnection.remoteDescription) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          console.log("Queuing ICE candidate - no remote description");
        }
      }
    }
    catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  };

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

  setOnMessageCallback = (callback: (data: JsonData) => void): void => {
    this.onMessageCallback = callback;
  }


  sendSignedData = (label: string, data: JsonData): void => {
    if (!this.keyExchangeManager) throw new Error("KeyExchangeManager not initialized");
    const message = {
      label: label,
      payload: data
    }
    const { r, s } = this.keyExchangeManager.signMessage(JSON.stringify(message));
    const signedMessage = {
      message: message,
      signature: {
        r: r,
        s: s
      }
    };
    console.log("Sending signed message:", signedMessage);

    this.sendData('SignedData', signedMessage);
  }

  sendData = (label: string, data: JsonData): void => {
    if (this.dataChannel?.readyState === "open") {
      const message = {
        label: label,
        payload: data
      };
      this.dataChannel.send(JSON.stringify(message));
    } else {
      console.log("Data channel is not open - state:", this.dataChannel?.readyState);
      console.error("Data channel is not open - state:", this.dataChannel?.readyState);
    }
  }

  close = (): void => {
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.peerConnection = null;
    this.dataChannel = null;
  }
}
