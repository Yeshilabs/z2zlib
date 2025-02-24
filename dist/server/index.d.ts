import { Server } from 'http';
import { Server as Server$1 } from 'socket.io';

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

export { SignalingServer, SignalingServer as default };
