import React, { useState, useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import Home from './components/Home';
import Room from './components/Room';
import GameUI from './components/GameUI';
import CarromScene from './game/CarromScene';
import socket from './game/socket';

function App() {
  const [view, setView] = useState('home');
  const [gameState, setGameState] = useState({
    player1Score: 0,
    player2Score: 0,
    turn: 'player1',
    roomCode: '',
    notification: ''
  });
  const gameRef = useRef(null);

  useEffect(() => {
    socket.on('roomCreated', (code) => {
      setGameState(prev => ({ ...prev, roomCode: code }));
      setView('game');
      initPhaser({ isBotMode: false, roomCode: code });
    });

    socket.on('playerJoined', (data) => {
      setGameState(prev => ({ 
        ...prev, 
        roomCode: data.roomCode,
        ...data.gameState 
      }));
      if (view !== 'game') {
          setView('game');
          initPhaser({ isBotMode: false, roomCode: data.roomCode });
      }
    });

    socket.on('shotResult', (newState) => {
      setGameState(prev => ({ ...prev, ...newState }));
      // Sync Phaser scene
      if (gameRef.current) {
          const scene = gameRef.current.scene.getScene('CarromScene');
          scene.updateBoardState(newState);
      }
    });

    return () => {
      socket.off('roomCreated');
      socket.off('playerJoined');
      socket.off('shotResult');
    };
  }, [view]);

  const initPhaser = (data) => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 800,
      parent: 'phaser-container',
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [CarromScene]
    };

    const game = new Phaser.Game(config);
    game.scene.start('CarromScene', data);
    gameRef.current = game;

    game.events.on('shoot', (shotData) => {
        socket.emit('shoot', { ...shotData, roomCode: data.roomCode });
    });
  };

  const handleStartBot = () => {
    setView('game');
    initPhaser({ isBotMode: true });
  };

  const handleStartOnline = () => setView('room');
  const handleCreateRoom = () => socket.emit('createRoom');
  const handleJoinRoom = (code) => socket.emit('joinRoom', code);
  const handleBack = () => setView('home');
  const handleLeave = () => {
      if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
      }
      setView('home');
  };

  return (
    <div className="App">
      {view === 'home' && <Home onStartBot={handleStartBot} onStartOnline={handleStartOnline} />}
      {view === 'room' && <Room onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onBack={handleBack} />}
      {view === 'game' && (
        <>
          <div id="phaser-container" style={{ display: 'flex', justifyContent: 'center' }}></div>
          <GameUI gameState={gameState} onLeave={handleLeave} />
        </>
      )}
    </div>
  );
}

export default App;
