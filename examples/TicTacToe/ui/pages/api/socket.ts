// TODO export polyfills from z2zlib
//import 'isomorphic-fetch';

if (typeof window === 'undefined') {
  (global as any).self = global;
}



import type { NextApiRequest, NextApiResponse } from 'next';
import type { Socket } from 'net';
import type { Server as HTTPServer } from 'http';
import { SignalingServer } from 'z2zlib';

interface SocketWithIO extends Socket {
  server: HTTPServer & {
    io?: any;  // You can make this more specific based on your SignalingServer type
  };
}

// Enhance the NextApiResponse type
interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

const handler = async (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    if (!res.socket.server.io) {
      console.log('Initializing Socket.IO and SignalingServer...');
      const io = SignalingServer.io;
      if (!io) {
        throw new Error('Socket.IO has not been initialized.');
      }
      res.socket.server.io = io;
    }
    res.end();
  } catch (error) {
    console.error('Socket.IO initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize Socket.IO server' });
  }
};

export default handler;

