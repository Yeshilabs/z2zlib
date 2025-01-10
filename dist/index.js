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
  }
  peerConnection = null;
  dataChannel = null;
  onMessageCallback = null;
  isHost = false;
  init() {
    console.log("Initializing WebRTCManager");
    this.setupWSListeners();
  }
  setupWSListeners = () => {
    console.log("Setting up WebRTCManager listeners");
    this.socket.on("connect", this.handleConnect);
    this.socket.on("created", this.handleRoomCreated);
    this.socket.on("joined", this.handleRoomJoined);
    this.socket.on("ready", this.initiateCall);
    this.socket.on("offer", this.handleOffer);
    this.socket.on("answer", this.handleAnswer);
    this.socket.on("ice-candidate", this.handleIceCandidate);
    this.socket.on("leave", this.close);
  };
  handleConnect = () => {
    console.log("Connected to signaling server");
    this.socket.emit("join", this.roomName);
  };
  handleRoomCreated = () => {
    console.log("Room created - You are the host!");
    this.isHost = true;
  };
  handleRoomJoined = () => {
    console.log("Room joined - You are the peer");
    this.isHost = false;
    this.socket.emit("ready", this.roomName);
  };
  initiateCall = async () => {
    if (this.isHost) {
      try {
        this.peerConnection = this.createPeerConnection();
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        console.log("Sending offer:", offer);
        this.socket.emit("offer", offer, this.roomName);
      } catch (error) {
        console.error("Error initiating call:", error);
      }
    }
  };
  createPeerConnection = () => {
    const connection = new RTCPeerConnection(this.iceServers);
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate");
        this.socket.emit("ice-candidate", event.candidate, this.roomName);
      }
    };
    connection.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", connection.iceConnectionState);
    };
    if (this.isHost) {
      console.log("Creating data channel as host");
      const dataChannel = connection.createDataChannel("jsonChannel");
      this.setupDataChannelListener(dataChannel);
      this.dataChannel = dataChannel;
    } else {
      console.log("Setting up data channel handler as peer");
      connection.ondatachannel = (dc) => {
        this.setupDataChannelListener(dc.channel);
        this.dataChannel = dc.channel;
      };
    }
    return connection;
  };
  setupDataChannelListener = (channel) => {
    channel.onopen = () => console.log("Data channel opened");
    channel.onclose = () => console.log("Data channel closed");
    channel.onmessage = this.handleDataChannelMessage;
  };
  handleDataChannelMessage = (event) => {
    try {
      const jsonData = JSON.parse(event.data);
      if (this.onMessageCallback) {
        this.onMessageCallback(jsonData);
      } else {
        console.log("Received JSON data : ", jsonData);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  };
  // private setupDataChannel(channel: RTCDataChannel): void {
  //   channel.onopen = () => console.log('Data channel opened');
  //   channel.onclose = () => console.log('Data channel closed');
  //   channel.onmessage = (event: MessageEvent) => {
  //     try {
  //       const jsonData = JSON.parse(event.data);
  //       if (this.onMessageCallback) {
  //         this.onMessageCallback(jsonData);
  //       }
  //     } catch (error) {
  //       console.error("Error parsing message:", error);
  //     }
  //   };
  // }
  handleOffer = async (offer) => {
    if (this.isHost) return;
    this.peerConnection = this.createPeerConnection();
    try {
      const sessionDescription = new RTCSessionDescription({
        type: offer.type,
        sdp: offer.sdp
      });
      await this.peerConnection.setRemoteDescription(sessionDescription);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit("answer", answer, this.roomName);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };
  handleAnswer = async (answer) => {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    if (!this.isHost) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("Remote description set successfully");
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  };
  handleIceCandidate = async (candidate) => {
    try {
      if (this.peerConnection?.remoteDescription) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        console.log("Queuing ICE candidate - no remote description");
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  };
  createAndSendOffer = async () => {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    if (!this.isHost) return;
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.socket.emit("offer", offer, this.roomName);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };
  setOnMessageCallback = (callback) => {
    this.onMessageCallback = callback;
  };
  sendData = (data) => {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(JSON.stringify(data));
    } else {
      console.log("Data channel is not open - state :", this.dataChannel?.readyState);
      console.error("Data channel is not open - state :", this.dataChannel?.readyState);
    }
  };
  close = () => {
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.peerConnection = null;
    this.dataChannel = null;
  };
};

export { SignalingServer_default as SignalingServer, WebRTCManager, isJsonProof };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map