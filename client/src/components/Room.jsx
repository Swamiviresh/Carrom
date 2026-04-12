import React, { useState } from 'react';

const Room = ({ onCreateRoom, onJoinRoom, onBack }) => {
  const [roomCode, setRoomCode] = useState('');

  return (
    <div className="room-menu" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Multiplayer</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <button onClick={onCreateRoom} style={{ padding: '10px 20px', fontSize: '18px' }}>
          Create Room
        </button>
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            style={{ padding: '10px', fontSize: '16px' }}
          />
          <button
            onClick={() => onJoinRoom(roomCode)}
            style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}
          >
            Join Room
          </button>
        </div>
        <button onClick={onBack} style={{ marginTop: '30px', padding: '5px 10px' }}>
          Back to Main Menu
        </button>
      </div>
    </div>
  );
};

export default Room;
