import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from '../game/loadoutStore'

export function MainMenu() {
  const setPhase = useGameStore((s) => s.setPhase)
  const { credits } = useLoadoutStore()

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #0a0a2a 0%, #000008 70%)',
      fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      <div style={{
        color: '#00aaff', fontSize: 64, fontWeight: 'bold', letterSpacing: 8,
        textTransform: 'uppercase', textShadow: '0 0 20px #00aaff, 0 0 60px #0055ff', marginBottom: 8,
      }}>
        COVERT
      </div>
      <div style={{
        color: '#ffffff', fontSize: 28, letterSpacing: 16, textTransform: 'uppercase',
        textShadow: '0 0 10px #aaaaff', marginBottom: 60,
      }}>
        OPERATIONS
      </div>

      {/* Enemy guide */}
      <div style={{ display: 'flex', gap: 40, marginBottom: 60, color: '#aaaacc', fontSize: 13 }}>
        {([
          { color: '#ff4444', label: 'BASIC', pts: '10 Pkt / 5 CR', desc: '1 HP · Langsam' },
          { color: '#ff8800', label: 'FAST', pts: '25 Pkt / 10 CR', desc: '1 HP · Schnell' },
          { color: '#9944ff', label: 'TANK', pts: '60 Pkt / 25 CR', desc: '4 HP · Schwer' },
        ] as const).map(({ color, label, pts, desc }) => (
          <div key={label} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
            <div style={{ color, fontWeight: 'bold', letterSpacing: 2 }}>{label}</div>
            <div style={{ color: '#ffee00', fontSize: 11 }}>{pts}</div>
            <div style={{ color: '#667788', fontSize: 11 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Credits display */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: '#445566', fontSize: 12, letterSpacing: 2 }}>VERFÜGBARE CREDITS</div>
        <div style={{ color: '#ffee00', fontSize: 22, fontWeight: 'bold', textShadow: '0 0 8px #ffcc00' }}>
          {credits.toString().padStart(5, '0')}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <button
          onClick={() => setPhase('shop')}
          style={{
            background: '#00aaff22', border: '2px solid #00aaff', color: '#00aaff',
            fontSize: 18, letterSpacing: 6, textTransform: 'uppercase', padding: '16px 56px',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 0 20px #00aaff44, inset 0 0 20px #00aaff11', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#00aaff44'; e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#00aaff22'; e.currentTarget.style.color = '#00aaff' }}
        >
          Ausrüstung & Start
        </button>

        <button
          onClick={() => setPhase('playing')}
          style={{
            background: 'transparent', border: '1px solid #334455', color: '#445566',
            fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', padding: '10px 40px',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#667788'; e.currentTarget.style.color = '#aabbcc' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334455'; e.currentTarget.style.color = '#445566' }}
        >
          Direkt spielen
        </button>
      </div>

      <div style={{ color: '#334455', fontSize: 11, marginTop: 40, letterSpacing: 2 }}>
        WASD · MAUS ZIELEN · KLICK ODER SPACE SCHIESST · SHIFT VERLANGSAMT ZEIT
      </div>
    </div>
  )
}
