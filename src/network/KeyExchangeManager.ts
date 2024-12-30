export interface Participant {
  id: string;
  publicKey: string;
}

export class KeyExchangeManager {
  private participants: Map<string, Participant>;

  constructor() {
    this.participants = new Map();
  }

  // Register a participant with their public key
  registerParticipant(id: string, publicKey: string): void {
    if (this.participants.has(id)) {
      throw new Error(`Participant with ID ${id} is already registered.`);
    }
    this.participants.set(id, { id, publicKey });
  }

  // Exchange keys between two participants
  exchangeKeys(participantAId: string, participantBId: string): [Participant, Participant] {
    const participantA = this.participants.get(participantAId);
    const participantB = this.participants.get(participantBId);

    if (!participantA || !participantB) {
      throw new Error('Both participants must be registered before exchanging keys.');
    }

    // Simulate key exchange process
    console.log(`Exchanging keys between ${participantAId} and ${participantBId}`);
    return [participantA, participantB];
  }

  // Verify a participant's public key
  verifyPublicKey(id: string, publicKey: string): boolean {
    const participant = this.participants.get(id);
    return participant ? participant.publicKey === publicKey : false;
  }
}
