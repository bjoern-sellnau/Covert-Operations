import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from '../game/loadoutStore'
import { useSettingsStore } from '../store/settingsStore'

export function MainMenu() {
  const setPhase         = useGameStore((s) => s.setPhase)
  const setGameMode      = useGameStore((s) => s.setGameMode)
  const { credits }      = useLoadoutStore()
  const { bloodIntensity, setBloodIntensity } = useSettingsStore()

  const bloodLabels = ['AUS', 'DEZENT', 'NORMAL', 'ÜBERTRIEBEN'] as const

  const bigBtn = (color: string): React.CSSProperties => ({
    background: `${color}22`, border: `2px solid ${color}`, color,
    fontSize: 16, letterSpacing: 5, textTransform: 'uppercase', padding: '14px 48px',
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: `0 0 16px ${color}44`, transition: 'all 0.15s',
  })

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #0a0a2a 0%, #000008 70%)',
      fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      <div style={{ color: '#00aaff', fontSize: 64, fontWeight: 'bold', letterSpacing: 8, textShadow: '0 0 20px #00aaff, 0 0 60px #0055ff', marginBottom: 8 }}>
        COVERT
      </div>
      <div style={{ color: '#ffffff', fontSize: 28, letterSpacing: 16, textShadow: '0 0 10px #aaaaff', marginBottom: 50 }}>
        OPERATIONS
      </div>

      {/* Enemy guide */}
      <div style={{ display: 'flex', gap: 36, marginBottom: 48, fontSize: 12 }}>
        {([
          { color: '#ff4444', label: 'BASIC', sub: '1 HP · 5 CR' },
          { color: '#ff8800', label: 'FAST',  sub: '1 HP · 10 CR' },
          { color: '#9944ff', label: 'TANK',  sub: '4 HP · 25 CR' },
        ] as const).map(({ color, label, sub }) => (
          <div key={label} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
            <div style={{ color, fontWeight: 'bold', letterSpacing: 2 }}>{label}</div>
            <div style={{ color: '#667788', fontSize: 10 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Credits */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ color: '#445566', fontSize: 11, letterSpacing: 2 }}>CREDITS</div>
        <div style={{ color: '#ffee00', fontSize: 20, fontWeight: 'bold', textShadow: '0 0 8px #ffcc00' }}>
          {credits.toString().padStart(5, '0')}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <button
          style={bigBtn('#00aaff')}
          onClick={() => setPhase('shop')}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#00aaff44'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#00aaff22'; e.currentTarget.style.color = '#00aaff' }}
        >
          Ausrüstung & Start
        </button>

        <button
          style={{ ...bigBtn('#00ff88'), fontSize: 13, padding: '11px 36px' }}
          onClick={() => setPhase('editor')}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#00ff8844'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#00ff8822'; e.currentTarget.style.color = '#00ff88' }}
        >
          Level Editor
        </button>

        <button
          style={{ ...bigBtn('#ff8800'), fontSize: 13, padding: '11px 36px' }}
          onClick={() => { setGameMode('skydive'); setPhase('skydive') }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#ff880044'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ff880022'; e.currentTarget.style.color = '#ff8800' }}
        >
          ↓ Skydive Infiltration
        </button>

        <button
          style={{ ...bigBtn('#aa44ff'), fontSize: 13, padding: '11px 36px' }}
          onClick={() => setPhase('lobby')}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#aa44ff44'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#aa44ff22'; e.currentTarget.style.color = '#aa44ff' }}
        >
          ⬡ Online Multiplayer
        </button>

        <button
          style={{
            background: 'transparent', border: '1px solid #334455', color: '#445566',
            fontSize: 12, letterSpacing: 4, padding: '9px 36px', cursor: 'pointer',
            fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.15s',
          }}
          onClick={() => { setGameMode('arena'); setPhase('playing') }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#aabbcc'; e.currentTarget.style.borderColor = '#667788' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#445566'; e.currentTarget.style.borderColor = '#334455' }}
        >
          Direkt spielen
        </button>
      </div>

      {/* Blood intensity setting */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ color: '#334455', fontSize: 10, letterSpacing: 3 }}>BLUTEFFEKT</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {([0, 1, 2, 3] as const).map((v) => (
            <button
              key={v}
              onClick={() => setBloodIntensity(v)}
              style={{
                background: bloodIntensity === v ? '#44000022' : 'transparent',
                border: `1px solid ${bloodIntensity === v ? '#cc2200' : '#221111'}`,
                color: bloodIntensity === v ? '#ff4422' : '#443333',
                fontSize: 10, letterSpacing: 2, padding: '5px 12px', cursor: 'pointer',
                fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.12s',
                boxShadow: bloodIntensity === v ? '0 0 8px #cc220055' : 'none',
              }}
            >
              {bloodLabels[v]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ color: '#334455', fontSize: 10, marginTop: 24, letterSpacing: 2 }}>
        WASD · MAUS · LMT · SHIFT = BULLET TIME · F = EGOPERSPEKTIVE
      </div>
    </div>
  )
}
