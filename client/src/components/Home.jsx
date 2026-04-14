import React from 'react';

const Home = ({ onStartBot, onStartOnline, onOpenInstructions, onOpenSettings }) => {
  return (
    <div className="menu-screen glass-card">
      <p className="eyebrow">Carrom Arena</p>
      <h1>Realistic Carrom</h1>
      <p className="menu-description">
        Tournament-grade board feel, polished visuals, and modern match UI while preserving the same gameplay rules.
      </p>
      <div className="menu-actions">
        <button className="btn btn-primary" onClick={onStartBot}>Play</button>
        <button className="btn btn-secondary" onClick={onOpenInstructions}>Instructions</button>
        <button className="btn btn-secondary" onClick={onOpenSettings}>Settings</button>
        <button className="btn btn-secondary" onClick={onStartOnline}>Multiplayer (Beta)</button>
      </div>
    </div>
  );
};

export default Home;