# z2zlib

A Formalization and TypeScript API for P2P State Channels on Mina Protocol

## Project Background
This project will aim at levraging Mina's unique infinite recursive proving capabilities for the development of a peer-to-peer state channel infrastructure. This library will allow developers to build decentralized apps such as multiplayer on-chain games where actors will be able to interact in a zero-trust setup, peer-to-peer and optionally settle disputes using a zkApp smart contracts.  

This project proposal builds upon a hackathon project in which I developed a dice betting game. The initial version of this game necessitated interactions with a smart contract for every game state transition. However, a significant limitation of this architecture was the unecessary use of the consensus layer of Mina at each intermediate interactions, which introduced substantial delays between each player's actions. An alternative to this architecture would have been to have the players set up a state channel through which they would exchange proofs for each state transition and eventually settling with a smart contract using sending out the proof of winning state.

## Proposal Overview

### Problem
Traditional multi-actor decentralized applications on Mina often rely on smart contracts to handle state changes. This approach enforces a general consensus on state transitions, inducing considerable delay and reducing the overall efficiency and user experience of applications.

### Solution
z2zlib proposes a comprehensive solution comprising:

1. Standardization of an off-chain p2p state channel to handle state transitions, utilizing Mina's unique constant-size recursive proving capability.
2. Development of a p2p state channel library, abstracting away the network stack for p2p proof exchange.
3. Implementation of three example applications showcasing the library's versatility:
   - A multiplayer game
   - A p2p DeFi protocol
   - A B2B zero-knowledge use case, such as a supply chain application
4. Creation of detailed documentation to facilitate adoption and integration by developers.

### Impact
z2zlib will significantly enhance the Mina ecosystem by:
- Improving the infrastructure for developing multi-actor, turn-based applications
- Enabling Mina developers to create zkApps with superior user experience
- Increasing efficiency in application development through abstraction and formalization
- Demonstrating the power and flexibility of Mina's recursive proving capabilities
- Potentially attracting more developers to the Mina ecosystem due to improved tooling

### Audience
The primary audience for z2zlib includes:
- Mina Protocol developers
- Researchers in the field of zero-knowledge proofs and state channels
- Companies looking to implement zero-knowledge p2p solutions in their business processes

## Architecture & Design

### High-Level Architecture

z2zlib is designed as a modular, layered system comprising several key components:

1. Network Stack (powered by libp2pjs)
2. State Channel Management
3. Zero-Knowledge Proof Generation and Verification of state transitions
4. Dispute settlement Smart Contracts abstractions.


#### 1. Network Stack

The network stack, built on libp2p.js, handles peer discovery, connection establishment, and data transfer between peers. It consists of two main components:

a) Connection Setup:
- Utilizes a hole-punching protocol for NAT traversal
- Operates through a Centralized: Employs an ICE (Interactive Connectivity Establishment) server first, in the future a developments a network of incentivized users may act as relays.

b) Proof Exchange:
- Implements WebRTC as the transport layer for efficient, peer-to-peer communication
- Ensures secure and reliable transfer of state proofs between participants

#### 2. State Channel Management

This component is responsible for:
- Initializing and closing state channels
- Managing state transitions within the channel
- Channel monitoring
- Handling disputes and channel settlement

#### 3. Zero-Knowledge Proof Generation and Verification

Leveraging Mina's o1js library, this module:
- Generates zero-knowledge proofs for state transitions
- Verifies incoming proofs from other participants
- Manages the recursive proof structure unique to Mina

#### 4. Smart Contract Interface

This layer provides an abstraction for interacting with on-chain smart contracts, used for:
- Channel opening and closing
- Dispute resolution
- Final state settlement

### Detailed Design

#### Connection Setup

The connection setup process follows these steps:

1. Alice generates a unique session ID and an invite link containing this ID.
2. Alice sends the invite link to Bob through an out-of-band channel (e.g., email, messaging app).
3. Bob opens the invite link, triggering the connection process.
4. Alice and Bob exchange Session Description Proposal (SDP) information through a signaling channel.
5. Both parties exchange ICE candidates that were selected through an ICE server to establish a direct peer-to-peer connection.

<div align="center">
<br>
<img style="align: center" src="https://hackmd.io/_uploads/rySak6rnC.jpg" height=256/>
</div>
<br>


#### Proof Exchange

Once the connection is established, peers can exchange proofs following this flow:

