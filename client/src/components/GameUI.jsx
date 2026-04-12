import React from 'react';

const GameUI = ({ gameState, onLeave }) => {
  const { player1Score, player2Score, turn, roomCode, notification } = gameState;

  return (
    <div className="game-ui" style={{
      position: 'absolute',
      top: 0,
      width: '100%',
      pointerEvents: 'none',
      color: 'white',
      padding: '10px',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3>Room: {roomCode}</h3>
          <button onClick={onLeave} style={{ pointerEvents: 'auto' }}>Leave Match</button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2>{turn === 'player1' ? "Player 1's Turn" : "Player 2's Turn"}</h2>
          {notification && <div style={{ background: 'rgba(255,0,0,0.7)', padding: '5px' }}>{notification}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <h3>P1: {player1Score} | P2: {player2Score}</h3>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
