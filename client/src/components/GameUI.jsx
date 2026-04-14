import React from 'react';

const GameUI = ({ gameState, power, onLeave, onPause, onResume, paused, onToggleTheme }) => {
  const {
    player1Score,
    player2Score,
    turn,
    roomCode,
    notification,
    mode,
    isGameOver,
    winner,
  } = gameState;

  return (
    <>
      <div className="hud glass-card">
        <div className="hud-top">
          <div>
            <p className="hud-label">Room</p>
            <h3>{roomCode || 'LOCAL'}</h3>
          </div>
          <div className="hud-right">
            <button className="btn btn-ghost" onClick={onToggleTheme}>Theme</button>
            {!paused
              ? <button className="btn btn-ghost" onClick={onPause}>Pause</button>
              : <button className="btn btn-ghost" onClick={onResume}>Resume</button>}
            <button className="btn btn-danger" onClick={onLeave}>Leave</button>
          </div>
        </div>

        <div className="score-row">
          <div className={`score-card ${turn === 'player1' ? 'active' : ''}`}>
            <p>Player 1</p>
            <h2>{player1Score}</h2>
          </div>
          <div className={`score-card ${turn === 'player2' ? 'active' : ''}`}>
            <p>{mode === 'bot' ? 'Bot' : 'Player 2'}</p>
            <h2>{player2Score}</h2>
          </div>
        </div>

        <div className="meter-wrap">
          <div className="meter-header">
            <span>Power</span>
            <span>{Math.round(power * 100)}%</span>
          </div>
          <div className="meter">
            <div className="meter-fill" style={{ width: `${Math.round(power * 100)}%` }} />
          </div>
        </div>

        <div className="status-row">
          <p className="turn-pill">
            {turn === 'player1' ? "Player 1's turn" : mode === 'bot' ? "Bot's turn" : "Player 2's turn"}
          </p>
          <p className="badge">Multiplayer UI Placeholder</p>
        </div>

        {notification && <div className="notification">{notification}</div>}
      </div>

      {paused && (
        <div className="overlay">
          <div className="overlay-card glass-card">
            <h2>Paused</h2>
            <p>Take a breath and resume when ready.</p>
            <button className="btn btn-primary" onClick={onResume}>Resume Match</button>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="overlay">
          <div className="overlay-card glass-card">
            <h2>Game Over</h2>
            <p>{winner} wins this round.</p>
            <button className="btn btn-primary" onClick={onLeave}>Back to Menu</button>
          </div>
        </div>
      )}
    </>
  );
};

export default GameUI;