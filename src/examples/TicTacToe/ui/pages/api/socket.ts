import { Server } from "socket.io";

//TODO: Add types
const SocketHandler = (req:any, res:any) => {
    if (res.socket.server.io) {
        console.log('Socket is already attached');
        return res.end();
    }
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {

        console.log('User connected: ', socket.id);

        socket.on("join", (roomName) => {
            console.log('User joined room: ', roomName);
            const { rooms } = io.sockets.adapter;
            const room = rooms.get(roomName);

            if (room === undefined) {
                socket.join(roomName);
                socket.emit("created", roomName);
            } else if (room.size === 1) { // max two peers joining for the moment TODO: add capability for n peers
                socket.join(roomName);
                socket.emit("joined", roomName);
            } else {
                socket.emit("full", roomName);
            }
            console.log(rooms);
        });

        socket.on("ready", (roomName) => {
            console.log('User is ready: ', roomName);
            socket.broadcast.to(roomName).emit("ready"); // broadcast to the other peers when ready
        });

        socket.on("ice-candidate", (candidate: RTCIceCandidate, roomName: string) => {
            console.log('Received ICE candidate: ', candidate);
            socket.broadcast.to(roomName).emit("ice-candidate", candidate);
        });

        socket.on("offer", (offer, roomName) => {
            console.log('Received offer: ', offer);
            socket.broadcast.to(roomName).emit("offer", offer);
        });

        socket.on("answer", (answer, roomName) => {
            console.log('Received answer');
            socket.broadcast.to(roomName).emit("answer", answer); // Sends Answer to the other peer in the room.
          });

        socket.on("leave", (roomName) => {
            console.log('User left room: ', roomName);
            socket.leave(roomName);
            socket.broadcast.to(roomName).emit("leave");
        });

    });
    return res.end();
};

export default SocketHandler;