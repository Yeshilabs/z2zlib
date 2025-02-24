import { Server as HTTPServer } from 'http';
import { Server, Socket } from "socket.io";
import { RTCIceCandidate, SignalingEvents } from "../types/SignalingTypes";

export class SignalingServer {
    private static _instance: Server | null = null;
    private io: Server;

    constructor(httpServer: HTTPServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        if (!SignalingServer._instance) {
            SignalingServer._instance = this.io;
        }

        this.setupListeners();
    }

    public static get io(): Server | null {
        return SignalingServer._instance;
    }

    private setupListeners(): void {
        this.io.on("connection", (socket: Socket) => {
            console.log("User connected:", socket.id);
            this.setupSocketEvents(socket);
        });
    }


 private setupSocketEvents(socket: Socket): void {
        socket.on("join", (roomName: string) => {
            console.log("User joined room:", roomName);
            const room = this.io.sockets.adapter.rooms.get(roomName);

            if (!room) {
                socket.join(roomName);
                socket.emit("created", roomName);
                console.log("emmiting created");

                console.log("Room created:", roomName);
            } else if (room.size === 1) {
                socket.join(roomName);
                socket.emit("joined", roomName);
            } else {
                socket.emit("full", roomName);
            }
            //console.log(this.sockets.adapter.rooms);
        });

        socket.on("ready", (roomName: string) => {
            console.log("User is ready:", roomName);
            socket.broadcast.to(roomName).emit("ready");
        });

        socket.on("ice-candidate", (candidate: RTCIceCandidate, roomName: string) => {
            console.log("Received ICE candidate:", candidate);
            socket.broadcast.to(roomName).emit("ice-candidate", candidate);
        });

        socket.on("offer", (offer: any, roomName: string) => {
            console.log("Received offer:", offer);
            socket.broadcast.to(roomName).emit("offer", offer);
        });

        socket.on("answer", (answer: any, roomName: string) => {
            console.log('SignalingServer: Received answer:', JSON.stringify(answer));
            console.log('SignalingServer: Broadcasting to room:', roomName);
            socket.broadcast.to(roomName).emit("answer", answer);
        });

        socket.on("leave", (roomName: string) => {
            console.log("User left room:", roomName);
            socket.leave(roomName);
            socket.broadcast.to(roomName).emit("leave");
        });
    }
    public broadcastEvent(roomName: string, event: keyof SignalingEvents, data: any): void {
        this.io.to(roomName).emit(event, data);
    }
}

export default SignalingServer;

