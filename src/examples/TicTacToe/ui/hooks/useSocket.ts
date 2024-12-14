import { useEffect, useRef } from "react";

const useSocket = () => {
  const socketCreated = useRef(false)
  console.log('useSocket')
  useEffect(() =>{
    if (!socketCreated.current) {
      const socketInitializer = async () => {
        await fetch ('/api/signaling')
      }
      try {
        console.log('Initializing socket')
        socketInitializer()
        socketCreated.current = true
      } catch (error) {
        console.log('Error initializing socket')
        console.log(error)
      }
    }
  }, []);
};

export default useSocket