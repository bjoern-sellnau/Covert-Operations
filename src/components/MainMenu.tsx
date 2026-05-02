import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from '../game/loadoutStore'

const ENEMIES = [
  { color: '#ff5555', label: 'BASIC',      sub: '1 HP · 5 CR'  },
  { color: '#ff9922', label: 'FAST',       sub: '1 HP · 10 CR' },
  { color: '#aa55ff', label: 'TANK',       sub: '4 HP · 25 CR' },
  { color: '#ff2266', label: 'BERSERKER',  sub: '2 HP · 12 CR' },
  { color: '#ffbb33', label: 'FLANKER',    sub: '1 HP · 8 CR'  },
  { color: '#4488cc', label: 'JUGGERNAUT', sub: '10 HP · 30 CR'},
] as const

export function MainMenu() {
  const setPhase    = useGameStore((s) => s.setPhase)
  const setGameMode = useGameStore((s) => s.setGameMode)
  const { credits } = useLoadoutStore()

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, #0d1840 0%, #050512 65%, #020208 100%)',
      fontFamily: "'Courier New', monospace", userSelect: 'none', overflow: 'hidden',
    }}>

      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(0,100,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,100,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Corner markers */}
      {[
        { top: 16, left: 16, borderTop: '2px solid #00aaff44', borderLeft: '2px solid #00aaff44' },
        { top: 16, right: 16, borderTop: '2px solid #00aaff44', borderRight: '2px solid #00aaff44' },
        { bottom: 16, left: 16, borderBottom: '2px solid #00aaff44', borderLeft: '2px solid #00aaff44' },
        { bottom: 16, right: 16, borderBottom: '2px solid #00aaff44', borderRight: '2px solid #00aaff44' },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s }} />
      ))}

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div style={{
          color: '#00ccff', fontSize: 'clamp(44px, 8vw, 72px)', fontWeight: 'bold', letterSpacing: 10,
          textShadow: '0 0 10px #00aaff, 0 0 30px #0055ff, 0 0 80px #002299',
          lineHeight: 1,
        }}>
          COVERT
        </div>
        <div style={{
          color: '#e8f4ff', fontSize: 'clamp(16px, 3vw, 26px)', letterSpacing: 18,
          textShadow: '0 0 12px #88ccff88', marginTop: 4,
        }}>
          OPERATIONS
        </div>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 24px', width: 'min(90vw, 480px)' }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #00aaff44)' }} />
        <div style={{ color: '#00aaff66', fontSize: 9, letterSpacing: 4 }}>TAKTISCHES KAMPFSYSTEM</div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #00aaff44, transparent)' }} />
      </div>

      {/* Enemy guide */}
      <div style={{ display: 'flex', gap: 'clamp(10px, 2.5vw, 26px)', marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
        {ENEMIES.map(({ color, label, sub }) => (
          <div key={label} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: color,
              boxShadow: `0 0 8px ${color}, 0 0 16px ${color}66`,
            }} />
            <div style={{ color, fontWeight: 'bold', letterSpacing: 1, fontSize: 10 }}>{label}</div>
            <div style={{ color: '#8899aa', fontSize: 9 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Credits */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ color: '#8899aa', fontSize: 11, letterSpacing: 3 }}>CREDITS</div>
        <div style={{ color: '#ffee44', fontSize: 22, fontWeight: 'bold', textShadow: '0 0 10px #ffcc00' }}>
          {credits.toString().padStart(5, '0')}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: 'min(90vw, 340px)' }}>

        {/* Primary */}
        <button
          style={{
            width: '100%', padding: '15px 0',
            background: 'linear-gradient(135deg, #003366 0%, #001a44 100%)',
            border: '1px solid #00aaff', color: '#00ddff',
            fontSize: 15, letterSpacing: 5, textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 0 20px #00aaff44, inset 0 0 20px #00aaff11',
            transition: 'all 0.15s',
          }}
          onClick={() => setPhase('shop')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #005599 0%, #003366 100%)'
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.boxShadow = '0 0 32px #00aaff88, inset 0 0 24px #00aaff22'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #003366 0%, #001a44 100%)'
            e.currentTarget.style.color = '#00ddff'
            e.currentTarget.style.boxShadow = '0 0 20px #00aaff44, inset 0 0 20px #00aaff11'
          }}
        >
          Ausrüstung &amp; Start
        </button>

        {/* Secondary row */}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {[
            { label: 'Level Editor',  color: '#00ff88', onClick: () => setPhase('editor') },
            { label: '↓ Missionen',   color: '#ff9922', onClick: () => setPhase('missions') },
            { label: '⬡ Multiplayer', color: '#aa55ff', onClick: () => setPhase('lobby') },
          ].map(({ label, color, onClick }) => (
            <button
              key={label}
              style={{
                flex: 1, padding: '11px 4px',
                background: `${color}11`,
                border: `1px solid ${color}66`, color,
                fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: `0 0 10px ${color}22`,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onClick={onClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${color}28`
                e.currentTarget.style.borderColor = color
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.boxShadow = `0 0 16px ${color}55`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${color}11`
                e.currentTarget.style.borderColor = `${color}66`
                e.currentTarget.style.color = color
                e.currentTarget.style.boxShadow = `0 0 10px ${color}22`
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Ghost row */}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {[
            { label: 'Direkt spielen', onClick: () => { setGameMode('arena'); setPhase('briefing') } },
            { label: '⚙ Optionen',     onClick: () => setPhase('options') },
            { label: '? Hilfe',         onClick: () => setPhase('help') },
          ].map(({ label, onClick }) => (
            <button
              key={label}
              style={{
                flex: 1, padding: '9px 4px',
                background: 'transparent', border: '1px solid #2a3a4a', color: '#7799aa',
                fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onClick={onClick}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#cce4ff'; e.currentTarget.style.borderColor = '#4a6a80' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#7799aa'; e.currentTarget.style.borderColor = '#2a3a4a' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{ color: '#667788', fontSize: 10, marginTop: 26, letterSpacing: 2, textAlign: 'center' }}>
        WASD · MAUS · LMT &nbsp;·&nbsp; SHIFT = BULLET TIME &nbsp;·&nbsp; F = EGOPERSPEKTIVE
      </div>
    </div>
  )
}
