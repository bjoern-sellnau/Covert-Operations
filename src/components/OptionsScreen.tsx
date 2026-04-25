import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'

export function OptionsScreen() {
  const setPhase            = useGameStore((s) => s.setPhase)
  const { bloodIntensity, setBloodIntensity, mobileControls, setMobileControls,
          musicEnabled, setMusicEnabled } = useSettingsStore()

  const bloodLabels = ['AUS', 'DEZENT', 'NORMAL', 'ÜBERTRIEBEN'] as const

  const section: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 10,
    padding: '20px 24px', background: '#06061400',
    border: '1px solid #0d1a22', borderRadius: 4, width: '100%',
  }
  const label: React.CSSProperties = {
    color: '#556677', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
  }
  const tog = (active: boolean, color: string): React.CSSProperties => ({
    background: active ? `${color}28` : 'transparent',
    border: `1px solid ${active ? color : '#1a2a35'}`,
    color: active ? color : '#334455',
    fontSize: 11, letterSpacing: 3, padding: '7px 18px', cursor: 'pointer',
    fontFamily: "'Courier New', monospace", textTransform: 'uppercase', transition: 'all 0.12s',
    boxShadow: active ? `0 0 10px ${color}44` : 'none',
  })

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #07071e 0%, #000006 70%)',
      fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      <div style={{ color: '#00aaff', fontSize: 28, fontWeight: 'bold', letterSpacing: 6, marginBottom: 6, textShadow: '0 0 14px #00aaff88' }}>
        OPTIONEN
      </div>
      <div style={{ color: '#223344', fontSize: 10, letterSpacing: 4, marginBottom: 32 }}>
        COVERT OPERATIONS
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 'min(92vw, 400px)' }}>

        {/* ── Blood intensity ── */}
        <div style={section}>
          <div style={label}>Bluteffekt</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([0, 1, 2, 3] as const).map((v) => (
              <button key={v} style={tog(bloodIntensity === v, '#cc2200')} onClick={() => setBloodIntensity(v)}>
                {bloodLabels[v]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Music ── */}
        <div style={section}>
          <div style={label}>Musik</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={tog(musicEnabled, '#ffaa00')} onClick={() => setMusicEnabled(true)}>Ein</button>
            <button style={tog(!musicEnabled, '#445566')} onClick={() => setMusicEnabled(false)}>Aus</button>
          </div>
        </div>

        {/* ── Mobile controls ── */}
        <div style={section}>
          <div style={label}>Mobile Steuerung (Touch)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={tog(mobileControls, '#00aaff')} onClick={() => setMobileControls(true)}>
              Ein
            </button>
            <button style={tog(!mobileControls, '#445566')} onClick={() => setMobileControls(false)}>
              Aus
            </button>
          </div>
          {mobileControls && (
            <div style={{ color: '#334455', fontSize: 10, letterSpacing: 1, lineHeight: 1.6 }}>
              Virtueller Joystick links · FIRE / GRN / DIVE / BT rechts<br />
              Automatisches Zielen auf nächsten Gegner
            </div>
          )}
        </div>

        {/* ── Controls reference ── */}
        <div style={section}>
          <div style={label}>Tastatur-Steuerung</div>
          <div style={{ color: '#334455', fontSize: 10, letterSpacing: 1, lineHeight: 1.8 }}>
            WASD — Bewegen &nbsp;·&nbsp; Maus — Zielen &nbsp;·&nbsp; LMT — Schießen<br />
            G — Granate &nbsp;·&nbsp; Space — Dive &nbsp;·&nbsp; Shift — Bullet Time<br />
            R — Vernichter &nbsp;·&nbsp; F — Ego-Perspektive<br />
            Q / E — Ballett-Spin (Akimbo) &nbsp;·&nbsp; T — Chat (Online)
          </div>
        </div>

        <button
          style={{
            background: 'transparent', border: '1px solid #1a2a35', color: '#445566',
            fontSize: 12, letterSpacing: 4, padding: '11px', cursor: 'pointer',
            fontFamily: "'Courier New', monospace", textTransform: 'uppercase', transition: 'all 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#aabbcc'; e.currentTarget.style.borderColor = '#334455' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#445566'; e.currentTarget.style.borderColor = '#1a2a35' }}
          onClick={() => setPhase('menu')}
        >
          ← Zurück
        </button>
      </div>
    </div>
  )
}
