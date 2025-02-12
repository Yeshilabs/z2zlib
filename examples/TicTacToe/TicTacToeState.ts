type Cell = 0 | 1 | 2; // Empty, X, O

interface TicTacToeState {
    board: Cell[];
    currentPlayer: 1 | 2;
    winner: number | null;
}

interface TicTacToeMove {
    position: number; // 0-8
    player: 1 | 2;
}

class TicTacToeTransition implements StateTransition<TicTacToeState, TicTacToeMove> {
    apply(state: TicTacToeState, move: TicTacToeMove): TicTacToeState {
        // Implement game logic
    }

    isValid(state: TicTacToeState, nextState: TicTacToeState, move: TicTacToeMove): boolean {
        // Implement validation rules
    }
} 