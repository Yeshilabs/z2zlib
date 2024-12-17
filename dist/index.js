import { Server } from 'socket.io';

// src/network/SignalingServer.ts
var SignalingServer = class _SignalingServer extends Server {
  // Static property to hold the Server instance
  static _instance = null;
  constructor(server) {
    super(server);
    if (!_SignalingServer._instance) {
      _SignalingServer._instance = this;
    }
    this.setupListeners();
  }
  static get io() {
    if (!_SignalingServer._instance) {
      throw new Error("SignalingServer has not been initialized.");
    }
    return _SignalingServer._instance;
  }
  setupListeners() {
    this.on("connection", (socket) => {
      console.log("User connected:", socket.id);
      this.setupSocketEvents(socket);
    });
  }
  setupSocketEvents(socket) {
    socket.on("join", (roomName) => {
      console.log("User joined room:", roomName);
      const room = this.sockets.adapter.rooms.get(roomName);
      if (!room) {
        socket.join(roomName);
        socket.emit("created", roomName);
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
    this.to(roomName).emit(event, data);
  }
};
var SignalingServer_default = SignalingServer;

// src/network/WebRTCManager.ts
function isJsonProof(data) {
  return typeof data === "object" && data !== null && "publicInput" in data && "publicOutput" in data && "maxProofsVerified" in data && "proof" in data;
}
var WebRTCManager = class {
  constructor(socket, roomName, iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  }) {
    this.socket = socket;
    this.roomName = roomName;
    this.iceServers = iceServers;
    console.log("WebRTCManager created with room:", roomName);
  }
  peerConnection = null;
  dataChannel = null;
  onMessageCallback = null;
  isHost = false;
  async init(isHost) {
    this.isHost = isHost;
    this.peerConnection = new RTCPeerConnection(this.iceServers);
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate");
        this.socket.emit("ice-candidate", event.candidate, this.roomName);
      }
    };
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", this.peerConnection?.iceConnectionState);
    };
    if (this.isHost) {
      console.log("Creating data channel as host");
      this.dataChannel = this.peerConnection.createDataChannel("jsonChannel");
      this.setupDataChannel(this.dataChannel);
    } else {
      console.log("Setting up data channel handler as peer");
      this.peerConnection.ondatachannel = (event) => {
        console.log("Received data channel");
        this.dataChannel = event.channel;
        this.setupDataChannel(event.channel);
      };
    }
  }
  setupDataChannel(channel) {
    channel.onopen = () => console.log("Data channel opened");
    channel.onclose = () => console.log("Data channel closed");
    channel.onmessage = (event) => {
      try {
        const jsonData = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(jsonData);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };
  }
  async handleOffer(offer) {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    if (this.isHost) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit("answer", answer, this.roomName);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }
  async handleAnswer(answer) {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    if (!this.isHost) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }
  async handleIceCandidate(candidate) {
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
  async createAndSendOffer() {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    if (!this.isHost) return;
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.socket.emit("offer", offer, this.roomName);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }
  setOnMessageCallback(callback) {
    this.onMessageCallback = callback;
  }
  sendData(data) {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(JSON.stringify(data));
    } else {
      console.log("Data channel is not open - state :", this.dataChannel?.readyState);
      console.error("Data channel is not open - state :", this.dataChannel?.readyState);
    }
  }
  close() {
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.peerConnection = null;
    this.dataChannel = null;
  }
};

export { SignalingServer_default as SignalingServer, WebRTCManager, isJsonProof };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map