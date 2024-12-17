"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_1 = require("socket.io");
var SignalingServer = /** @class */ (function () {
    function SignalingServer(server) {
        this.io = new socket_io_1.Server(server);
        this.setupListeners();
    }
    SignalingServer.prototype.setupListeners = function () {
        var _this = this;
        this.io.on("connection", function (socket) {
            console.log("User connected: ", socket.id);
            _this.setupSocketEvents(socket);
        });
    };
    SignalingServer.prototype.setupSocketEvents = function (socket) {
        var io = this.io;
        socket.on("join", function (roomName) {
            console.log("User joined room: ", roomName);
            var room = io.sockets.adapter.rooms.get(roomName);
            if (!room) {
                socket.join(roomName);
                socket.emit("created", roomName);
            }
            else if (room.size === 1) {
                socket.join(roomName);
                socket.emit("joined", roomName);
            }
            else {
                socket.emit("full", roomName);
            }
            console.log(io.sockets.adapter.rooms);
        });
        socket.on("ready", function (roomName) {
            console.log("User is ready: ", roomName);
            socket.broadcast.to(roomName).emit("ready");
        });
        socket.on("ice-candidate", function (candidate, roomName) {
            console.log("Received ICE candidate: ", candidate);
            socket.broadcast.to(roomName).emit("ice-candidate", candidate);
        });
        socket.on("offer", function (offer, roomName) {
            console.log("Received offer: ", offer);
            socket.broadcast.to(roomName).emit("offer", offer);
        });
        socket.on("answer", function (answer, roomName) {
            console.log("Received answer");
            socket.broadcast.to(roomName).emit("answer", answer);
        });
        socket.on("leave", function (roomName) {
            console.log("User left room: ", roomName);
            socket.leave(roomName);
            socket.broadcast.to(roomName).emit("leave");
        });
    };
    SignalingServer.prototype.broadcastEvent = function (roomName, event, data) {
        this.io.to(roomName).emit(event, data);
    };
    SignalingServer.prototype.getSocketIOInstance = function () {
        return this.io;
    };
    return SignalingServer;
}());
exports.default = SignalingServer;
