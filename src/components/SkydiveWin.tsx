import { useGameStore } from '../store/gameStore'

export function SkydiveWin() {
  const setPhase    = useGameStore((s) => s.setPhase)
  const setGameMode = useGameStore((s) => s.setGameMode)

  const btn = (color: string): React.CSSProperties => ({
    background: `${color}22`, border: `2px solid ${color}`, color,
    fontSize: 14, letterSpacing: 4, padding: '14px 32px', cursor: 'pointer',
    fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.15s',
    boxShadow: `0 0 14px ${color}44`,
  })

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #001a0a 0%, #000805 70%)',
      fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      <div style={{
        color: '#00ff88', fontSize: 13, letterSpacing: 10,
        textShadow: '0 0 12px #00cc44', marginBottom: 14,
      }}>
        MISSION ERFÜLLT
      </div>
      <div style={{
        color: '#00ff44', fontSize: 68, fontWeight: 'bold', letterSpacing: 6,
        textShadow: '0 0 30px #00ff44, 0 0 80px #007722', marginBottom: 10,
      }}>
        GELANDET
      </div>
      <div style={{
        color: '#224422', fontSize: 12, letterSpacing: 4, marginBottom: 52,
      }}>
        AGENT ERFOLGREICH INFILTRIERT
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <button
          style={btn('#00ff88')}
          onClick={() => { setGameMode('skydive'); setPhase('skydive') }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#00ff8844'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#00ff8822'; e.currentTarget.style.color = '#00ff88' }}
        >
          Nochmal
        </button>
        <button
          style={{
            background: 'transparent', border: '1px solid #1a2a1a', color: '#2a3a2a',
            fontSize: 14, letterSpacing: 4, padding: '14px 32px', cursor: 'pointer',
            fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.15s',
          }}
          onClick={() => setPhase('menu')}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#557755'; e.currentTarget.style.borderColor = '#334433' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#2a3a2a'; e.currentTarget.style.borderColor = '#1a2a1a' }}
        >
          Menü
        </button>
      </div>
    </div>
  )
}
