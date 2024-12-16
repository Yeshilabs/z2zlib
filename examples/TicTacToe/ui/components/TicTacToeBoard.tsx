import React, { useState } from 'react';
import TicTacToeCell from './TicTacToeCell';
import { initialGameState, checkWinner, isDraw } from '../utils/TicTacToeLogic';
import styles from '../styles/TicTacToe.module.css';

const TicTacToeBoard: React.FC = () => {
  const [state, setState] = useState(initialGameState);

  const handleCellClick = (index: number) => {
    if (state.board[index] || state.winner) return;

    const newBoard = [...state.board];
    newBoard[index] = state.currentPlayer;

    const winner = checkWinner(newBoard);
    const draw = isDraw(newBoard);

    setState({
      board: newBoard,
      currentPlayer: state.currentPlayer === 1 ? 2 : 1,
      winner,
      isDraw: draw,
    });
  };

  const restartGame = () => {
    setState(initialGameState);
  };

  return (
    <div className={styles.game}>
      <div className={styles.board}>
        {state.board.map((cell, index) => (
          <TicTacToeCell
            key={index}
            value={cell}
            onClick={() => handleCellClick(index)}
            disabled={!!state.winner || state.isDraw}
          />
        ))}
      </div>
      <p className={styles.status}>
        {state.winner
          ? `Player ${state.winner} wins!`
          : state.isDraw
          ? 'It\'s a draw!'
          : `Player ${state.currentPlayer}'s turn`}
      </p>
      <button className={styles.restart} onClick={restartGame}>
        Restart
      </button>
    </div>
  );
};

export default TicTacToeBoard;
