import { SignalingServer } from 'z2zlib';

const handler = async (req: any, res: any) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    if (!res.socket.server.io) {
      console.log('Initializing Socket.IO and SignalingServer...');
      const signalingServer = new SignalingServer(res.socket.server);
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
