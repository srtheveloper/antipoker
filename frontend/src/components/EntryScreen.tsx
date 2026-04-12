import { useState, useMemo } from 'react';
import { Play } from 'lucide-react';

import wp1 from '../assets/wallpaper/IMG_3199.JPG';
import wp2 from '../assets/wallpaper/IMG_3200.JPG';
import wp3 from '../assets/wallpaper/IMG_3201.JPG';
import wp4 from '../assets/wallpaper/IMG_3202.JPG';

const wallpapers = [wp1, wp2, wp3, wp4];

export default function EntryScreen({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');

  // Pick one image randomly, stable for the lifetime of this component
  const wallpaper = useMemo(
    () => wallpapers[Math.floor(Math.random() * wallpapers.length)],
    []
  );

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 420, margin: '0 auto' }}>

      {/* ── Top half: wallpaper with circular blur vignette ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 220,
        borderRadius: '20px 20px 0 0',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Photo */}
        <img
          src={wallpaper}
          alt="Casino atmosphere"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />

        {/* Circular radial blur overlay — darkens edges, keeps centre alive */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 55% 60% at 50% 45%, transparent 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.72) 100%)',
        }} />

        {/* Frosted glass strip at very bottom to blend into the card below */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: 'linear-gradient(to bottom, transparent, rgba(10,14,26,0.95))',
        }} />

        {/* Title overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 44,
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-1px',
            textShadow: '0 2px 18px rgba(0,0,0,0.7)',
          }}>
            Anti<span style={{ color: 'var(--accent)' }}>Poker</span>
          </h1>
          <p style={{
            margin: 0,
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            textShadow: '0 1px 8px rgba(0,0,0,0.6)',
          }}>
            Texas Hold&apos;em Premium
          </p>
        </div>
      </div>

      {/* ── Bottom half: form card ── */}
      <div className="glass-panel" style={{
        borderRadius: '0 0 20px 20px',
        borderTop: 'none',
        textAlign: 'center',
        paddingTop: 28,
      }}>
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

    </div>
  );
}
