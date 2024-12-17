import { useEffect, useRef } from "react";

const useSocket = () => {
  const socketCreated = useRef(false);
  const socketInitialized = useRef(false);

  useEffect(() => {
    if (!socketCreated.current && !socketInitialized.current) {
      const socketInitializer = async () => {
        try {
          console.log('Initializing socket client side');
          const response = await fetch('/api/socket');
          if (response.ok) {
            socketCreated.current = true;
          } else {
            console.error('Failed to initialize socket server:', response.statusText);
          }
        } catch (error) {
          console.error('Error initializing socket:', error);
        } finally {
          socketInitialized.current = true;
        }
      };

      socketInitializer();
    }

    return () => {
      socketCreated.current = false;
      socketInitialized.current = false;
    };
  }, []);

  return { socketInitialized: socketInitialized.current };
};

export default useSocket;