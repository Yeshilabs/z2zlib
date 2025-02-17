import { State, StateTransition, BaseState, StateConstructor } from 'z2zlib';
import { Field, Poseidon } from 'o1js';

type Cell = 0 | 1 | 2; // Empty, X, O

export class TicTacToeState extends BaseState {

    static deserialize(serialized: string): TicTacToeState {
        const { board, currentPlayer, winner, id} = JSON.parse(serialized);
        return new TicTacToeState(board, currentPlayer, winner);
    }

    constructor(
        public board: Cell[] = Array(9).fill(0),
        public currentPlayer: '1' | '2' = '1',
        public winner: number | null = null,
        //public id: bigint = BigInt(0)
    ) {
        super();
    }

    toFields(): Field[] {
        return [
            ...this.board.map(cell => Field(cell)),
            Field(this.currentPlayer),
            Field(this.winner || 0)
        ];
    }

    hash(): Field {
        return Poseidon.hash(this.toFields());
    }

    serialize(): string {
        return JSON.stringify({
            board: this.board,
            currentPlayer: this.currentPlayer,
            winner: this.winner
        });
    }

    toString(): string {
        return `Board: ${this.board.join(',')}, Player: ${this.currentPlayer}, Winner: ${this.winner}`;
    }
}

export interface TicTacToeMove {
    position: number; // 0-8
    player: '1' | '2';
}

export class TicTacToeTransition implements StateTransition<TicTacToeState, TicTacToeMove> {
    apply(state: TicTacToeState, move: TicTacToeMove): TicTacToeState {
        if (!this.isValid(state, null as any, move)) {
            throw new Error("Invalid move");
        }

        const newBoard = [...state.board];
        newBoard[move.position] = move.player === '1' ? 1 : 2;

        return new TicTacToeState(
            newBoard,
            state.currentPlayer === '1' ? '2' : '1',
            this.checkWinner(newBoard)
        );
    }

    isValid(state: TicTacToeState, _nextState: TicTacToeState, move: TicTacToeMove): boolean {
        // Check if position is valid
        if (move.position < 0 || move.position > 8) {
            console.error("Invalid move position:", move.position);
            return false;
        }

        
        // Check if position is empty
        if (state.board[move.position] !== 0) {
            console.error("Invalid move position:", move.position);
            return false;
        }
        
        // Check if it's the player's turn
        if (move.player !== state.currentPlayer) {
            console.error("Invalid move player:", move.player);
            return false;
        }

        if (_nextState) {
            //check that the next state is correctly updated
            if (_nextState.board[move.position].toString() !== move.player) {
                console.error("Next state is not correctly updated", _nextState.board[move.position].toString(), move.player);
                return false;
            }
        }
        
        // Check if game is not already won
        if (state.winner !== null) {
            console.error("Game already won");
            return false;
        }

        return true;
    }

    private checkWinner(board: Cell[]): number | null {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (const [a, b, c] of lines) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }

        return null;
    }
} 