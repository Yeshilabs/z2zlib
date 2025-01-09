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
