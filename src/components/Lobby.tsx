import { useState, useRef, useEffect } from 'react'
import { useNetStore } from '../net/netStore'
import { useGameStore } from '../store/gameStore'
import { socket, connectSocket, disconnectSocket } from '../net/socket'
import type { NetRoom } from '../net/netTypes'

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
    setPlayerName(nameInput.trim() || 'Spieler')
    connectSocket()
  }

  function handleCreateRoom() {
    setError('')
    socket.emit('create_room', nameInput.trim() || 'Spieler', (result: { roomId?: string; error?: string }) => {
      if (result.error) { setError(result.error); return }
      setRole('host')
    })
  }

  function handleJoinRoom() {
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
    socket.emit('leave_room')
    setRole('offline')
    setRoom(null)
    setError('')
  }

  function handleStartGame() {
    socket.emit('start_game')
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    socket.emit('chat_message', chatInput.trim())
    setChatInput('')
  }

  function handleDisconnect() {
    disconnectSocket()
    setRole('offline')
    setRoom(null)
    setError('')
  }

  const label: React.CSSProperties = {
    color: '#556677', fontSize: 10, letterSpacing: 3, marginBottom: 5, textTransform: 'uppercase',
  }
  const inputStyle: React.CSSProperties = {
    background: '#08080f', border: '1px solid #223344', color: '#aaccff',
    fontSize: 14, padding: '9px 12px', fontFamily: "'Courier New', monospace",
    outline: 'none', width: '100%', boxSizing: 'border-box', letterSpacing: 1,
  }
  const btn = (color: string, disabled = false): React.CSSProperties => ({
    background: disabled ? 'transparent' : `${color}18`,
    border: `1px solid ${disabled ? '#1a2530' : color}`,
    color: disabled ? '#223344' : color,
    fontSize: 11, letterSpacing: 3, padding: '9px 20px',
    cursor: disabled ? 'default' : 'pointer', fontFamily: "'Courier New', monospace",
    textTransform: 'uppercase', transition: 'all 0.12s',
    pointerEvents: disabled ? 'none' : 'auto',
  })

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #07071e 0%, #000006 70%)',
      fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      {/* Title */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ color: '#00aaff', fontSize: 34, fontWeight: 'bold', letterSpacing: 6, textShadow: '0 0 18px #00aaff88' }}>
          COVERT OPERATIONS
        </div>
        <div style={{ color: '#334455', fontSize: 11, letterSpacing: 5, marginTop: 4 }}>ONLINE</div>
      </div>

      {!connected ? (
        /* ── Connect screen ──────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 300 }}>
          <div>
            <div style={label}>Spielername</div>
            <input
              style={inputStyle}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConnect() }}
              maxLength={20}
              placeholder="Spieler"
              autoFocus
            />
          </div>
          <button style={btn('#00aaff')} onClick={handleConnect}>
            ● Verbinden
          </button>
          <button style={{ ...btn('#334455'), fontSize: 10 }} onClick={() => setPhase('menu')}>
            ← Zurück
          </button>
        </div>
      ) : !room ? (
        /* ── Room select ─────────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 300 }}>
          <div style={{ color: '#00ff88', fontSize: 10, letterSpacing: 2, textAlign: 'center', marginBottom: 4 }}>
            ● VERBUNDEN — {nameInput || playerName}
          </div>
          <div style={{ height: 1, background: '#0d1a22' }} />
          <button style={btn('#00aaff')} onClick={handleCreateRoom}>
            + Neuen Raum erstellen
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, fontSize: 20, letterSpacing: 8, textAlign: 'center', textTransform: 'uppercase', flex: 1 }}
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoinRoom() }}
              placeholder="CODE"
              maxLength={4}
            />
            <button style={{ ...btn('#00ff88'), whiteSpace: 'nowrap', fontSize: 12 }} onClick={handleJoinRoom}>
              Beitrete
            </button>
          </div>
          {error && <div style={{ color: '#ff5555', fontSize: 11, textAlign: 'center' }}>{error}</div>}
          <button style={{ ...btn('#223344'), fontSize: 10 }} onClick={handleDisconnect}>
            Trennen
          </button>
        </div>
      ) : (
        /* ── In room ─────────────────────────────────────────────────── */
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          {/* Left: room info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 260 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={label}>Raumcode</div>
              <div style={{
                color: '#00aaff', fontSize: 52, fontWeight: 'bold', letterSpacing: 14,
                textShadow: '0 0 24px #00aaff55', lineHeight: 1,
              }}>
                {room.id}
              </div>
              <div style={{ color: '#223344', fontSize: 9, letterSpacing: 2, marginTop: 6 }}>
                Anderen Spielern mitteilen
              </div>
            </div>

            <div style={{ height: 1, background: '#0d1a22' }} />

            {/* Player list */}
            <div>
              <div style={label}>Spieler ({room.players.length} / 2)</div>
              {room.players.map((p) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', marginBottom: 4,
                  border: `1px solid ${p.id === socket.id ? '#00aaff33' : '#111a22'}`,
                  background: p.id === socket.id ? '#00aaff08' : 'transparent',
                }}>
                  <span style={{ color: p.isHost ? '#00aaff' : '#aaccee', fontSize: 10 }}>
                    {p.isHost ? '♦' : '○'}
                  </span>
                  <span style={{ color: p.id === socket.id ? '#00ccff' : '#99bbcc', fontSize: 12, letterSpacing: 2, flex: 1 }}>
                    {p.name}
                  </span>
                  {p.isHost && (
                    <span style={{ color: '#223344', fontSize: 9, letterSpacing: 2 }}>HOST</span>
                  )}
                  {p.id === socket.id && (
                    <span style={{ color: '#224433', fontSize: 9, letterSpacing: 2 }}>DU</span>
                  )}
                </div>
              ))}
              {room.players.length < 2 && (
                <div style={{ padding: '7px 10px', border: '1px dashed #0d1a22', color: '#1a2a35', fontSize: 11, letterSpacing: 2 }}>
                  Warte auf Spieler...
                </div>
              )}
            </div>

            {error && <div style={{ color: '#ff5555', fontSize: 11 }}>{error}</div>}

            {role === 'host' ? (
              <button
                style={btn('#00ff88', room.players.length < 1)}
                onClick={handleStartGame}
              >
                ▶ Spiel starten
              </button>
            ) : (
              <div style={{ color: '#223344', fontSize: 11, letterSpacing: 2, textAlign: 'center', padding: '9px 0' }}>
                Warte auf Host...
              </div>
            )}

            <button style={{ ...btn('#883333'), fontSize: 10 }} onClick={handleLeave}>
              Raum verlassen
            </button>
          </div>

          {/* Right: chat */}
          <div style={{ display: 'flex', flexDirection: 'column', width: 300, height: 360 }}>
            <div style={label}>Chat</div>
            <div style={{
              flex: 1, background: '#040410', border: '1px solid #0d1a22',
              overflowY: 'auto', padding: '8px 10px',
              display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              {chatMessages.length === 0 && (
                <div style={{ color: '#1a2a35', fontSize: 10, letterSpacing: 1, fontStyle: 'italic' }}>
                  Noch keine Nachrichten...
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'baseline', wordBreak: 'break-word' }}>
                  <span style={{
                    color: msg.playerId === socket.id ? '#00aaff' : '#556677',
                    fontSize: 10, letterSpacing: 1, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {msg.name}:
                  </span>
                  <span style={{ color: '#8aabb8', fontSize: 11 }}>{msg.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 6, marginTop: 7 }}>
              <input
                style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '7px 10px' }}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nachricht eingeben..."
                maxLength={200}
              />
              <button
                type="submit"
                style={{ ...btn('#00aaff'), whiteSpace: 'nowrap', padding: '7px 14px' }}
              >
                ↵
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
