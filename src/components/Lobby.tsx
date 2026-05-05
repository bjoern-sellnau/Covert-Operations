import { useState, useRef, useEffect } from 'react'
import { useNetStore } from '../net/netStore'
import { useGameStore } from '../store/gameStore'
import { socket, connectSocket, disconnectSocket } from '../net/socket'
import type { NetRoom } from '../net/netTypes'
import { playClick, playHover } from '../game/uiSounds'

export function Lobby() {
  const { connected, role, room, playerName, chatMessages,
          setRole, setRoom, setPlayerName } = useNetStore()
  const setPhase = useGameStore((s) => s.setPhase)

  const [nameInput,     setNameInput]     = useState(playerName || 'Spieler')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [chatInput,     setChatInput]     = useState('')
  const [error,         setError]         = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  function handleConnect() {
    playClick()
    setPlayerName(nameInput.trim() || 'Spieler')
    connectSocket()
  }

  function handleCreateRoom() {
    playClick()
    setError('')
    socket.emit('create_room', nameInput.trim() || 'Spieler', (result: { roomId?: string; error?: string }) => {
      if (result.error) { setError(result.error); return }
      setRole('host')
    })
  }

  function handleJoinRoom() {
    playClick()
    setError('')
    const code = roomCodeInput.trim().toUpperCase()
    if (code.length !== 4) { setError('Bitte 4-stelligen Code eingeben'); return }
    socket.emit('join_room', code, nameInput.trim() || 'Spieler', (result: { room?: NetRoom; error?: string }) => {
      if (result.error) { setError(result.error); return }
      setRole('guest')
      if (result.room) setRoom(result.room)
    })
  }

  function handleLeave() {
    playClick()
    socket.emit('leave_room')
    setRole('offline')
    setRoom(null)
    setError('')
  }

  function handleStartGame() {
    playClick()
    socket.emit('start_game')
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    socket.emit('chat_message', chatInput.trim())
    setChatInput('')
  }

  function handleDisconnect() {
    playClick()
    disconnectSocket()
    setRole('offline')
    setRoom(null)
    setError('')
  }

  const monoLabel: React.CSSProperties = {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9, letterSpacing: '0.35em', color: 'rgba(106,112,72,0.5)',
    textTransform: 'uppercase', marginBottom: 6,
  }

  const field: React.CSSProperties = {
    background: 'rgba(10,12,7,0.9)', border: '1px solid rgba(138,154,98,0.25)',
    color: 'rgba(220,216,200,0.9)', fontSize: 13,
    padding: '9px 12px', fontFamily: "'Share Tech Mono', monospace",
    outline: 'none', width: '100%', boxSizing: 'border-box', letterSpacing: '0.1em',
  }

  const coBtn = (color: string, disabled = false): React.CSSProperties => ({
    background:  disabled ? 'transparent' : `${color}14`,
    border:      `1px solid ${disabled ? 'rgba(138,154,98,0.12)' : color}`,
    color:       disabled ? 'rgba(106,112,72,0.3)' : color,
    fontFamily:  "'Share Tech Mono', monospace",
    fontSize:    10, letterSpacing: '0.25em', padding: '10px 20px',
    cursor:      disabled ? 'default' : 'pointer',
    textTransform: 'uppercase', transition: 'all 0.12s',
    pointerEvents: disabled ? 'none' : 'auto',
    width: '100%',
  })

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      animation: 'menuFadeIn 0.35s cubic-bezier(0.2,0.8,0.3,1) both',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      fontFamily: "'DM Sans', sans-serif", userSelect: 'none',
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(138,154,98,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(138,154,98,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(224,84,24,0.8), transparent)', pointerEvents: 'none' }} />

      {/* Corner brackets */}
      {(['top', 'bottom'] as const).flatMap((v) =>
        (['left', 'right'] as const).map((h) => (
          <div key={v + h} style={{
            position: 'absolute', [v]: 20, [h]: 24, width: 28, height: 28,
            [`border${v.charAt(0).toUpperCase() + v.slice(1)}`]: '1.5px solid #8a9a62',
            [`border${h.charAt(0).toUpperCase() + h.slice(1)}`]: '1.5px solid #8a9a62',
            opacity: 0.5, pointerEvents: 'none',
          }} />
        ))
      )}

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
            fontSize: 13, letterSpacing: '0.3em', color: '#e05418', marginBottom: 8,
          }}>Δ COVERT OPERATIONS</div>
          <div style={{
            fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
            fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: '0.18em',
            color: 'rgba(224,220,200,0.9)', textShadow: '0 0 40px rgba(224,84,24,0.15)',
          }}>ONLINE</div>
          <div style={{ width: 220, height: 1, background: 'rgba(224,84,24,0.5)', margin: '12px auto 0' }} />
        </div>

        {!connected ? (
          /* ── Connect ────────────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(96vw, 320px)' }}>
            <div>
              <div style={monoLabel}>Spielername</div>
              <input
                style={field}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConnect() }}
                maxLength={20}
                placeholder="Spieler"
                autoFocus
              />
            </div>
            <button style={coBtn('#e05418')} onClick={handleConnect} onMouseEnter={() => playHover()}>
              ● Verbinden
            </button>
            <button
              style={{ ...coBtn('rgba(106,112,72,0.6)'), border: 'none', background: 'transparent', width: 'auto', textAlign: 'center' }}
              onClick={() => { playClick(); setPhase('multiplayer_menu') }}
              onMouseEnter={() => playHover()}
            >← Zurück</button>
          </div>

        ) : !room ? (
          /* ── Room select ──────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(96vw, 320px)' }}>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em',
              color: '#44ff88', textAlign: 'center', marginBottom: 4,
            }}>● VERBUNDEN — {nameInput || playerName}</div>

            <div style={{ height: 1, background: 'rgba(138,154,98,0.12)' }} />

            <button style={coBtn('#e05418')} onClick={handleCreateRoom} onMouseEnter={() => playHover()}>
              + Neuen Raum erstellen
            </button>

            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={{ ...field, fontSize: 20, letterSpacing: '0.4em', textAlign: 'center', textTransform: 'uppercase', flex: 1 }}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleJoinRoom() }}
                placeholder="CODE"
                maxLength={4}
              />
              <button style={{ ...coBtn('#8a9a62'), width: 'auto', whiteSpace: 'nowrap', padding: '10px 16px' }} onClick={handleJoinRoom} onMouseEnter={() => playHover()}>
                Beitrete
              </button>
            </div>

            {error && <div style={{ color: '#ff5555', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, textAlign: 'center', letterSpacing: '0.1em' }}>{error}</div>}

            <button style={{ ...coBtn('rgba(138,154,98,0.4)'), borderColor: 'rgba(138,154,98,0.2)' }} onClick={handleDisconnect} onMouseEnter={() => playHover()}>
              Trennen
            </button>
          </div>

        ) : (
          /* ── In room ──────────────────────────────────────────────── */
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', width: 'min(96vw, 640px)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Left: room info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 260 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={monoLabel}>Raumcode</div>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  color: '#e05418', fontSize: 52, letterSpacing: '0.3em',
                  textShadow: '0 0 24px rgba(224,84,24,0.5)', lineHeight: 1,
                }}>{room.id}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.2em', color: 'rgba(106,112,72,0.4)', marginTop: 6 }}>
                  Code an Mitspieler weitergeben
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(138,154,98,0.12)' }} />

              {/* Player list */}
              <div>
                <div style={monoLabel}>Spieler ({room.players.length} / 2)</div>
                {room.players.map((p) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4,
                    border: `1px solid ${p.id === socket.id ? 'rgba(224,84,24,0.3)' : 'rgba(138,154,98,0.1)'}`,
                    background: p.id === socket.id ? 'rgba(224,84,24,0.05)' : 'transparent',
                  }}>
                    <span style={{ color: p.isHost ? '#e05418' : 'rgba(138,154,98,0.6)', fontSize: 10 }}>
                      {p.isHost ? 'Δ' : '○'}
                    </span>
                    <span style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      color: p.id === socket.id ? '#e05418' : 'rgba(220,216,200,0.75)',
                      fontSize: 12, letterSpacing: '0.1em', flex: 1,
                    }}>{p.name}</span>
                    {p.isHost && <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(106,112,72,0.35)', fontSize: 8, letterSpacing: '0.2em' }}>HOST</span>}
                    {p.id === socket.id && <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(224,84,24,0.4)', fontSize: 8, letterSpacing: '0.2em' }}>DU</span>}
                  </div>
                ))}
                {room.players.length < 2 && (
                  <div style={{
                    padding: '8px 12px', border: '1px dashed rgba(138,154,98,0.15)',
                    fontFamily: "'Share Tech Mono', monospace", color: 'rgba(106,112,72,0.3)', fontSize: 10, letterSpacing: '0.1em',
                  }}>Warte auf Spieler...</div>
                )}
              </div>

              {error && <div style={{ color: '#ff5555', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.1em' }}>{error}</div>}

              {role === 'host' ? (
                <button style={coBtn('#44ff88', room.players.length < 1)} onClick={handleStartGame} onMouseEnter={() => playHover()}>
                  ▶ Spiel starten
                </button>
              ) : (
                <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(106,112,72,0.4)', fontSize: 10, letterSpacing: '0.2em', textAlign: 'center', padding: '10px 0' }}>
                  Warte auf Host...
                </div>
              )}

              <button style={{ ...coBtn('rgba(200,80,60,0.7)'), borderColor: 'rgba(200,80,60,0.3)' }} onClick={handleLeave} onMouseEnter={() => playHover()}>
                Raum verlassen
              </button>
            </div>

            {/* Right: chat */}
            <div style={{ display: 'flex', flexDirection: 'column', width: 280, height: 340 }}>
              <div style={monoLabel}>Chat</div>
              <div style={{
                flex: 1, background: 'rgba(8,10,6,0.9)', border: '1px solid rgba(138,154,98,0.15)',
                overflowY: 'auto', padding: '8px 10px',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                {chatMessages.length === 0 && (
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(106,112,72,0.3)', fontSize: 9, fontStyle: 'italic', letterSpacing: '0.1em' }}>
                    Noch keine Nachrichten...
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'baseline', wordBreak: 'break-word' }}>
                    <span style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      color: msg.playerId === socket.id ? '#e05418' : 'rgba(138,154,98,0.6)',
                      fontSize: 9, letterSpacing: '0.1em', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{msg.name}:</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(220,216,200,0.7)', fontSize: 11 }}>{msg.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input
                  style={{ ...field, fontSize: 11, flex: 1 }}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nachricht..."
                  maxLength={120}
                />
                <button type="submit" style={{ ...coBtn('#8a9a62'), width: 'auto', padding: '9px 14px' }} onMouseEnter={() => playHover()}>
                  ➤
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
