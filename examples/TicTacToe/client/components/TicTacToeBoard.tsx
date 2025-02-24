import React from 'react';

interface TicTacToeBoardProps {
  board: (0 | 1 | 2)[];
  onCellClick: (position: number) => void;
  isMyTurn: boolean;
  currentPlayer: '1' | '2';
  winner: number | null;
  isHost: boolean;
}

const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ 
  board, 
  onCellClick, 
  isMyTurn,
  currentPlayer,
  winner,
  isHost 
}) => {
  const getPlayerSymbol = (cell: number) => {
    if (cell === 1) return 'X';
    if (cell === 2) return 'O';
    return '';
  };

  const getPlayerName = (player: '1' | '2') => {
    return `Player ${player} (${player === '1' ? 'X' : 'O'})`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold mb-4">
        {winner 
          ? `Winner: ${getPlayerName(winner.toString() as '1' | '2')}` 
          : `Current Turn: ${getPlayerName(currentPlayer)}`
        }
      </div>
      
      <div className="text-lg mb-4">
        You are {isHost ? 'Player 1 (X)' : 'Player 2 (O)'}
        {isMyTurn && ' - Your turn!'}
      </div>

      <div className="grid grid-cols-3 gap-2 bg-white p-4 rounded-lg shadow-md">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => isMyTurn && onCellClick(index)}
            disabled={!isMyTurn || cell !== 0 || winner !== null}
            className={`
              w-20 h-20 text-4xl font-bold
              border-2 border-gray-300 rounded
              ${isMyTurn && cell === 0 && !winner ? 'hover:bg-gray-100' : ''}
              ${cell === 1 ? 'text-blue-600' : ''}
              ${cell === 2 ? 'text-red-600' : ''}
              transition-colors duration-200
            `}
          >
            {getPlayerSymbol(cell)}
          </button>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        {!isMyTurn && !winner && 'Waiting for other player...'}
      </div>
    </div>
  );
};

export default TicTacToeBoard;
