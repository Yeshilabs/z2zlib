'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import io from 'socket.io-client';
import { WebRTCManager } from 'z2zlib';
import { TicTacToeState, TicTacToeTransition, TicTacToeMove } from '../../../logic/TicTacToeState';
import { StateManager } from 'z2zlib';
import TicTacToeBoard from '../../../components/TicTacToeBoard';
// import { generateBaseCaseProof } from '../../ZK/prove';
export const dynamic = 'force-static';

const Room = () => {
  const params = useParams();
  const roomId = params?.id;
  const webRTCManagerRef = useRef<WebRTCManager | null>(null);
  const stateManagerRef = useRef<StateManager<TicTacToeState, TicTacToeMove> | null>(null);
  const [gameState, setGameState] = useState<TicTacToeState>(new TicTacToeState());
  const hasReceivedProof = false;
  const [isHost, setIsHost] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      //Initialize state manager

      stateManagerRef.current = new StateManager(
        new TicTacToeState(),
        new TicTacToeTransition(),
      );
      // Subscribe to state changes
      stateManagerRef.current.onStateUpdate((state: any) => {
        setGameState(state);
      });
      const socket = io('http://localhost:3000');


      webRTCManagerRef.current = new WebRTCManager(socket, roomId.toString(), stateManagerRef.current, () => {setIsHost(webRTCManagerRef.current?.isHost || false)});



      // Handle game moves received over WebRTC
      // webRTCManagerRef.current.setOnMessageCallback((data: any) => {
      //   console.log('Received data:', data);
      //   if (data.type === 'GAME_MOVE' && data.move) {
      //     console.log('Applying move:', data.move);
      //     stateManagerRef.current?.applyMove(data.move);
      //   }
      // });

      webRTCManagerRef.current.init();
    }

    return () => {
      webRTCManagerRef.current?.close();
    };
  }, [roomId]);

  const handleCellClick = (position: number) => {
    if (!webRTCManagerRef.current || !stateManagerRef.current) return;

    const move: TicTacToeMove = {
      position,
      player: webRTCManagerRef.current.isHost ? '1' : '2',
    };

    try {
      // Apply move locally
      stateManagerRef.current.applyMove(move);

      // Send move to peer with correct message format
      webRTCManagerRef.current.sendData('GAME_MOVE', { type: 'GAME_MOVE', move });
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  const printDataChannelState = () => {
    console.log("Data channel state:", webRTCManagerRef.current?.dataChannel?.readyState);
  }


  const onVerifyProof = () => {
    console.log("Verifying the received proof...");
    // Add verification logic here
  };
  // const sendProofViaDataChannel = async () => {
  //   if (webRTCManagerRef.current?.dataChannel?.readyState === 'open') {
  //     try {
  //       // const jsonProof = await generateBaseCaseProof();
  //       webRTCManagerRef.current.sendData('dummyProof', jsonProof);
  //       console.log("Proof sent:", jsonProof);
  //     } catch (error) {
  //       console.error("Error generating proof:", error);
  //     }
  //   } else {
  //     console.log("Data channel is not open");
  //   }
  // };

  const sendSignedData = () => {
    if (webRTCManagerRef.current) {
      webRTCManagerRef.current.sendSignedData('dummyDataLabel', {
        message: 'Hello, world!',
      });
    }
  };

  const sendStateUpdate = () => {
    if (webRTCManagerRef.current && stateManagerRef.current) {
        let player: '1' | '2' = webRTCManagerRef.current.isHost ? '1' : '2';
        let move: TicTacToeMove = {
            position: 0,
            player: player
        };
        let newState = stateManagerRef.current.applyMove(move);


        webRTCManagerRef.current.sendSignedData('StateUpdate', {state: newState, move: move});
    }
  };

    return (
      <div className="flex flex-col items-center space-y-4 bg-gray-50 p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold text-center">
          ZK Tic Tac Toe
        </h1>
        {/* <button onClick={generateBaseCaseProof} className='bg-blue-500 text-white p-2 rounded-md'>Generate Base Case Proof</button> */}
        <TicTacToeBoard
          board={gameState.board}
          onCellClick={(position) => {
            if (webRTCManagerRef.current && stateManagerRef.current) {
              const player = isHost ? '1' : '2';
              const move = { position, player } as TicTacToeMove;
              const newState = stateManagerRef.current.applyMove(move);
              webRTCManagerRef.current.sendSignedData('StateUpdate', {
                state: newState,
                move: move
              });
            }
          }}
          isMyTurn={
            isHost
              ? gameState.currentPlayer === '1'
              : gameState.currentPlayer === '2'
          }
          currentPlayer={gameState.currentPlayer}
          winner={gameState.winner}
          isHost={isHost}
        />

        <div className="mt-8 p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
          <pre className="text-sm bg-gray-50 p-2 rounded">
            {JSON.stringify(gameState, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  export default Room;
