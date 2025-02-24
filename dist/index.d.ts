import { Server } from 'http';
import { Server as Server$1 } from 'socket.io';
import { Socket } from 'socket.io-client';

type RTCIceCandidate = {
    candidate: string;
    sdpMid?: string;
    sdpMLineIndex?: number;
  };


type SignalingEvents = {
      join: (roomName: string) => void;
      ready: (roomName: string) => void;
      "ice-candidate": (candidate: RTCIceCandidate, roomName: string) => void;
      offer: (offer: any, roomName: string) => void;
      answer: (answer: any, roomName: string) => void;
      leave: (roomName: string) => void;
  }

declare class SignalingServer {
    private static _instance;
    private io;
    constructor(httpServer: Server);
    static get io(): Server$1 | null;
    private setupListeners;
    private setupSocketEvents;
    broadcastEvent(roomName: string, event: keyof SignalingEvents, data: any): void;
}

type JsonData = {
    [key: string]: any;
};
declare class WebRTCManager {
    private socket;
    private roomName;
    private iceServers;
    private peerConnection;
    dataChannel: RTCDataChannel | null;
    private onMessageCallback;
    private keyExchangeManager;
    private messageListeners;
    isHost: boolean;
    constructor(socket: Socket, roomName: string, iceServers?: RTCConfiguration);
    init(): void;
    private setupMessageListeners;
    private handleKeyExchange;
    private setupWSListeners;
    private handleConnect;
    private handleRoomCreated;
    private handleRoomJoined;
    private initiateCall;
    private createPeerConnection;
    private setupDataChannelListener;
    private handleDataChannelOpen;
    private ExchangeKeys;
    private sendLocalPublicKey;
    private handleDataChannelMessage;
    private handleOffer;
    private handleAnswer;
    private handleIceCandidate;
    private createAndSendOffer;
    setOnMessageCallback: (callback: (data: JsonData) => void) => void;
    sendData: (data: JsonData) => void;
    close: () => void;
}

export { SignalingServer, WebRTCManager };
