'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import { generateBaseCaseProof } from '../../ZK/prove';
import { verifyProof } from '../../ZK/verify';
import { JsonProof } from 'o1js';
import { WebRTCManager } from 'z2zlib';
import useSocket from '../../../hooks/useSocket';
import TicTacToeBoard from '../../../components/TicTacToeBoard';

const Room = () => {
  const { socketInitialized } = useSocket();
  const params = useParams();
  const roomId = params?.id;
  const webRTCManagerRef = useRef<WebRTCManager | null>(null);
  const rtcConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<typeof Socket | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const hostRef = useRef(false);
  const receivedProof = useRef<JsonProof | null>(null);
  const [hasReceivedProof, setHasReceivedProof] = useState(false);
  const [roomName, setRoomName] = useState(roomId);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    console.log('Initializing socket connection...');
    socketRef.current = io();
    if (roomName) {
      webRTCManagerRef.current = new WebRTCManager(socketRef.current, roomName.toString());
      webRTCManagerRef.current.init();
      setIsHost(webRTCManagerRef.current.isHost);
    }

    // socketRef.current.on('created', () => {
    //   handleRoomCreated();
    // });
    // socketRef.current.on('connect', () => {
    //   console.log('client conneceted');
    //   socketRef.current?.emit('join', roomName);
    //   console.log('client emitted join')
    // });

    // socketRef.current.on('ready', initiateCall);
    // socketRef.current.on('offer', handleReceivedOffer);
    // socketRef.current.on('leave', handlePeerLeave);
    // socketRef.current.on('joined', handleRoomJoined);
    // socketRef.current.on('answer', handleAnswer);
    // socketRef.current.on('ice-candidate', handleNewIceCandidate);

    return () => {
      // console.log('Cleaning up socket connection...');
      // socketRef.current?.disconnect();
      // socketRef.current = null;
      // rtcConnectionRef.current?.close();
      // dataChannelRef.current?.close();
      webRTCManagerRef.current?.close();
    };
  }, [socketInitialized, roomName]);

  const handleRoomCreated = () => {
    console.log('Room created - You are the host');
    hostRef.current = true;
    setIsHost(true);
    console.log('-> DEBUG: hostRef.current = ', hostRef.current);
  };

  const handleRoomJoined = () => {
    console.log('Room joined - You are the peer');
    setIsHost(false);
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
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  };

  const createPeerConnection = () => {
    const connection = new RTCPeerConnection(ICE_SERVERS);

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate");
        socketRef.current?.emit('ice-candidate', event.candidate, roomName);
      }
    };

    connection.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', connection.iceConnectionState);
    };

    if (hostRef.current) {
      console.log("Creating data channel as host");
      const dataChannel = connection.createDataChannel('jsonChannel');
      setupDataChannel(dataChannel);
      dataChannelRef.current = dataChannel;
    } else {
      console.log("Setting up data channel handler as peer");
      connection.ondatachannel = (event) => {
        console.log("Received data channel");
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

  const initiateCall = async () => {
    if (hostRef.current) {
      try {
        rtcConnectionRef.current = createPeerConnection();
        const offer = await rtcConnectionRef.current.createOffer();
        await rtcConnectionRef.current.setLocalDescription(offer);
        console.log("Sending offer:", offer);
        socketRef.current?.emit('offer', offer, roomName);
      } catch (error) {
        console.error("Error initiating call:", error);
      }
    }
  };


  const handleReceivedOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!hostRef.current) {
      try {
        console.log("Received offer:", offer);
        rtcConnectionRef.current = createPeerConnection();

        const sessionDescription = new RTCSessionDescription({
          type: offer.type,
          sdp: offer.sdp
        });

        await rtcConnectionRef.current.setRemoteDescription(sessionDescription);
        const answer = await rtcConnectionRef.current.createAnswer();
        await rtcConnectionRef.current.setLocalDescription(answer);
        console.log("Sending answer:", answer);
        socketRef.current?.emit('answer', answer, roomName);
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    }
  };


  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      //console.log("Received answer:", answer);
      if (!answer || !answer.type || !answer.sdp) {
        console.error("Invalid answer received:", answer);
        return;
      }

      if (rtcConnectionRef.current && !rtcConnectionRef.current.remoteDescription) {
        const sessionDescription = new RTCSessionDescription({
          type: answer.type,
          sdp: answer.sdp
        });
        await rtcConnectionRef.current.setRemoteDescription(sessionDescription);
        console.log("Remote description set successfully");
      }
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  };



  const handleNewIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (rtcConnectionRef.current?.remoteDescription) {
        await rtcConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        console.log("Queuing ICE candidate");
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  const handleDataChannelMessage = (event: MessageEvent) => {
    const receivedData = JSON.parse(event.data);
    console.log("Received JSON data:", receivedData);
    setHasReceivedProof(true);  // Set proof as received to enable the button
  };

  const sendJSONData = async () => {
    if (webRTCManagerRef.current?.dataChannel?.readyState === 'open') {
      try {
        const jsonProof = await generateBaseCaseProof();
        webRTCManagerRef.current.sendData(jsonProof);
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
    </div>
  );
};

export default Room;
