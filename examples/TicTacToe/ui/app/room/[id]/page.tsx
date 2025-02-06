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
export const dynamic = 'force-static';

const Room = () => {
  //const { socketInitialized } = useSocket();
  const params = useParams();
  const roomId = params?.id;
  const webRTCManagerRef = useRef<WebRTCManager | null>(null);
  const socketRef = useRef<typeof Socket | null>(null);
  const [hasReceivedProof, setHasReceivedProof] = useState(false);
  const [roomName, setRoomName] = useState(roomId);

  useEffect(() => {
    if (typeof window !== 'undefined') {  // Only run on client
      console.log('Initializing socket connection...');
      socketRef.current = io('http://localhost:3000');
      if (roomName && !webRTCManagerRef.current) {
        webRTCManagerRef.current = new WebRTCManager(socketRef.current, roomName.toString());
        webRTCManagerRef.current.init();
      }
    }
    return () => {
      webRTCManagerRef.current?.close();
    };
  }, [roomName]);

   const sendProofViaDataChannel = async () => {
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

  const printDataChannelState = () => {
    console.log("Data channel state:", webRTCManagerRef.current?.dataChannel?.readyState);
  }

  const onVerifyProof = () => {
    console.log("Verifying the received proof...");
    // Add verification logic here
  };

  return (
    <div className="flex flex-col items-center space-y-4 bg-gray-50 p-4 rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold text-center">
        ZK Tic Tac Toe Example
      </h1>
      <button onClick={printDataChannelState}>Print Data Channel State</button>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={sendProofViaDataChannel}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send Proof
        </button>
        <button
          onClick={onVerifyProof}
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
