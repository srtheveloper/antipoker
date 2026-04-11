import { useState } from 'react';
import { Play } from 'lucide-react';

export default function EntryScreen({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <div className="glass-panel animate-enter" style={{ textAlign: 'center' }}>
      <h1 style={{ marginBottom: 8, fontSize: 36, color: 'var(--accent)', letterSpacing: '-1px' }}>AntiPoker</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Texas Hold'em Premium</p>
      
      <form onSubmit={(e) => { e.preventDefault(); if (name) onSubmit(name); }}>
        <input 
          autoFocus
          type="text" 
          placeholder="Enter your alias..." 
          className="input-field"
          value={name}
          maxLength={15}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: 16, textAlign: 'center' }}
        />
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
          <Play size={20} />
          Enter Casino
        </button>
      </form>
    </div>
  );
}
