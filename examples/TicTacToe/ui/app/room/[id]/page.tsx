'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import { generateBaseCaseProof } from '../../ZK/prove';
import { verifyProof } from '../../ZK/verify';
import { JsonProof } from 'o1js';
import useSocket from '../../../hooks/useSocket';
import TicTacToeBoard from '../../../components/TicTacToeBoard';

const Room = () => {
    const { socketInitialized } = useSocket();
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
        console.log('Initializing socket connection...');
        // socketRef.current = io(window.location.origin, {
        //     path: '/api/socket',
        //     transports: ['websocket', 'polling'],
        // });
        socketRef.current = io();

        socketRef.current.on('created', () => {
            hostRef.current = true;
        });
        socketRef.current.on('joined', () => {
            socketRef.current?.emit('ready', roomName);
        });
        socketRef.current.on('connect', () => {
            console.log('client conneceted');
            socketRef.current?.emit('join', roomName);
            console.log('client emitted join')
        });

        socketRef.current.on('ready', initiateCall);
        socketRef.current.on('offer', handleReceivedOffer);
        socketRef.current.on('answer', handleAnswer);
        socketRef.current.on('ice-candidate', handleNewIceCandidate);

        return () => {
            console.log('Cleaning up socket connection...');
            socketRef.current?.disconnect();
            socketRef.current = null;
            rtcConnectionRef.current?.close();
            dataChannelRef.current?.close();
        };
    }, [socketInitialized, roomName]);

    const handleRoomCreated = () => {
        console.log('Room created - You are the host');
        hostRef.current = true;
    };

    const handleRoomJoined = () => {
        console.log('Room joined - You are the peer');
        socketRef.current?.emit('ready', roomName);
    };

    const handlePeerLeave = () => {
        console.log('Peer left the room');
        rtcConnectionRef.current?.close();
        rtcConnectionRef.current = null;
        if (!hostRef.current) {
            hostRef.current = false;
        }
    };

    const ICE_SERVERS = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    const createPeerConnection = () => {
        const connection = new RTCPeerConnection(ICE_SERVERS);

        connection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('ice-candidate', event.candidate, roomName);
            }
        };

        connection.oniceconnectionstatechange = () => {
            console.log('ICE Connection State:', connection.iceConnectionState);
        };

        if (hostRef.current) {
            const dataChannel = connection.createDataChannel('gameChannel');
            setupDataChannel(dataChannel);
            dataChannelRef.current = dataChannel;
        } else {
            connection.ondatachannel = (event) => {
                dataChannelRef.current = event.channel;
                setupDataChannel(event.channel);
            };
        }

        return connection;
    };

    const setupDataChannel = (channel: RTCDataChannel) => {
        channel.onopen = () => console.log('Data channel opened');
        channel.onclose = () => console.log('Data channel closed');
        channel.onmessage = handleDataChannelMessage;
    };

    const initiateCall = () => {
        if (hostRef.current) {
            rtcConnectionRef.current = createPeerConnection();
            rtcConnectionRef.current
                .createOffer()
                .then((offer) => {
                    rtcConnectionRef.current?.setLocalDescription(offer);
                    socketRef.current?.emit('offer', offer, roomName);
                })
                .catch(console.error);
        }
    };

    const handleReceivedOffer = async (offer: RTCSessionDescriptionInit) => {
        if (!hostRef.current) {
            rtcConnectionRef.current = createPeerConnection();
            await rtcConnectionRef.current.setRemoteDescription(offer);
            const answer = await rtcConnectionRef.current.createAnswer();
            await rtcConnectionRef.current.setLocalDescription(answer);
            socketRef.current?.emit('answer', answer, roomName);
        }
    };

    const handleAnswer = (answer: RTCSessionDescriptionInit) => {
        rtcConnectionRef.current?.setRemoteDescription(answer).catch(console.error);
    };

    const handleNewIceCandidate = (candidate: RTCIceCandidateInit) => {
        rtcConnectionRef.current
            ?.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(console.error);
    };

    const handleDataChannelMessage = (event: MessageEvent) => {
        try {
            const receivedData = JSON.parse(event.data);
            console.log("Received data:", receivedData);
            setHasReceivedProof(true);
            receivedProof.current = receivedData;
        } catch (error) {
            console.error("Error processing message:", error);
        }
    };

    const sendProof = async () => {
        if (dataChannelRef.current?.readyState === 'open') {
            try {
                const proof = await generateBaseCaseProof();
                dataChannelRef.current.send(JSON.stringify(proof));
                console.log("Proof sent:", proof);
            } catch (error) {
                console.error("Error generating/sending proof:", error);
            }
        } else {
            console.warn("Data channel not ready");
        }
    };

    const verifyReceivedProof = () => {
        if (receivedProof.current) {
            verifyProof(receivedProof.current);
        } else {
            console.warn("No proof to verify");
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4 bg-gray-50 p-4 rounded-lg shadow-sm">
            <h1 className="text-2xl font-semibold text-center">
                Tic Tac Toe - {hostRef.current ? 'Host' : 'Guest'}
            </h1>
            <div className="flex space-x-4 mb-4">
                <button
                    onClick={sendProof}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Send Proof
                </button>
                <button
                    onClick={verifyReceivedProof}
                    disabled={!hasReceivedProof}
                    className={`px-4 py-2 rounded ${
                        hasReceivedProof
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