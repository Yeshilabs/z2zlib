'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import io, { type Socket } from 'socket.io-client';
import { generateBaseCaseProof, type ProofOutput } from '../../ZK/prove';
import { verifyProof } from '../../ZK/verify';
import { JsonProof } from 'o1js';
import useSocket from '../../../hooks/useSocket';
import TicTacToeBoard from '../../../components/TicTacToeBoard';


const Room = () => {
    useSocket();
    const params = useParams();
    const roomId = params?.id;

    const rtcConnectionRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<typeof Socket | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const hostRef = useRef(false);
    const receivedProof = useRef<JsonProof | null>(null);
    const [hasReceivedProof, setHasReceivedProof] = useState(false);
    const [roomName, setRoomName] = useState(roomId);

    useEffect(() => {
        socketRef.current = io();
        socketRef.current.emit('join', roomName);

        socketRef.current.on('created', () => {
            hostRef.current = true;
        });
        socketRef.current.on('joined', () => {
            socketRef.current?.emit('ready', roomName);
        });
        socketRef.current.on('ready', initiateCall);
        socketRef.current.on('offer', handleReceivedOffer);
        socketRef.current.on('answer', handleAnswer);
        socketRef.current.on('ice-candidate', handleNewIceCandidate);

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [roomName]);

    const ICE_SERVERS = { iceServers: [{ urls: 'stun:openrelay.metered.ca:80' }] };

    const initiateCall = () => {
        if (hostRef.current) {
            rtcConnectionRef.current = createPeerConnection();
            rtcConnectionRef.current
                ?.createOffer()
                .then((offer) => {
                    rtcConnectionRef.current?.setLocalDescription(offer);
                    socketRef.current?.emit('offer', offer, roomName);
                })
                .catch(console.log);
        }
    };

    const createPeerConnection = () => {
        const connection = new RTCPeerConnection(ICE_SERVERS);
        connection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('ice-candidate', event.candidate, roomName);
            }
        };

        if (hostRef.current) {
            const dataChannel = connection.createDataChannel('jsonChannel');
            dataChannel.onopen = () => console.log("Data channel is open");
            dataChannel.onmessage = handleDataChannelMessage;
            dataChannelRef.current = dataChannel;
        } else {
            connection.ondatachannel = (event) => {
                dataChannelRef.current = event.channel;
                dataChannelRef.current.onmessage = handleDataChannelMessage;
            };
        }

        return connection;
    };

    const handleDataChannelMessage = (event: MessageEvent) => {
        const receivedData = JSON.parse(event.data);
        console.log("Received JSON data:", receivedData);
        setHasReceivedProof(true);  // Set proof as received to enable the button
        receivedProof.current = receivedData;
    };

    const handleReceivedOffer = (offer: RTCSessionDescriptionInit) => {
        if (!hostRef.current) {
            rtcConnectionRef.current = createPeerConnection();
            rtcConnectionRef.current?.setRemoteDescription(offer);
            rtcConnectionRef.current
                ?.createAnswer()
                .then((answer) => {
                    rtcConnectionRef.current?.setLocalDescription(answer);
                    socketRef.current?.emit('answer', answer, roomName);
                })
                .catch(console.log);
        }
    };

    const handleAnswer = (answer: RTCSessionDescriptionInit) => {
        rtcConnectionRef.current?.setRemoteDescription(answer).catch(console.log);
    };

    const handleNewIceCandidate = (candidate: RTCIceCandidateInit) => {
        rtcConnectionRef.current
            ?.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(console.log);
    };

    const sendJSONData = async () => {
        if (dataChannelRef.current?.readyState === 'open') {
            try {
                const jsonProof = await generateBaseCaseProof();
                dataChannelRef.current.send(JSON.stringify(jsonProof));
                console.log("Proof sent:", jsonProof);
            } catch (error) {
                console.error("Error generating proof:", error);
            }
        } else {
            console.log("Data channel is not open");
        }
    };

    const handleVerifyProof = () => {
        console.log("Verifying the received proof...");
        if (receivedProof.current) {
            verifyProof(receivedProof.current);
        } else {
            console.log("No proof received yet");
        }
        // Add your verification logic here
    };

    return (
        <div className="flex flex-col items-center space-y-4 bg-gray-50 p-4 rounded-lg shadow-sm">
            {/* <button
                onClick={sendJSONData}
                className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-200"
            >
                Send Base Case Proof
            </button>
            <button
                onClick={handleVerifyProof}
                disabled={!hasReceivedProof}  // Disable if proof is not received
                className={`px-6 py-3 rounded-lg transition duration-200 ${
                    hasReceivedProof
                        ? 'text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
            >
                Verify Proof
            </button> */}
            <h1 className="text-2xl font-semibold text-center">Tic Tac Toe</h1>
            <TicTacToeBoard />
        </div>
    );
};

export default Room;
