import { Server } from 'socket.io';

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

export { type RTCIceCandidate, type SignalingEvents, SignalingServer };
