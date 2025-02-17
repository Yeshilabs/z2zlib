import { Field } from 'o1js';

// Base interface for any state that can be used in the state channel
export interface StateConstructor<T extends State> {
    deserialize(serialized: string): T;
}

export interface State {
    //id: bigint;
    // Get a hash representation of the state for on-chain use
    toFields(): Field[];
    
    // Hash the state using the fields
    hash(): Field;
    
    // Serialize the state for transmission
    serialize(): string;

    // Checks if the state is equal to another state
    equals(other: State): boolean;
    
    // Get a human-readable string representation
    toString(): string;
}

// Interface for state transitions
export interface StateTransition<S extends State, M> {
    // Apply a move to current state to get next state
    apply(state: S, move: M): S;
    
    // Validate if a transition is valid
    isValid(state: S, nextState: S, move: M): boolean;
    
    // Optional: Generate a proof for this transition
    generateProof?(state: S, nextState: S, move: M): Promise<void>;
    
    // Optional: Verify a proof for this transition
    verifyProof?(state: S, nextState: S, move: M): Promise<boolean>;
}

// Base class for implementing game states
export abstract class BaseState implements State {
    //abstract id: bigint;

    abstract toFields(): Field[];
    
    abstract hash(): Field;
    
    equals(other: State): boolean {
        return this.hash().equals(other.hash()).toBoolean();
    }

    abstract serialize(): string;
    
    abstract toString(): string;
} 