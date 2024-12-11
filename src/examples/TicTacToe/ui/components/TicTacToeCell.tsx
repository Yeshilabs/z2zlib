import React from 'react';
import styles from '../styles/TicTacToe.module.css';
import { Cell } from '../utils/TicTacToeLogic'; 

interface TicTacToeCellProps {
  value: Cell;
  onClick: () => void;
  disabled: boolean;
}

const TicTacToeCell: React.FC<TicTacToeCellProps> = ({ value, onClick, disabled }) => {
    return (
      <button
        className={styles.cell}
        onClick={onClick}
        disabled={disabled || value !== 0}
      >
        {value === 1 ? 'X' : value === 2 ? 'O' : ''}

      </button>
    );
  };
  

export default TicTacToeCell;
