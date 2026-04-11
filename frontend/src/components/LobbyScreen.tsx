import { useState } from 'react';

export default function LobbyScreen({ 
  playerName, roomId, players, onCreate, onJoin, onStart, isHost, onLeaveRoom, onBack
}: any) {
  const [joinId, setJoinId] = useState('');
  const [chips, setChips] = useState(1000);
  const [blinds, setBlinds] = useState(10);
  const [allowRebuy, setAllowRebuy] = useState(false);
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'in-room'>(roomId ? 'in-room' : 'select');


  if (roomId) {
    return (
      <div className="glass-panel animate-enter">
        <h2 style={{ color: 'var(--accent)', marginBottom: 8, textAlign: 'center' }}>Room: {roomId}</h2>
        <div style={{ marginBottom: 24, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12 }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase', marginBottom: 12, letterSpacing: '1px' }}>Players ({players.length})</h3>
          <ul style={{ listStyle: 'none' }}>
            {players.map((p: any) => (
              <li key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{p.name} {p.id === players[0].id && '(Host)'}</span>
                <span style={{ color: 'var(--accent)' }}>${p.chips}</span>
              </li>
            ))}
          </ul>
        </div>
        {isHost ? (
           <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={onLeaveRoom}>Close Room</button>
              <button className="btn btn-primary" onClick={onStart} disabled={players.length < 2}>Start Game</button>
           </div>
        ) : (
           <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
              <button className="btn btn-secondary" onClick={onLeaveRoom}>Leave Table</button>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Waiting for host...</p>
           </div>
        )}
      </div>
    );
  }

  if (mode === 'create') {
     return (
       <div className="glass-panel animate-enter">
          <h2 style={{ marginBottom: 24 }}>Room Settings</h2>
          <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: 14 }}>Starting Balance ($)</label>
          <input type="number" className="input-field" value={chips} onChange={e => setChips(Number(e.target.value))} style={{ marginBottom: 16 }} />
          
          <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: 14 }}>Small Blind</label>
          <input type="number" className="input-field" value={blinds} onChange={e => setBlinds(Number(e.target.value))} style={{ marginBottom: 16 }} />
          
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: 'var(--text-main)', fontSize: 14 }}>
              <input type="checkbox" checked={allowRebuy} onChange={e => setAllowRebuy(e.target.checked)} style={{ marginRight: 8, accentColor: 'var(--accent)', cursor: 'pointer', transform: 'scale(1.2)' }}/>
              Enable 1 Re-buy Option
          </label>
          
          <button className="btn btn-primary" onClick={() => onCreate({ chips, blinds, allowRebuy })} style={{ marginBottom: 12 }}>Create Room</button>
          <button className="btn btn-secondary" onClick={() => setMode('select')}>Back</button>
       </div>
     )
  }

  if (mode === 'join') {
      return (
          <div className="glass-panel animate-enter">
             <h2 style={{ marginBottom: 24 }}>Join Table</h2>
             <input autoFocus type="text" placeholder="Enter Room ID" className="input-field" value={joinId} onChange={e => setJoinId(e.target.value.toUpperCase())} style={{ marginBottom: 24, textAlign: 'center', letterSpacing: '2px', fontSize: 20 }} />
             <button className="btn btn-primary" onClick={() => onJoin(joinId)} style={{ marginBottom: 12 }} disabled={!joinId.trim()}>Join</button>
             <button className="btn btn-secondary" onClick={() => setMode('select')}>Back</button>
          </div>
      )
  }

  return (
    <div className="glass-panel animate-enter" style={{ textAlign: 'center' }}>
      <h2 style={{ marginBottom: 8 }}>Welcome, <span style={{ color: 'var(--accent)' }}>{playerName}</span>!</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Choose your table options below.</p>
      
      <button className="btn btn-primary" onClick={() => setMode('create')} style={{ marginBottom: 16 }}>
        Create Private Table
      </button>
      <button className="btn btn-secondary" onClick={() => setMode('join')}>
        Join Existing Table
      </button>
      <div style={{ marginTop: 24 }}>
          <button className="btn btn-secondary" style={{ border: 'none', background: 'transparent' }} onClick={onBack}>
            ← Go Back / Change Name
          </button>
      </div>
    </div>
  );
}
