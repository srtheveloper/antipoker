import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import EntryScreen from './components/EntryScreen';
import LobbyScreen from './components/LobbyScreen';
import GameTable from './components/GameTable';
import './index.css';

// Socket singleton
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket: Socket = io(BACKEND_URL);

type ScreenState = 'entry' | 'lobby' | 'game';

function App() {
  const [screen, setScreen] = useState<ScreenState>('entry');
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    socket.on('roomUpdated', (state) => {
      setGameState(state);
      if (state.phase === 'waiting') {
        setScreen('lobby');
      } else {
        setScreen('game');
      }
    });

    socket.on('roomDestroyed', () => {
      setGameState(null);
      setRoomId('');
      setScreen('lobby');
      setTimeout(() => alert('The host has closed the room.'), 100);
    });

    return () => {
      socket.off('roomUpdated');
      socket.off('roomDestroyed');
    };
  }, []);

  const handleEntrySubmit = (name: string) => {
    setPlayerName(name);
    setScreen('lobby');
  };

  const handleCreateRoom = (configs: any) => {
    socket.emit('createRoom', { name: playerName, ...configs }, (res: any) => {
      if (res.roomId) {
        setRoomId(res.roomId);
      }
    });
  };

  const handleJoinRoom = (id: string) => {
    socket.emit('joinRoom', { roomId: id, name: playerName }, (res: any) => {
      if (res.roomId) {
        setRoomId(res.roomId);
      } else if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleStartGame = () => {
    socket.emit('startGame', { roomId });
  };

  return (
    <div className="app-container">
      {screen === 'entry' && <EntryScreen onSubmit={handleEntrySubmit} />}
      {screen === 'lobby' && (
        <LobbyScreen 
            playerName={playerName} 
            roomId={roomId || gameState?.id} 
            players={gameState?.players || []}
            onCreate={handleCreateRoom} 
            onJoin={handleJoinRoom}
            onStart={handleStartGame}
            onLeaveRoom={() => {
                socket.emit('leaveRoom');
                setRoomId('');
                setGameState(null);
            }}
            onBack={() => setScreen('entry')}
            isHost={gameState?.players?.[0]?.id === socket.id}
        />
      )}
      {screen === 'game' && <GameTable gameState={gameState} socket={socket} />}
    </div>
  );
}

export default App;
