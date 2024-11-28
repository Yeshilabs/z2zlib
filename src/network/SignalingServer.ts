import { Server, Socket } from "socket.io";

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

class SignalingServer {
    private io: Server;

    constructor(server: any) {
        this.io = new Server(server);
        this.setupListeners();
    }

    private setupListeners(): void {
        this.io.on("connection", (socket: Socket) => {
            console.log("User connected: ", socket.id);

            this.setupSocketEvents(socket);
        });
    }

    private setupSocketEvents(socket: Socket): void {
        const { io } = this;

        socket.on("join", (roomName: string) => {
            console.log("User joined room: ", roomName);
            const room = io.sockets.adapter.rooms.get(roomName);

            if (!room) {
                socket.join(roomName);
                socket.emit("created", roomName);
            } else if (room.size === 1) {
                socket.join(roomName);
                socket.emit("joined", roomName);
            } else {
                socket.emit("full", roomName);
            }
            console.log(io.sockets.adapter.rooms);
        });

        socket.on("ready", (roomName: string) => {
            console.log("User is ready: ", roomName);
            socket.broadcast.to(roomName).emit("ready");
        });

        socket.on("ice-candidate", (candidate: RTCIceCandidate, roomName: string) => {
            console.log("Received ICE candidate: ", candidate);
            socket.broadcast.to(roomName).emit("ice-candidate", candidate);
        });

        socket.on("offer", (offer: any, roomName: string) => {
            console.log("Received offer: ", offer);
            socket.broadcast.to(roomName).emit("offer", offer);
        });

        socket.on("answer", (answer: any, roomName: string) => {
            console.log("Received answer");
            socket.broadcast.to(roomName).emit("answer", answer);
        });

        socket.on("leave", (roomName: string) => {
            console.log("User left room: ", roomName);
            socket.leave(roomName);
            socket.broadcast.to(roomName).emit("leave");
        });
    }

    public broadcastEvent(roomName: string, event: keyof SignalingEvents, data: any): void {
        this.io.to(roomName).emit(event, data);
    }

    public getSocketIOInstance(): Server {
        return this.io;
    }
}

export default SignalingServer;
