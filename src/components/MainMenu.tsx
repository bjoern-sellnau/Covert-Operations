import { useGameStore } from '../store/gameStore'

export function MainMenu() {
  const setPhase = useGameStore((s) => s.setPhase)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #0a0a2a 0%, #000008 70%)',
        fontFamily: "'Courier New', monospace",
        userSelect: 'none',
      }}
    >
      {/* Title */}
      <div
        style={{
          color: '#00aaff',
          fontSize: 64,
          fontWeight: 'bold',
          letterSpacing: 8,
          textTransform: 'uppercase',
          textShadow: '0 0 20px #00aaff, 0 0 60px #0055ff',
          marginBottom: 8,
        }}
      >
        COVERT
      </div>
      <div
        style={{
          color: '#ffffff',
          fontSize: 28,
          letterSpacing: 16,
          textTransform: 'uppercase',
          textShadow: '0 0 10px #aaaaff',
          marginBottom: 60,
        }}
      >
        OPERATIONS
      </div>

      {/* Enemy guide */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          marginBottom: 60,
          color: '#aaaacc',
          fontSize: 13,
        }}
      >
        {[
          { color: '#ff4444', label: 'BASIC', pts: '10 pts', desc: '1 HP · Slow' },
          { color: '#ff8800', label: 'FAST', pts: '25 pts', desc: '1 HP · Fast' },
          { color: '#9944ff', label: 'TANK', pts: '60 pts', desc: '4 HP · Heavy' },
        ].map(({ color, label, pts, desc }) => (
          <div key={label} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 10px ${color}`,
              }}
            />
            <div style={{ color, fontWeight: 'bold', letterSpacing: 2 }}>{label}</div>
            <div style={{ color: '#ffee00' }}>{pts}</div>
            <div style={{ color: '#667788', fontSize: 11 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Start button */}
      <button
        onClick={() => setPhase('playing')}
        style={{
          background: 'transparent',
          border: '2px solid #00aaff',
          color: '#00aaff',
          fontSize: 20,
          letterSpacing: 6,
          textTransform: 'uppercase',
          padding: '16px 48px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 0 20px #00aaff44, inset 0 0 20px #00aaff11',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.background = '#00aaff22'
          el.style.boxShadow = '0 0 30px #00aaffaa, inset 0 0 30px #00aaff33'
          el.style.color = '#ffffff'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.background = 'transparent'
          el.style.boxShadow = '0 0 20px #00aaff44, inset 0 0 20px #00aaff11'
          el.style.color = '#00aaff'
        }}
      >
        Start Mission
      </button>

      <div style={{ color: '#334455', fontSize: 12, marginTop: 40, letterSpacing: 2 }}>
        WASD · AIM WITH MOUSE · CLICK OR SPACE TO FIRE
      </div>
    </div>
  )
}
