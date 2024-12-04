import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { WebRTCManager } from '../WebRTCManager';

// Mock for RTCPeerConnection and RTCDataChannel
class MockRTCDataChannel {
  readyState = 'open';
  send = vi.fn();
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  triggerMessage(data: string) {
    if (this.onmessage) this.onmessage({ data });
  }
}

class MockRTCPeerConnection {
  dataChannel: MockRTCDataChannel | null = null;
  localDescription: RTCSessionDescription | null = null;
  remoteDescription: RTCSessionDescription | null = null;
  iceCandidates: RTCIceCandidate[] = [];
  createDataChannel = vi.fn(() => {
    this.dataChannel = new MockRTCDataChannel();
    return this.dataChannel;
  });
  createOffer = vi.fn(async () => ({ type: 'offer', sdp: 'mock-offer-sdp' }));
  createAnswer = vi.fn(async () => ({ type: 'answer', sdp: 'mock-answer-sdp' }));
  setLocalDescription = vi.fn(async (desc: RTCSessionDescription) => {
    this.localDescription = desc;
  });
  setRemoteDescription = vi.fn(async (desc: RTCSessionDescription) => {
    this.remoteDescription = desc;
  });
  addIceCandidate = vi.fn(async (candidate: RTCIceCandidate) => {
    this.iceCandidates.push(candidate);
  });
  onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null = null;

  triggerICECandidate(candidate: RTCIceCandidate) {
    if (this.onicecandidate) this.onicecandidate({ candidate });
  }
}

// Mock for global RTCPeerConnection
global.RTCPeerConnection = MockRTCPeerConnection as any;

describe('WebRTCManager', () => {
  let signalingMock: ReturnType<typeof vi.fn>;
  let manager: WebRTCManager;

  beforeEach(() => {
    signalingMock = vi.fn(async (url, options) => {
      const body = options?.body ? JSON.parse(options.body) : {};
      if (body.offer) return { json: async () => ({ offer: body.offer }) };
      if (body.answer) return { json: async () => ({ answer: body.answer }) };
      if (body.candidate) return { json: async () => ({ candidate: body.candidate }) };
      return { json: async () => ({}) };
    });

    global.fetch = signalingMock;
    manager = new WebRTCManager('http://mock-signaling-server');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize WebRTC components', async () => {
    await manager.init();
    expect(manager['peerConnection']).toBeInstanceOf(MockRTCPeerConnection);
    expect(manager['dataChannel']).toBeInstanceOf(MockRTCDataChannel);
  });

  it('should create an offer and send it via signaling', async () => {
    await manager.init();
    await manager.createOffer();

    expect(manager['peerConnection']?.createOffer).toHaveBeenCalled();
    expect(manager['peerConnection']?.setLocalDescription).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'offer' })
    );
    expect(signalingMock).toHaveBeenCalledWith(
      'http://mock-signaling-server',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ offer: expect.objectContaining({ sdp: 'mock-offer-sdp' }) }),
      })
    );
  });

  it('should receive an offer and send an answer', async () => {
    await manager.init();
    signalingMock.mockResolvedValueOnce({
      json: async () => ({ offer: { type: 'offer', sdp: 'mock-offer-sdp' } }),
    });

    await manager.receiveOfferAndAnswer();

    expect(manager['peerConnection']?.setRemoteDescription).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'offer', sdp: 'mock-offer-sdp' })
    );
    expect(manager['peerConnection']?.createAnswer).toHaveBeenCalled();
    expect(manager['peerConnection']?.setLocalDescription).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'answer' })
    );
    expect(signalingMock).toHaveBeenCalledWith(
      'http://mock-signaling-server',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ answer: expect.objectContaining({ sdp: 'mock-answer-sdp' }) }),
      })
    );
  });

  it('should connect to a peer by applying an answer and ICE candidates', async () => {
    await manager.init();
    signalingMock.mockResolvedValueOnce({
      json: async () => ({ answer: { type: 'answer', sdp: 'mock-answer-sdp' } }),
    });
    signalingMock.mockResolvedValueOnce({
      json: async () => ({ candidates: [{ candidate: 'mock-candidate' }] }),
    });

    await manager.connectToPeer();

    expect(manager['peerConnection']?.setRemoteDescription).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'answer', sdp: 'mock-answer-sdp' })
    );
    expect(manager['peerConnection']?.addIceCandidate).toHaveBeenCalledWith(
      expect.objectContaining({ candidate: 'mock-candidate' })
    );
  });

  it('should send JSON data through the data channel', async () => {
    await manager.init();
    const mockData = { message: 'Hello' };

    manager.sendJSONData(mockData);

    expect(manager['dataChannel']?.send).toHaveBeenCalledWith(JSON.stringify(mockData));
  });

  it('should trigger the onMessageCallback when receiving data', async () => {
    await manager.init();
    const mockCallback = vi.fn();
    const mockData = { message: 'Hello from peer' };

    manager.setOnMessageCallback(mockCallback);
    (manager['dataChannel'] as MockRTCDataChannel).triggerMessage(JSON.stringify(mockData));

    expect(mockCallback).toHaveBeenCalledWith(mockData);
  });

  it('should clean up resources on close', async () => {
    await manager.init();
    manager.close();

    expect(manager['peerConnection']).toBeNull();
    expect(manager['dataChannel']).toBeNull();
  });
});
