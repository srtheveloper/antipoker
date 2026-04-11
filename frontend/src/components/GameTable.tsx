import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

export default function GameTable({ gameState, socket }: { gameState: any, socket: Socket }) {
  const me = gameState?.players.find((p: any) => p.id === socket.id);
  const myTurn = gameState?.players[gameState?.currentPlayerIndex]?.id === socket.id;

  const [betAmount, setBetAmount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showRules, setShowRules] = useState(false);
  
  const toCall = gameState?.currentBet - (me?.currentBet || 0);
  const maxRaise = Math.max(0, (me?.chips || 0) - Math.max(0, toCall));
  const minRaiseAmount = Math.min(gameState?.bigBlind || 10, maxRaise);

  useEffect(() => {
     if (betAmount < minRaiseAmount) setBetAmount(minRaiseAmount);
     if (betAmount > maxRaise) setBetAmount(maxRaise);
  }, [minRaiseAmount, maxRaise, me?.chips]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
     if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
  }, [gameState?.logs]);

  const handleAction = (action: string, amount: number = 0) => {
    socket.emit('action', { roomId: gameState.id, action, amount });
  };

  const getRole = (id: string) => {
      let role = '';
      if (id === gameState?.dealerId && id === gameState?.sbId) role = 'D/SB';
      else if (id === gameState?.dealerId) role = 'D';
      else if (id === gameState?.sbId) role = 'SB';
      else if (id === gameState?.bbId) role = 'BB';
      return role;
  };

  const RoleBadge = ({ role }: { role: string }) => {
      if (!role) return null;
      return (
          <div style={{ position: 'absolute', top: -10, left: -10, background: 'var(--accent)', color: '#000', fontSize: 10, fontWeight: 900, borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000', zIndex: 20 }}>
             {role}
          </div>
      );
  };

  const renderPlayersOval = () => {
     const tableWidth = 380;
     const tableHeight = 180;
     const radiusX = tableWidth / 2 + 30; 
     const radiusY = tableHeight / 2 + 50;

     const otherPlayers = gameState?.players.filter((p: any) => p.id !== socket.id) || [];
     const total = otherPlayers.length;

     return otherPlayers.map((p: any, i: number) => {
        let angle;
        if (total === 1) { angle = Math.PI * 1.5; } 
        else if (total === 2) { angle = Math.PI * 1.2 + i * (Math.PI * 0.6); } 
        else {
           angle = Math.PI + (Math.PI / (Math.max(total - 1, 1))) * i;
        }

        const x = Math.cos(angle) * radiusX;
        const y = Math.sin(angle) * (radiusY - 20);

        const isIsActiveTurn = gameState?.players[gameState?.currentPlayerIndex]?.id === p.id && !gameState?.showdownData;

        return (
            <div key={p.id} style={{ 
                position: 'absolute', 
                top: `calc(50% + ${y}px)`, 
                left: `calc(50% + ${x}px)`, 
                transform: 'translate(-50%, -50%)',
                background: isIsActiveTurn ? 'rgba(34, 197, 94, 0.15)' : 'rgba(15, 23, 42, 0.85)', 
                padding: '10px 16px', borderRadius: 12,
                border: isIsActiveTurn ? '2px solid var(--accent)' : '1px solid var(--border)', 
                textAlign: 'center', minWidth: 100, zIndex: 5,
                boxShadow: isIsActiveTurn ? '0 0 15px rgba(34, 197, 94, 0.4)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: p.isSpectator ? 0.3 : 1
            }}>
                {!p.isSpectator && <RoleBadge role={getRole(p.id)} />}
                <div style={{ fontSize: 13, fontWeight: 700, color: isIsActiveTurn ? 'var(--accent)' : 'white' }}>{p.name} {p.isSpectator && '(Spectator)'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>${p.chips}</div>
                {isIsActiveTurn && <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4, fontWeight: 800, animation: 'pulse 1s infinite' }}>THINKING</div>}
                <div style={{ fontSize: 11, color: 'white', marginTop: 4, fontWeight: 600 }}>
                    {p.isSpectator ? <span style={{color: 'var(--text-muted)'}}>Out</span> : p.folded ? <span style={{color: 'var(--danger)'}}>Folded</span> : p.isAllIn ? <span style={{color: '#f59e0b'}}>ALL IN</span> : p.currentBet > 0 ? <span style={{color: 'var(--accent)'}}>Bet: ${p.currentBet}</span> : ''}
                </div>
            </div>
        );
     });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes flipIn {
            0% { transform: rotateY(90deg) scale(0.8); opacity: 0; }
            100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        .card-flip {
            animation: flipIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      {/* Top Bar Stats */}
      <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', zIndex: 50 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Room: {gameState?.id}</div>
        <div style={{ padding: '6px 16px', background: 'var(--accent)', borderRadius: 20, fontSize: 13, fontWeight: 800, boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)' }}>
          POT: ${gameState?.pot}
        </div>
        <div style={{ position: 'relative' }}>
           <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setShowMenu(!showMenu)}>Menu</button>
           {showMenu && (
             <div style={{ position: 'absolute', top: 35, right: 0, background: 'rgba(30,41,59,0.95)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
                <button className="btn btn-secondary" style={{ border: 'none', textAlign: 'left', background: 'transparent' }} onClick={() => { setShowRules(true); setShowMenu(false); }}>Show Rules</button>
                <div style={{ height: 1, background: 'var(--border)' }}></div>
                <button className="btn btn-secondary" style={{ border: 'none', textAlign: 'left', color: 'var(--danger)', background: 'transparent' }} onClick={() => socket.emit('leaveRoom')}>Exit Room</button>
             </div>
           )}
        </div>
      </div>

      {showRules && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
             <div className="glass-panel animate-enter" style={{ maxWidth: 400, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
                 <h2 style={{ color: 'var(--accent)', marginBottom: 16 }}>Poker Rankings</h2>
                 <ol style={{ paddingLeft: 20, color: 'var(--text-main)', lineHeight: 1.6 }}>
                    <li><strong style={{color: '#fbbf24'}}>Royal Flush</strong> (A K Q J 10, same suit)</li>
                    <li><strong style={{color: '#f59e0b'}}>Straight Flush</strong> (5 in sequence, same suit)</li>
                    <li><strong style={{color: '#ea580c'}}>Four of a Kind</strong> (4 cards of same rank)</li>
                    <li><strong style={{color: '#ef4444'}}>Full House</strong> (3 of a kind + Pair)</li>
                    <li><strong style={{color: '#ec4899'}}>Flush</strong> (5 cards of same suit)</li>
                    <li><strong style={{color: '#d946ef'}}>Straight</strong> (5 cards sequence)</li>
                    <li><strong style={{color: '#8b5cf6'}}>Three of a Kind</strong></li>
                    <li><strong style={{color: '#3b82f6'}}>Two Pair</strong></li>
                    <li><strong style={{color: '#06b6d4'}}>One Pair</strong></li>
                    <li><strong style={{color: 'var(--text-muted)'}}>High Card</strong></li>
                 </ol>
                 <button className="btn btn-secondary" style={{ marginTop: 24, width: '100%' }} onClick={() => setShowRules(false)}>Close</button>
             </div>
          </div>
      )}

      {/* Logs Feed */}
      <div style={{ position: 'absolute', top: 60, left: 10, zIndex: 40, width: 220, height: 140, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)', borderRadius: 8, padding: '8px 12px', overflowY: 'auto', fontSize: 11, color: 'var(--text-muted)' }} ref={scrollRef}>
          {gameState?.logs?.map((log: string, i: number) => (
             <div key={i} style={{ marginBottom: 6 }}>{log}</div>
          ))}
          <div style={{ float:"left", clear: "both" }} />
      </div>

      {me?.chips === 0 && !me?.isSpectator && (gameState?.phase === 'showdown' || gameState?.phase === 'waiting') && gameState?.phase !== 'gameOver' && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(5px)' }}>
             <div className="glass-panel animate-enter" style={{ maxWidth: 400, width: '100%', textAlign: 'center', border: '1px solid var(--danger)' }}>
                 <h2 style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 32 }}>Out of Chips!</h2>
                 
                 {gameState?.allowRebuy && !me?.hasRebought ? (
                     <>
                        <p style={{ color: 'var(--text-main)', marginBottom: 24, fontSize: 16 }}>You have been eliminated. Would you like to use your 1-time re-buy to restore your initial chips?</p>
                        <div style={{ display: 'flex', gap: 12 }}>
                           <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => socket.emit('spectate', { roomId: gameState.id })}>No, Spectate</button>
                           <button className="btn btn-primary" style={{ flex: 1, padding: '12px' }} onClick={() => socket.emit('rebuy', { roomId: gameState.id })}>Yes, Re-buy</button>
                        </div>
                     </>
                 ) : (
                     <>
                        <p style={{ color: 'var(--text-main)', marginBottom: 24, fontSize: 16 }}>You have been eliminated and cannot re-buy.</p>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => socket.emit('spectate', { roomId: gameState.id })}>Enter Spectator Mode</button>
                     </>
                 )}
             </div>
          </div>
      )}

      {gameState?.phase === 'gameOver' && gameState?.showdownData?.isGameOver && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
              <div className="animate-enter" style={{ textAlign: 'center', background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)', padding: '80px 20px', width: '100%', maxWidth: 600 }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
                  <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fbbf24', textShadow: '0 0 40px rgba(251, 191, 36, 0.8)', margin: 0, textTransform: 'uppercase', lineHeight: 1.1 }}>
                      {gameState.showdownData.winners.join(' & ')}<br/>IS THE GRAND CHAMPION!
                  </h1>
                  <p style={{ color: 'var(--text-main)', marginTop: 24, fontSize: 16, fontWeight: 600 }}>They eliminated all other players and won the table.</p>
                  <div style={{ fontSize: 24, color: 'var(--accent)', marginTop: 12, fontWeight: 800 }}>Total Chips: ${gameState.showdownData.amount}</div>
                  <button className="btn btn-primary" style={{ marginTop: 40, padding: '16px 32px', fontSize: 16, width: '100%' }} onClick={() => socket.emit('leaveRoom')}>Exit to Lobby</button>
              </div>
          </div>
      )}

      {gameState?.showdownData && !gameState?.showdownData?.isGameOver && (
          <div style={{ position: 'absolute', top: 55, left: 0, right: 0, bottom: 200, background: 'rgba(0,0,0,0.85)', zIndex: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
              <div className="animate-enter" style={{ textAlign: 'center', background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 60%)', padding: '60px 20px', width: '100%' }}>
                  <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fbbf24', textShadow: '0 0 30px rgba(251, 191, 36, 0.8)', margin: 0, textTransform: 'uppercase' }}>
                      {gameState.showdownData.winners.join(' & ')} {gameState.showdownData.winners.length > 1 ? 'WIN' : 'WINS'}!
                  </h1>
                  <div style={{ fontSize: 20, color: 'white', marginTop: 16 }}>
                      Hand: <strong style={{ color: 'var(--accent)' }}>{gameState.showdownData.hand}</strong>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', marginTop: 16 }}>
                      + ${gameState.showdownData.amount}
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginTop: 24, fontSize: 12 }}>Next hand starts in 10s...</p>
              </div>
          </div>
      )}

      {/* Poker Table Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ 
            width: '100%', maxWidth: '380px', height: '180px', 
            background: 'radial-gradient(ellipse at center, #064e3b 0%, #022c22 100%)', 
            borderRadius: '100px',
            border: '8px solid #92400e',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 30px rgba(0,0,0,0.8)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Community Cards */}
            <div style={{ display: 'flex', gap: 6, zIndex: 10 }}>
                {gameState?.communityCards.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 600, letterSpacing: '2px' }}>DEALING</div>
                ) : (
                    gameState?.communityCards.map((c: string, i: number) => (
                        <div key={c + i} className="card-flip" style={{ 
                            background: 'white', color: c.includes('h') || c.includes('d') ? '#ef4444' : '#0f172a', 
                            padding: '10px 6px', borderRadius: 6, fontWeight: 800, fontSize: 18,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.5)', width: 36, textAlign: 'center'
                        }}>
                            {c.replace('h', '♥').replace('d', '♦').replace('s', '♠').replace('c', '♣')}
                        </div>
                    ))
                )}
            </div>

            {renderPlayersOval()}
        </div>
      </div>

      {/* Player Area (Bottom) */}
      <div style={{ padding: '24px 20px', background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 20, zIndex: 50 }}>
        
        {/* Hand Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', opacity: me?.isSpectator ? 0.3 : 1 }}>
                {!me?.isSpectator && <RoleBadge role={getRole(me?.id)} />}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, paddingLeft: !me?.isSpectator && getRole(me?.id) ? 20 : 0 }}>
                    {me?.isSpectator ? "SPECTATING" : (myTurn && !gameState?.showdownData ? <span style={{ color: 'var(--accent)', fontWeight: 800 }}>YOUR TURN!</span> : "Your Hand")}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {me?.cards?.map((c: string, i: number) => (
                        <div key={i} style={{ 
                            background: 'white', color: c.includes('h') || c.includes('d') ? '#ef4444' : '#0f172a', 
                            padding: '14px 12px', borderRadius: 8, fontWeight: 800, fontSize: 24,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.5)', width: 50, textAlign: 'center',
                            opacity: me?.folded ? 0.4 : 1
                        }}>
                            {c.replace('h', '♥').replace('d', '♦').replace('s', '♠').replace('c', '♣')}
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: 12, color: 'white', marginTop: 12, fontWeight: 600 }}>Stack: <span style={{ color: 'var(--accent)'}}>${me?.chips}</span></div>
            </div>

            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Win Probability</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', textShadow: '0 0 20px rgba(34, 197, 94, 0.3)' }}>
                   {(me?.equity !== null && me?.equity !== undefined) ? `${me.equity}%` : '~%'}
                </div>
                {(me?.currentBet > 0 || me?.isAllIn) && (
                   <div style={{ fontSize: 12, color: 'white', marginTop: 8, fontWeight: 600 }}>
                      Current Bet: <span style={{ color: 'var(--accent)'}}>${me?.currentBet}</span>
                   </div>
                )}
            </div>
        </div>

        {/* Controls */}
        <div style={{ minHeight: 90 }}>
            {me?.isSpectator ? (
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                    SPECTATOR MODE
                </div>
            ) : (!myTurn || gameState?.showdownData) ? (
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {gameState?.showdownData ? "SHOWDOWN" : (me?.folded ? "FOLDED" : me?.isAllIn ? "ALL IN" : "WAITING FOR YOUR TURN...")}
                </div>
            ) : (
                <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }} onClick={() => handleAction('fold')}>Fold</button>
                        {toCall === 0 ? (
                           <button className="btn btn-secondary" style={{ flex: 1, background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent)' }} onClick={() => handleAction('check')}>Check</button>
                        ) : (
                           <button className="btn btn-secondary" style={{ flex: 1, border: '1px solid var(--accent)' }} onClick={() => handleAction('call')}>
                               Call ${window.Math.min(toCall, me?.chips)}
                           </button>
                        )}
                    </div>
                    {maxRaise > 0 && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 8 }}>
                             {toCall > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+${toCall} Call</div>}
                             <input 
                                type="range" 
                                min={minRaiseAmount} 
                                max={maxRaise} 
                                value={betAmount || minRaiseAmount} 
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
                             />
                             <div style={{ width: 60, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>+${betAmount}</div>
                             <button className="btn btn-primary" style={{ padding: '8px 14px', borderRadius: 8 }} onClick={() => handleAction(toCall > 0 ? 'raise' : 'bet', gameState.currentBet + betAmount)}>
                                 {toCall > 0 ? 'Raise' : 'Bet'}
                             </button>
                        </div>
                    )}
                </div>
            )}
        </div>

      </div>

    </div>
  );
}
