import React from 'react';
import styles from '../styles/TicTacToe.module.css';

interface TicTacToeBoardProps {
  board: (0 | 1 | 2)[];
  onCellClick: (position: number) => void;
  isMyTurn: boolean;
  currentPlayer: number;
  winner: number | null;
}

const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ 
  board, 
  onCellClick, 
  isMyTurn,
  currentPlayer,
  winner 
}) => {
  return (
    <div className={styles.game}>
      <div className={styles.board}>
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => isMyTurn && onCellClick(index)}
            disabled={!isMyTurn || cell !== 0 || winner !== null}
            className="w-20 h-20 bg-white border-2 border-gray-300 text-2xl font-bold"
          >
            {cell === 1 ? 'X' : cell === 2 ? 'O' : ''}
          </button>
        ))}
      </div>
      <p className={styles.status}>
        {winner 
          ? `Player ${winner} wins!` 
          : `Player ${currentPlayer}'s turn`}
      </p>
    </div>
  );
};

export default TicTacToeBoard;
