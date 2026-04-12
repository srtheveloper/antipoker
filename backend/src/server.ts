import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { GameRoom } from './game/GameRoom';

const app = express();
app.use(cors());

// Health check endpoint used by Docker
app.get('/health', (_req, res) => res.send('ok'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const rooms: Record<string, GameRoom> = {};

io.on('connection', (socket: Socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createRoom', ({ name, chips, blinds, allowRebuy }, callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Pass a broadcast callback closure
    const room = new GameRoom(roomId, chips, blinds, allowRebuy, () => {
        room.players.forEach(p => {
            io.to(p.id).emit('roomUpdated', room.getStateForPlayer(p.id));
        });
    });
    
    const player = room.addPlayer(socket.id, name);
    rooms[roomId] = room;
    socket.join(roomId);
    callback({ roomId, playerId: player?.id });
    io.to(roomId).emit('roomUpdated', room.getStateForPlayer(socket.id));
  });

  socket.on('joinRoom', ({ roomId, name }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      return callback({ error: "Room not found" });
    }
    const player = room.addPlayer(socket.id, name);
    if (!player) {
      return callback({ error: "Game already started" });
    }
    socket.join(roomId);
    callback({ roomId, playerId: player.id });
    
    room.players.forEach(p => {
        io.to(p.id).emit('roomUpdated', room.getStateForPlayer(p.id));
    });
  });
  
  socket.on('startGame', ({ roomId }) => {
     const room = rooms[roomId];
     if(room) {
         room.startGame();
         room.broadcast();
     }
  });

  socket.on('action', ({ roomId, action, amount }) => {
     const room = rooms[roomId];
     if(room) {
         room.playerAction(socket.id, action, amount);
         room.broadcast();
     }
  });

  socket.on('rebuy', ({ roomId }) => {
     const room = rooms[roomId];
     if (room) {
         room.playerRebuy(socket.id);
         room.broadcast();
     }
  });

  socket.on('spectate', ({ roomId }) => {
     const room = rooms[roomId];
     if (room) {
         room.playerSpectate(socket.id);
         room.broadcast();
     }
  });

  socket.on('leaveRoom', () => {
    for (const roomId in rooms) {
       const room = rooms[roomId];
       const playerIndex = room.players.findIndex(p => p.id === socket.id);
       if (playerIndex !== -1) {
           if (playerIndex === 0) { // Host leaves -> Destroy room
              io.to(roomId).emit('roomDestroyed');
              delete rooms[roomId];
           } else {
              room.removePlayer(socket.id);
              room.broadcast();
           }
           socket.leave(roomId);
           break;
       }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomId in rooms) {
       rooms[roomId].removePlayer(socket.id);
       const room = rooms[roomId];
       room.broadcast();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
