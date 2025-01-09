'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import { generateBaseCaseProof } from '../../ZK/prove';
import { verifyProof } from '../../ZK/verify';
import { JsonProof } from 'o1js';
import useSocket from '../../../hooks/useSocket';
import TicTacToeBoard from '../../../components/TicTacToeBoard';
import { WebRTCManager } from 'z2zlib';

const Room = () => {
    const { socketInitialized } = useSocket();
    const params = useParams();
    const roomId = params?.id;

    const socketRef = useRef<typeof Socket | null>(null);
    const receivedProof = useRef<JsonProof | null>(null);
    const [hasReceivedProof, setHasReceivedProof] = useState(false);
    const [roomName, setRoomName] = useState<string>(Array.isArray(roomId) ? roomId[0] : roomId?.toString() || '');
    const [isHost, setIsHost] = useState(false);
    
    
    const webRTCManagerRef = useRef<WebRTCManager | null>(null);

    useEffect(() => {
        console.log('Initializing socket connection...');
        socketRef.current = io();
        
        webRTCManagerRef.current = new WebRTCManager(socketRef.current, roomName);
        //webRTCManagerRef.current.init(isHost);

        // Set message callback
        webRTCManagerRef.current.setOnMessageCallback((data) => {
            console.log("Received JSON data:", data);
            setHasReceivedProof(true);
        });

        // Join room
        socketRef.current.emit('join', roomName);

        return () => {
            webRTCManagerRef.current?.close();
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [socketInitialized, roomName]);

    const sendJSONData = async () => {
        try {
            const jsonProof = await generateBaseCaseProof();
            webRTCManagerRef.current?.sendData(jsonProof);
            console.log("Proof sent:", jsonProof);
        } catch (error) {
            console.error("Error generating/sending proof:", error);
        }
    };

    const handleVerifyProof = () => {
        console.log("Verifying the received proof...");
        // Add your verification logic here
    };

    return (
        <div className="flex flex-col items-center space-y-4 bg-gray-50 p-4 rounded-lg shadow-sm">
            <h1 className="text-2xl font-semibold text-center">
                Tic Tac Toe - {isHost ? 'Host' : 'Guest'}
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
            <div className="mt-4 p-4 bg-blue-100 rounded-lg shadow-inner">
                <p className="text-sm text-blue-700">
                    Connection Status: {webRTCManagerRef.current ? 'Connected' : 'Not connected'}
                </p>
            </div>
        </div>
    );
};

export default Room;