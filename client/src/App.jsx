import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Phaser from 'phaser';
import Home from './components/Home';
import Room from './components/Room';
import GameUI from './components/GameUI';
import CarromScene from './game/CarromScene';
import socket from './game/socket';
import './App.css';

const SCORE_TO_WIN = 9;

function App() {
  const [view, setView] = useState('home');
  const [theme, setTheme] = useState('classic');
  const [paused, setPaused] = useState(false);
  const [power, setPower] = useState(0);
  const [modal, setModal] = useState(null);
  const [gameState, setGameState] = useState({
    player1Score: 0,
    player2Score: 0,
    turn: 'player1',
    roomCode: '',
    notification: '',
    mode: 'bot',
    isGameOver: false,
    winner: '',
  });

  const gameRef = useRef(null);

  const destroyGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
  }, []);

  const updateGameState = useCallback((partial) => {
    setGameState((prev) => {
      const next = { ...prev, ...partial };
      if (next.player1Score >= SCORE_TO_WIN || next.player2Score >= SCORE_TO_WIN) {
        next.isGameOver = true;
        next.winner = next.player1Score > next.player2Score ? 'Player 1' : next.mode === 'bot' ? 'Bot' : 'Player 2';
      }
      return next;
    });
  }, []);

  const attachSceneEvents = (game, roomCode) => {
    game.events.on('powerChange', (val) => setPower(val));
    game.events.on('shoot', (shotData) => {
      if (roomCode) {
        socket.emit('shoot', { ...shotData, roomCode });
      }
    });
  };

  const initPhaser = useCallback((data) => {
    destroyGame();

    const config = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      backgroundColor: '#0c1118',
      width: Math.min(window.innerWidth - 24, 860),
      height: Math.min(window.innerHeight - 180, 860),
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      antialias: true,
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: [CarromScene],
    };

    const game = new Phaser.Game(config);
    game.scene.start('CarromScene', { ...data, theme });
    attachSceneEvents(game, data.roomCode);
    gameRef.current = game;
    setPaused(false);
    setPower(0);
  }, [destroyGame, theme]);

  useEffect(() => {
    socket.on('roomCreated', (code) => {
      updateGameState({ roomCode: code, mode: 'online' });
      setView('game');
      initPhaser({ isBotMode: false, roomCode: code });
    });

    socket.on('playerJoined', (data) => {
      updateGameState({ roomCode: data.roomCode, ...data.gameState, mode: 'online' });
      if (view !== 'game') {
        setView('game');
        initPhaser({ isBotMode: false, roomCode: data.roomCode });
      }
    });

    socket.on('shotResult', (newState) => {
      updateGameState(newState);
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
  }, [initPhaser, updateGameState, view]);

  useEffect(() => () => destroyGame(), [destroyGame]);

  const handleStartBot = () => {
    updateGameState({
      roomCode: 'LOCAL',
      mode: 'bot',
      player1Score: 0,
      player2Score: 0,
      notification: '',
      turn: 'player1',
      isGameOver: false,
      winner: '',
    });
    setView('game');
    initPhaser({ isBotMode: true });
  };

  const handleOpenInstructions = () => setModal('instructions');
  const handleOpenSettings = () => setModal('settings');

  const handleStartOnline = () => {
    setView('room');
    setModal(null);
  };

  const handleCreateRoom = () => socket.emit('createRoom');
  const handleJoinRoom = (code) => socket.emit('joinRoom', code);
  const handleBack = () => setView('home');

  const handleLeave = () => {
    destroyGame();
    setView('home');
    setPaused(false);
    setPower(0);
  };

  const handlePause = () => {
    if (gameRef.current) {
      gameRef.current.scene.pause('CarromScene');
    }
    setPaused(true);
  };

  const handleResume = () => {
    if (gameRef.current) {
      gameRef.current.scene.resume('CarromScene');
    }
    setPaused(false);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'classic' ? 'noir' : 'classic'));
    if (view === 'game') {
      const data = { isBotMode: gameState.mode === 'bot', roomCode: gameState.roomCode };
      initPhaser(data);
    }
  };

  return (
    <div className={`App theme-${theme}`}>
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />

      {view === 'home' && (
        <Home
          onStartBot={handleStartBot}
          onStartOnline={handleStartOnline}
          onOpenInstructions={handleOpenInstructions}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {view === 'room' && (
        <Room
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onBack={handleBack}
        />
      )}

      {view === 'game' && (
        <>
          <div id="phaser-container" className="game-canvas-shell" />
          <GameUI
            gameState={gameState}
            power={power}
            onLeave={handleLeave}
            onPause={handlePause}
            onResume={handleResume}
            paused={paused}
            onToggleTheme={handleToggleTheme}
          />
        </>
      )}

      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="overlay-card glass-card" onClick={(e) => e.stopPropagation()}>
            {modal === 'instructions' ? (
              <>
                <h2>Instructions</h2>
                <ul className="help-list">
                  <li>Drag striker on baseline.</li>
                  <li>Press, aim, and release to shoot.</li>
                  <li>Pocket coins and race to {SCORE_TO_WIN} points.</li>
                </ul>
              </>
            ) : (
              <>
                <h2>Settings</h2>
                <p>Board Theme: {theme === 'classic' ? 'Classic Wood' : 'Noir Slate'}</p>
                <button className="btn btn-primary" onClick={handleToggleTheme}>Toggle Theme</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;