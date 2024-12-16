import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SignalingServer } from 'z2zlib';

import { Socket } from 'net';

// interface SocketIONextApiResponse extends NextApiResponse {
//   socket: Socket & {
//     server: HTTPServer & {
//       io?: SocketIOServer;
//       signalingServer?: typeof SignalingServer;
//     };
//   };
// }

const handler = async (req: any, res: any) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Initialize Socket.IO and SignalingServer only once
    if (!res.socket.server.io) {
      console.log('Initializing Socket.IO and SignalingServer...');

      // Create the Socket.IO instance
      // const io = new SocketIOServer(res.socket.server, {
      //   path: '/api/socket',
      //   cors: {
      //     origin: '*', // Adjust for production
      //     methods: ['GET', 'POST'],
      //   },
      // });
      // I want to be able to do something like

      const signalingServer = new SignalingServer(res.socket.server);
      const io = SignalingServer.io;
      if (!io) {
        throw new Error('Socket.IO has not been initialized.');
      }
      res.socket.server.io = io;
      // const signalingServer = new SignalingServer(io);
      // res.socket.server.io = io;
      // res.socket.server.signalingServer
      // console.log('Socket.IO and SignalingServer initialized.');
    }

    res.end(); // End the HTTP request
  } catch (error) {
    console.error('Socket.IO initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize Socket.IO server' });
  }
};

export default handler;
