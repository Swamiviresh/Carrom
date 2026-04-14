import React, { useState } from 'react';

const Room = ({ onCreateRoom, onJoinRoom, onBack }) => {
  const [roomCode, setRoomCode] = useState('');

  return (
    <div className="menu-screen glass-card compact">
      <h2>Online Match</h2>
      <p className="menu-description">Create a private room or enter a room code to play.</p>
      <div className="menu-actions">
        <button className="btn btn-primary" onClick={onCreateRoom}>Create Room</button>
      </div>

      <div className="room-join">
        <input
          className="input"
          type="text"
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        />
        <button
          className="btn btn-secondary"
          onClick={() => onJoinRoom(roomCode.trim())}
          disabled={!roomCode.trim()}
        >
          Join Room
        </button>
      </div>

      <button className="btn btn-ghost" onClick={onBack}>Back</button>
    </div>
  );
};

export default Room;