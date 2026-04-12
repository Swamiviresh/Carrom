require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createEngine, createStriker, createPuck, setupBoard, runSimulation } = require('./gameLogic');
const Matter = require('matter-js');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createRoom', () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const engine = createEngine();
    const striker = createStriker(370, 670);
    const pucks = setupBoard();
    
    Matter.World.add(engine.world, [striker, ...pucks]);

    rooms.set(roomCode, {
      players: [socket.id],
      engine,
      striker,
      pucks,
      gameState: {
        player1Score: 0,
        player2Score: 0,
        turn: 'player1',
        pucks: pucks.map(p => ({ x: p.position.x, y: p.position.y, label: p.label })),
        striker: { x: striker.position.x, y: striker.position.y }
      }
    });
    socket.join(roomCode);
    socket.emit('roomCreated', roomCode);
    console.log(`Room created: ${roomCode} by ${socket.id}`);
  });

  socket.on('joinRoom', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room && room.players.length < 2) {
      room.players.push(socket.id);
      socket.join(roomCode);
      io.to(roomCode).emit('playerJoined', {
        roomCode,
        players: room.players,
        gameState: room.gameState
      });
      console.log(`${socket.id} joined room: ${roomCode}`);
    } else {
      socket.emit('error', 'Room full or does not exist');
    }
  });

  socket.on('shoot', ({ roomCode, angle, power }) => {
    const room = rooms.get(roomCode);
    const playerIndex = room.players.indexOf(socket.id);
    const playerTurn = playerIndex === 0 ? 'player1' : 'player2';

    if (room && room.gameState.turn === playerTurn) {
      const simulation = runSimulation(room.engine, room.striker, room.pucks, { angle, power });
      
      // Update internal puck list (removing potted ones)
      room.pucks = room.pucks.filter(p => !simulation.potted.includes(p.label));

      // Rule processing
      let foul = simulation.strikerPotted;
      let pottedOwn = false;
      let pottedOpponent = false;
      let pottedQueen = simulation.potted.includes('queen');
      
      const myColor = playerTurn === 'player1' ? 'white' : 'black';
      const oppColor = playerTurn === 'player1' ? 'black' : 'white';

      simulation.potted.forEach(p => {
        if (p === myColor) {
            pottedOwn = true;
            if (playerTurn === 'player1') room.gameState.player1Score++;
            else room.gameState.player2Score++;
        }
        if (p === oppColor) {
            pottedOpponent = true;
            if (playerTurn === 'player1') room.gameState.player2Score++;
            else room.gameState.player1Score++;
        }
      });

      if (pottedOpponent || simulation.potted.length === 0) {
          // Switch turn if no puck potted or opponent's puck potted
          room.gameState.turn = room.gameState.turn === 'player1' ? 'player2' : 'player1';
      }

      if (foul) {
          room.gameState.notification = "Foul! Striker potted.";
          room.gameState.turn = room.gameState.turn === 'player1' ? 'player2' : 'player1';
          // Return one puck if possible (simplified)
      } else {
          room.gameState.notification = "";
      }

      room.gameState.pucks = simulation.bodies.filter(b => b.label !== 'striker');
      room.gameState.striker = simulation.bodies.find(b => b.label === 'striker');
      
      io.to(roomCode).emit('shotResult', room.gameState);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Cleanup rooms on disconnect
    rooms.forEach((room, roomCode) => {
      if (room.players.includes(socket.id)) {
        io.to(roomCode).emit('playerDisconnected');
        rooms.delete(roomCode);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
