import { SmartContract, Field, state, State, method, PublicKey, Signature, Bool, Circuit, Poseidon } from 'o1js';

export class ChannelSettlement extends SmartContract {
    // how can all participants agree on the smart contract ?
    // The initial state of the channel
    @state(Field) currentStateHash = State<Field>();
    @state(PublicKey) host = State<PublicKey>();
    @state(PublicKey) peer = State<PublicKey>();
    @state(Field) stakedAmount = State<Field>();
    @state(Bool) isChannelOpen = State<Bool>();
    @state(Bool) isHostRegistered = State<Bool>();
    @state(Bool) isPeerRegistered = State<Bool>();

    //NOTE: will have to store some of the channel storage off-chain 
    init() {
        super.init();
        this.isChannelOpen.set(Bool(false));
        this.isHostRegistered.set(Bool(false));
        this.isPeerRegistered.set(Bool(false));
    }

    @method async registerHost(hostPubKey: PublicKey) {
        const isRegistered = this.isHostRegistered.get();
        isRegistered.assertFalse("Host is already registered");

        this.host.set(hostPubKey);
        this.isHostRegistered.set(Bool(true));
    }

    @method async registerPeer(peerPubKey: PublicKey) {
        const isRegistered = this.isPeerRegistered.get();
        isRegistered.assertFalse("Peer is already registered");

        this.peer.set(peerPubKey);
        this.isPeerRegistered.set(Bool(true));
    }

    @method async openChannel(
        initialStateHash: Field,
        hostPubKey: PublicKey,
        peerPubKey: PublicKey,
        hostSignature: Signature,
        peerSignature: Signature
    ) {
        const isHostRegistered = this.isHostRegistered.get();
        const isPeerRegistered = this.isPeerRegistered.get();
        isHostRegistered.assertTrue("Host is not registered");
        isPeerRegistered.assertTrue("Peer is not registered");


        const isHostSigValid = hostSignature.verify(hostPubKey, [initialStateHash]);
        const isPeerSigValid = peerSignature.verify(peerPubKey, [initialStateHash]);

        isHostSigValid.assertTrue("Invalid host signature");
        isPeerSigValid.assertTrue("Invalid peer signature");

        this.currentStateHash.set(initialStateHash);
        this.isChannelOpen.set(Bool(true));
    }

    @method async settle(
        finalStateHash: Field,
        hostSignature: Signature,
        peerSignature: Signature,
        finalProof: Field // This would be a ZK proof showing the final state is valid
    ) {
        const isOpen = this.isChannelOpen.get();
        isOpen.assertTrue("Channel is not open");

        const hostPubKey = this.host.get();
        const peerPubKey = this.peer.get();

        const isHostSigValid = hostSignature.verify(hostPubKey, [finalStateHash]);
        const isPeerSigValid = peerSignature.verify(peerPubKey, [finalStateHash]);

        isHostSigValid.assertTrue("Invalid host signature on final state");
        isPeerSigValid.assertTrue("Invalid peer signature on final state");

        // TODO: Verify the final ZK proof that shows the entire state transition sequence is valid
        // This would involve checking the proof against the initial and final state hashes

        this.currentStateHash.set(finalStateHash);
        this.isChannelOpen.set(Bool(false));
    }

    @method async disputeState(
        disputedStateHash: Field,
        fraudProof: Field // This would be a ZK proof showing the state is invalid
    ) {
        const isOpen = this.isChannelOpen.get();
        isOpen.assertTrue("Channel is not open");

        // TODO: Verify the ZK fraud proof that shows the disputed state is invalid
        // This would involve checking the proof against the claimed state hash

        this.isChannelOpen.set(Bool(false));
    }

    @method async update() {
    }

    @method async setInitialStateHash(initialStateHash: Field) {
        this.currentStateHash.set(initialStateHash);
    }

    @method async setHost(host: PublicKey) {
        this.host.set(host);
    }

    @method async setPeer(peer: PublicKey) {
        this.peer.set(peer);
    }

    @method async stake() {
        //
    }

    @method async distributeRewards() {
        //
    }

    @method async claim() {
        //
    }

}