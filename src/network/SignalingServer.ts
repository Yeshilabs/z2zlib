import { Server, Socket } from "socket.io";
import { RTCIceCandidate, SignalingEvents } from "../types/SignalingTypes";

export class SignalingServer extends Server {
    // Static property to hold the Server instance
    private static _instance: Server | null = null;

    constructor(server: any) {
        super(server); // Initialize the Server with the provided HTTP server
        if (!SignalingServer._instance) {
            SignalingServer._instance = this;
        }
        this.setupListeners();
    }
    public static get io(): Server | null {
        if (!SignalingServer._instance) {
            throw new Error("SignalingServer has not been initialized.");
        }
        return SignalingServer._instance;
    }

    private setupListeners(): void {
        this.on("connection", (socket: Socket) => {
            console.log("User connected:", socket.id);
            this.setupSocketEvents(socket);
        });
    }
    private setupSocketEvents(socket: Socket): void {
        socket.on("join", (roomName: string) => {
            console.log("User joined room:", roomName);
            const room = this.sockets.adapter.rooms.get(roomName);

            if (!room) {
                socket.join(roomName);
                socket.emit("created", roomName);

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
        this.to(roomName).emit(event, data);
    }
}

export default SignalingServer;