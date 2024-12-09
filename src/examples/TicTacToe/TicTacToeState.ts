import { Field, Struct, UInt32, Bool } from 'o1js';

export class TicTacToeState extends Struct({
  board: [Field, Field, Field, Field, Field, Field, Field, Field, Field], // 3x3 board
  turn: UInt32, // 0 for Player 1, 1 for Player 2
  gameEnded: Bool,
}) {}
