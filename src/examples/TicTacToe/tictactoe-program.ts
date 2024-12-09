import { ZkProgram, method, Field, UInt32, Bool } from 'o1js';
import { TicTacToeState } from './TicTacToeState';

export const TicTacToeZkProgram = ZkProgram({
    name: 'TicTacToeZkProgram', // Unique name
    publicInput: TicTacToeState,
  
    methods: {
      playMove: {
        privateInputs: [UInt32, UInt32], // Position and Player ID
  
        async method(currentState: TicTacToeState, position: UInt32, playerId: UInt32) {
          currentState.gameEnded.assertEquals(Bool(false)); // Game must not have ended
          currentState.turn.assertEquals(playerId); // Must be the correct player's turn
          const posIdx = Number(position.toBigint());
          const board = currentState.board;
          board[posIdx].assertEquals(Field(0)); // Position must be empty
  
          board[posIdx] = Field(playerId.value.add(1)); // Update the board
  
          // Update the turn
          currentState.turn = playerId.equals(UInt32.zero) ? UInt32.one : UInt32.zero;
        },
      },
    },
  });
  

export function checkWin(board: Field[]): Bool {
    const winPatterns = [
      [0, 1, 2], // Row 1
      [3, 4, 5], // Row 2
      [6, 7, 8], // Row 3
      [0, 3, 6], // Column 1
      [1, 4, 7], // Column 2
      [2, 5, 8], // Column 3
      [0, 4, 8], // Diagonal 1
      [2, 4, 6], // Diagonal 2
    ];
  
    return winPatterns.reduce((hasWon, pattern) => {
      const [a, b, c] = pattern;
      const isLine = board[a].equals(board[b]).and(board[b].equals(board[c])).and(board[a].notEquals(Field(0)));
      return hasWon.or(isLine);
    }, Bool(false));
  }