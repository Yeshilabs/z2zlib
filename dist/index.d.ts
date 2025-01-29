import { Server } from 'socket.io';
import { Socket } from 'socket.io-client';
import { JsonProof } from 'o1js';

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
  };

declare class SignalingServer extends Server {
    private static _instance;
    constructor(server: any);
    static get io(): Server | null;
    private setupListeners;
    private setupSocketEvents;
    broadcastEvent(roomName: string, event: keyof SignalingEvents, data: any): void;
}

type JsonData = JsonProof | {
    [key: string]: any;
};
declare function isJsonProof(data: unknown): data is JsonProof;
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

export { type JsonData, type RTCIceCandidate, type SignalingEvents, SignalingServer, WebRTCManager, isJsonProof };
