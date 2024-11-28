import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { Server } from "socket.io";
import { io as ClientIO, Socket as ClientSocket } from "socket.io-client";
import http from "http";
import SignalingServer from "../SignalingServer";

describe("SignalingServer", () => {
    let httpServer: http.Server;
    let signalingServer: SignalingServer;
    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;

    const SOCKET_URL = "http://localhost:3001";

    beforeEach(() => {
        // Create an HTTP server
        httpServer = http.createServer();
        signalingServer = new SignalingServer(httpServer);
        httpServer.listen(3001);

        // Connect mock clients
        clientSocket1 = ClientIO(SOCKET_URL);
        clientSocket2 = ClientIO(SOCKET_URL);
    });

    afterEach(() => {
        // Clean up resources
        clientSocket1.close();
        clientSocket2.close();
        httpServer.close();
    });

    it("should allow a client to connect", (done) => {
        clientSocket1.on("connect", () => {
            expect(clientSocket1.id).toBeDefined();
            done();
        });
    });

    it("should allow a client to join a room", (done) => {
        clientSocket1.emit("join", "room1");
        clientSocket1.on("created", (roomName) => {
            expect(roomName).toBe("room1");
            done();
        });
    });

    it("should notify when a second client joins the same room", (done) => {
        clientSocket1.emit("join", "room1");

        clientSocket1.on("created", () => {
            clientSocket2.emit("join", "room1");
        });

        clientSocket2.on("joined", (roomName) => {
            expect(roomName).toBe("room1");
            done();
        });
    });

    it("should emit 'full' if a third client tries to join a room", (done) => {
        clientSocket1.emit("join", "room1");
        clientSocket2.emit("join", "room1");

        clientSocket1.on("created", () => {
            const clientSocket3 = ClientIO(SOCKET_URL);
            clientSocket3.emit("join", "room1");

            clientSocket3.on("full", (roomName) => {
                expect(roomName).toBe("room1");
                clientSocket3.close();
                done();
            });
        });
    });

    it("should broadcast 'ready' to other clients in the room", (done) => {
        clientSocket1.emit("join", "room1");

        clientSocket1.on("created", () => {
            clientSocket2.emit("join", "room1");
        });

        clientSocket2.on("joined", () => {
            clientSocket2.emit("ready", "room1");
        });

        clientSocket1.on("ready", () => {
            expect(true).toBe(true); // Received 'ready' broadcast
            done();
        });
    });

    it("should handle ICE candidates", (done) => {
        const mockCandidate = { candidate: "mock-candidate" };

        clientSocket1.emit("join", "room1");
        clientSocket1.on("created", () => {
            clientSocket2.emit("join", "room1");
        });

        clientSocket2.on("joined", () => {
            clientSocket2.emit("ice-candidate", mockCandidate, "room1");
        });

        clientSocket1.on("ice-candidate", (candidate) => {
            expect(candidate).toEqual(mockCandidate);
            done();
        });
    });

    it("should handle offer and answer events", (done) => {
        const mockOffer = { type: "offer", sdp: "mock-sdp" };
        const mockAnswer = { type: "answer", sdp: "mock-sdp" };

        clientSocket1.emit("join", "room1");
        clientSocket1.on("created", () => {
            clientSocket2.emit("join", "room1");
        });

        clientSocket2.on("joined", () => {
            clientSocket2.emit("offer", mockOffer, "room1");
        });

        clientSocket1.on("offer", (offer) => {
            expect(offer).toEqual(mockOffer);
            clientSocket1.emit("answer", mockAnswer, "room1");
        });

        clientSocket2.on("answer", (answer) => {
            expect(answer).toEqual(mockAnswer);
            done();
        });
    });

    it("should handle leave events", (done) => {
        clientSocket1.emit("join", "room1");
        clientSocket1.on("created", () => {
            clientSocket2.emit("join", "room1");
        });

        clientSocket2.on("joined", () => {
            clientSocket2.emit("leave", "room1");
        });

        clientSocket1.on("leave", () => {
            expect(true).toBe(true); // Received 'leave' event
            done();
        });
    });
});
