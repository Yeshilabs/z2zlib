import { Poseidon, Field } from 'o1js';
// TODO: move the types to src/type/TicTacToeTypes.ts
export type Empty = 0;
export type Player = 1 | 2;
export type Cell = Player | Empty;

export interface GameState {
  board: Cell[];
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
}

export const initialGameState: GameState = {
  board: Array(9).fill(0),
  currentPlayer: 2,
  winner: null,
  isDraw: false,
};

export const checkWinner = (board: Cell[]): Player | null => {
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of winningCombinations) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
};

export const isDraw = (board: Cell[]): boolean => {
  return board.every((cell) => cell !== 0);
};

function hashState(state: GameState): Field {
    const stateArray = [
        ...state.board.map(cell => Field(cell)),
        Field(state.currentPlayer),
        Field(state.winner !== null ? state.winner : 0),
        Field(state.isDraw ? 1 : 0)
    ];
    return Poseidon.hash(stateArray);
}

// Function to verify a state transition
function verifyTransition(prevState: GameState, nextState: GameState, move: any): boolean {
    // Implement transition verification logic
    return true; // Placeholder
}

// Function to generate a zero-knowledge proof for a state transition
async function generateTransitionProof(prevState: GameState, nextState: GameState, move: any): Promise<any> {
    // Use a ZK library to generate a proof
    return {}; // Placeholder
}

// Function to verify a zero-knowledge proof
async function verifyProof(proof: any): Promise<boolean> {
    // Use a ZK library to verify the proof
    return true; // Placeholder
}
