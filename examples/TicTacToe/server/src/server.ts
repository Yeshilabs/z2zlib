import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { SignalingServer } from "z2zlib/server";

const app = express();
const port = 3000;
const server = createServer(app);

// Initialize SignalingServer
const io = new SocketIOServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

new SignalingServer(server);

app.get("/", (req, res) => {
    res.send("WebSocket Signaling Server is running!");
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

