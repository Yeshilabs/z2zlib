'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import { generateBaseCaseProof } from '../../ZK/prove';
import { verifyProof } from '../../ZK/verify';
import { JsonProof } from 'o1js';
import useSocket from '../../../hooks/useSocket';
import TicTacToeBoard from '../../../components/TicTacToeBoard';
import { WebRTCManager, JsonData, isJsonProof } from 'z2zlib';

const Room = () => {
    const {socketInitialized} = useSocket();
    const params = useParams();
    const roomId = params?.id;

    const webRTCManagerRef = useRef<WebRTCManager | null>(null);
    const socketRef = useRef<typeof Socket | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [hasReceivedProof, setHasReceivedProof] = useState(false);
    const [roomName, setRoomName] = useState(roomId);
    const receivedProof = useRef<JsonProof | null>(null);

    useEffect(() => {
        console.log('Initializing socket connection...');
        socketRef.current = io();
        
        if (socketRef.current) {
            webRTCManagerRef.current = new WebRTCManager(
                socketRef.current,
                roomName as string
            );
        }

        const socket = socketRef.current;

        socket?.on('connect', () => {
            console.log('Client connected');
            socketRef.current?.emit('join', roomName);
        });

        socket?.on('created', async () => {
            console.log('Room created - You are the host');
            setIsHost(true);
            await webRTCManagerRef.current?.init(true);
        });

        socket?.on('joined', async () => {
            console.log('Room joined - You are the peer');
            setIsHost(false);
            await webRTCManagerRef.current?.init(false);
            socketRef.current?.emit('ready', roomName);
        });

        socket?.on('ready', async () => {
            if (isHost) {
                await webRTCManagerRef.current?.createAndSendOffer();
            }
        });

        socket?.on('offer', async (offer: RTCSessionDescriptionInit) => {
            await webRTCManagerRef.current?.handleOffer(offer);
        });

        socket?.on('answer', async (answer: RTCSessionDescriptionInit) => {
            await webRTCManagerRef.current?.handleAnswer(answer);
        });

        socket?.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
            await webRTCManagerRef.current?.handleIceCandidate(candidate);
        });

        webRTCManagerRef.current?.setOnMessageCallback((data: JsonData) => {
            console.log("Received data:", data);
            if (isJsonProof(data)) {
                receivedProof.current = data;
                setHasReceivedProof(true);
            } else {
                console.warn("Received data is not a JsonProof:", data);
            }
        });


        return () => {
            webRTCManagerRef.current?.close();
            socketRef.current?.disconnect();
        };
    }, [socketInitialized, roomName]);


    const sendJSONData = async () => {
            try {
                const jsonProof = await generateBaseCaseProof();
                webRTCManagerRef.current?.sendData(jsonProof);
                console.log("Proof sent:", jsonProof);
            } catch (error) {
                console.error("Error generating proof:", error);
            }
    };

    const handleVerifyProof = () => {
        console.log("Verifying the received proof...");
        // Verification logic...
    };

    return (
        <div className="flex flex-col items-center space-y-4 bg-gray-50 p-4 rounded-lg shadow-sm">
            <h1 className="text-2xl font-semibold text-center">
                Tic Tac Toe - {isHost ? 'Host' : 'Peer'}
            </h1>
            <div className="flex space-x-4 mb-4">
                <button
                    onClick={sendJSONData}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Send Proof
                </button>
                <button
                    onClick={handleVerifyProof}
                    disabled={!hasReceivedProof}
                    className={`px-4 py-2 rounded ${hasReceivedProof
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    Verify Proof
                </button>
            </div>
            <TicTacToeBoard />
        </div>
    );
};

export default Room;