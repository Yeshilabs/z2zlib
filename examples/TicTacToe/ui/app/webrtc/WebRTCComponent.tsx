'use client';

import { useEffect, useState } from 'react';

type JsonData = { [key: string]: any };

const WebRTCComponent: React.FC = () => {
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [receivedData, setReceivedData] = useState<JsonData | null>(null);

  useEffect(() => {
    const initWebRTC = async () => {
      const pc = new RTCPeerConnection();

      const channel = pc.createDataChannel('jsonChannel');
      channel.onopen = () => console.log('Data channel is open');
      channel.onclose = () => console.log('Data channel is closed');
      channel.onmessage = (event: MessageEvent) => {
        const jsonData: JsonData = JSON.parse(event.data);
        setReceivedData(jsonData);
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch('/api/socket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidate: event.candidate }),
          });
        }
      };

      setPeerConnection(pc);
      setDataChannel(channel);
    };

    initWebRTC();

    return () => {
      if (peerConnection) peerConnection.close();
    };
  }, []);

  const createOffer = async () => {
    if (peerConnection) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      await fetch('/api/socket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer }),
      });
    }
  };

  const receiveOfferAndAnswer = async () => {
    if (!peerConnection) return;

    const offerResponse = await fetch('/api/socket?type=offer');
    const { offer } = await offerResponse.json();

    if (offer) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await fetch('/api/socket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
    }
  };

  const connectToPeer = async () => {
    const answerResponse = await fetch('/api/socket?type=answer');
    const { answer } = await answerResponse.json();
    if (answer) {
      await peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));
    }

    const candidatesResponse = await fetch('/api/socket?type=candidates');
    const { candidates } = await candidatesResponse.json();
    candidates.forEach((candidate: RTCIceCandidateInit) => {
      peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
    });
  };

  const sendJSONData = (data: JsonData) => {
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(data));
    }
  };

  return (
    <div>
      <button onClick={createOffer}>Create Offer</button>
      <button onClick={receiveOfferAndAnswer}>Receive Offer and Send Answer</button>
      <button onClick={connectToPeer}>Connect to Peer</button>
      <button onClick={() => sendJSONData({ message: 'Hello from tab!' })}>Send JSON Data</button>
      {receivedData && (
        <div>
          <h3>Received JSON Data:</h3>
          <pre>{JSON.stringify(receivedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default WebRTCComponent;
