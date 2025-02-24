import { Server } from 'socket.io';

// src/network/SignalingServer.ts
var SignalingServer = class _SignalingServer {
  static _instance = null;
  io;
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    if (!_SignalingServer._instance) {
      _SignalingServer._instance = this.io;
    }
    this.setupListeners();
  }
  static get io() {
    return _SignalingServer._instance;
  }
  setupListeners() {
    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);
      this.setupSocketEvents(socket);
    });
  }
  setupSocketEvents(socket) {
    socket.on("join", (roomName) => {
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
    });
    socket.on("ready", (roomName) => {
      console.log("User is ready:", roomName);
      socket.broadcast.to(roomName).emit("ready");
    });
    socket.on("ice-candidate", (candidate, roomName) => {
      console.log("Received ICE candidate:", candidate);
      socket.broadcast.to(roomName).emit("ice-candidate", candidate);
    });
    socket.on("offer", (offer, roomName) => {
      console.log("Received offer:", offer);
      socket.broadcast.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
      console.log("SignalingServer: Received answer:", JSON.stringify(answer));
      console.log("SignalingServer: Broadcasting to room:", roomName);
      socket.broadcast.to(roomName).emit("answer", answer);
    });
    socket.on("leave", (roomName) => {
      console.log("User left room:", roomName);
      socket.leave(roomName);
      socket.broadcast.to(roomName).emit("leave");
    });
  }
  broadcastEvent(roomName, event, data) {
    this.io.to(roomName).emit(event, data);
  }
};
var SignalingServer_default = SignalingServer;

export { SignalingServer, SignalingServer_default as default };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map