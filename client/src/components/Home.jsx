import React from 'react';

const Home = ({ onStartBot, onStartOnline }) => {
  return (
    <div className="home-menu" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Carrom Real-Time</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <button onClick={onStartBot} style={{ padding: '10px 20px', fontSize: '18px' }}>
          Play vs Bot
        </button>
        <button onClick={onStartOnline} style={{ padding: '10px 20px', fontSize: '18px' }}>
          Play Online
        </button>
      </div>
    </div>
  );
};

export default Home;
