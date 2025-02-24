import { Field, Provable, Bool } from 'o1js';

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
export interface StateTransition<S extends State, M> extends Provable<StateTransition<S, M>> {
    // Apply a move to current state to get next state
    apply(state: S, move: M): S;
    
    // Validate if a transition is valid
    isValid(state: S, nextState: S, move: M): Bool;
    
    // Convert transition to fields for on-chain verification
    toFields(): Field[];
    
    // Size in fields for the transition
    sizeInFields(): number;
    
    // Create transition from fields
    fromFields(fields: Field[]): StateTransition<S, M>;
    
    // Check if transition is valid (for ZK proofs)
    check(value: StateTransition<S, M>): void;
}

// Base class for implementing game states
export abstract class BaseState implements State, Provable<BaseState> {
    //abstract id: bigint;

    abstract toFields(): Field[];
    
    abstract hash(): Field;
    
    abstract serialize(): string;
    
    abstract toString(): string;
    
    equals(other: State): boolean {
        return this.hash().equals(other.hash()).toBoolean();
    }

    toAuxiliary(): any[] { return []; }
    abstract sizeInFields(): number;
    abstract fromFields(fields: Field[]): BaseState;
    abstract check(value: BaseState): void;
    toValue(): any { return this; }
    fromValue(value: any): BaseState { return value; }
}

// Base class for implementing transitions
export abstract class BaseTransition<S extends State, M> implements StateTransition<S, M> {
    abstract apply(state: S, move: M): S;
    abstract isValid(state: S, nextState: S, move: M): Bool;
    abstract toFields(): Field[];
    abstract sizeInFields(): number;
    abstract fromFields(fields: Field[]): StateTransition<S, M>;
    abstract check(value: StateTransition<S, M>): void;
    
    toAuxiliary(): any[] { return []; }
    toValue(): any { return this; }
    fromValue(value: any): StateTransition<S, M> { return value; }
} 