1. Alice generates a state transition and corresponding zero-knowledge proof.
2. Alice sends the proof to Bob over the established WebRTC channel.
3. Bob verifies the received proof.
4. If valid, Bob updates his local state and can then generate the next state transition.
5. The process repeats for each state change in the application.

<div align="center">
<br>
<img style="align: center" src="https://hackmd.io/_uploads/HJU7lTH3A.jpg" height=256/>
</div>!
<br>

#### Peer Discovery and Channel Setup

1. Peer Discovery:
   - Each peer is assigned a unique peerID for each session.
   - The library maintains a Distributed Hash Table (DHT) for peer discovery.
   - Peers can also be discovered through centralized rendezvous points if required.

2. Channel Setup:
   - Peers agree on initial state and channel parameters.
   - A smart contract is optionally deployed on-chain to handle potential disputes.
   - Both parties lock collateral (if required) in the smart contract.
   - The channel is now open for off-chain state-changes.

#### State Management

z2zlib provides a flexible state management system:

1. State Machine Abstraction:
   - Developers define their application's state machine using provided interfaces.
   - The library ensures that all state transitions adhere to the defined rules.

2. Proof Generation:
   - For each state transition, a zero-knowledge proof is generated using o1js.
   - The proof demonstrates the validity of the transition without revealing the actual state.

3. Recursive Proofs:
   - z2zlib leverages Mina's recursive proving capability to maintain a constant-size proof of the entire state history.

4. Dispute Resolution:
   - If a dispute occurs, the latest valid state proof can be submitted to the on-chain smart contract.
   - The contract verifies the proof and resolves the dispute accordingly.

### Vision

The long-term vision for z2zlib is to become a cornerstone in scaling zkApps on Mina Protocol without compromising decentralization. We envision:

1. A thriving ecosystem of scalable, multi-actor applications built on Mina.
2. Integration with other layer-2 scaling solutions to provide a comprehensive scaling toolkit.
3. Adoption of z2zlib patterns in other blockchain ecosystems, showcasing Mina's innovative approach.
4. Continuous research and improvement of the state channel model, potentially leading to academic publications and industry standards.

### Production Timeline

I aim to have a production-ready version of z2zlib within three months from the project's start date. This timeline includes development, testing, documentation, and the creation of an example application.

## Budget & Milestones

### Deliverables

1. Research paper specifying state channels for the Mina Protocol
2. z2zlib TypeScript library
3. Comprehensive documentation and API reference
4. One example application:
   - Multiplayer game


### Mid-Point Milestones (1.5 months)

1. Complete research paper draft
2. Functional prototype of z2zlib with basic features
3. Preliminary documentation
4. Proof-of-concept for one example application

## Risks & Mitigations

### Technical Risks

1. Proof Generation Time:
   - Risk: Complex state transitions may require significant time to generate proofs, impacting user experience.
   - Mitigation: to be researched.

2. Network Reliability:
   - Risk: P2P connections may be unstable, leading to interrupted sessions.
   - Mitigation: Implement robust reconnection mechanisms and state recovery protocols. Consider optional centralized fallback for critical applications.

### State Channel Specific Risks

1. Liveness:
   - Risk: Connection drops between peers may halt the application state.
   - Mitigation: Implement timeouts and allow for unilateral channel closure after a predefined period of inactivity. Provide options for state recovery through on-chain mechanisms.

2. Data Availability:
   - Risk: Loss of local data (e.g., due to hardware failure) may result in loss of funds or application state.
   - Mitigation: to be researched.

3. Griefing Attacks:
   - Risk: Malicious actors may force frequent on-chain settlements to increase costs for honest participants.
   - Mitigation: to be researched.

### Mitigation Strategies

1. Thorough Specification: Develop a comprehensive specification for the settlement process, covering all edge cases and potential attack vectors.

2. Formal Verification: Employ formal verification techniques on critical components of the library and smart contracts to ensure correctness.

3. Extensive Testing: Implement a rigorous testing suite, including unit tests, integration tests, and simulated attack scenarios.

4. Gradual Rollout: Begin with lower-stakes applications and gradually increase complexity and value at risk as the system proves its reliability.

5. Community Audits: Engage the Mina developer community in reviewing and auditing the codebase before major releases.

6. Continuous Monitoring: Implement logging and monitoring systems to detect and respond to potential issues in real-time during the initial deployment phases.

