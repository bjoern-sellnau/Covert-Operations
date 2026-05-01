import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore, DIFFICULTY_LABELS, DIFFICULTY_MULTS } from '../store/settingsStore'
import type { Difficulty } from '../store/settingsStore'
import { useLoadoutStore } from '../game/loadoutStore'
import { previewTrack, stopMusic } from '../game/music'

type PreviewId = 'game1' | 'game2' | 'game3' | 'game4' | 'game5' | 'game6' | 'game7' | 'game8' | 'game9' | 'game10' | 'game11' | 'game12' | 'game13' | 'game14' | 'game15' | 'game16' | 'game17' | 'game18' | 'game19' | 'game20' | 'game21' | 'game22' | 'game23' | 'game24' | 'game25' | 'game26' | 'game27' | 'game28' | 'game29' | 'game30' | 'game31'

const tracks: Array<[PreviewId, string, string, string]> = [
  ['game1',  'TRACK 1',  '#00aaff', 'D-Moll 138 BPM'],
  ['game2',  'TRACK 2',  '#ff4444', 'F#-Moll 150 BPM Industrial'],
  ['game3',  'TRACK 3',  '#44ff88', 'C-Moll 105 BPM Suspense'],
  ['game4',  'TRACK 4',  '#cc44ff', 'H-Moll 175 BPM Techno'],
  ['game5',  'TRACK 5',  '#ff8800', 'E-Moll 120 BPM Action Rock'],
  ['game6',  'TRACK 6',  '#ff2244', 'E-Moll 180 BPM Heavy Metal'],
  ['game7',  'TRACK 7',  '#00ffee', 'A-Moll 138 BPM Trance'],
  ['game8',  'TRACK 8',  '#ffdd00', 'H-Moll 112 BPM Spy Jazz'],
  ['game9',  'TRACK 9',  '#aa00ff', 'D-Moll 174 BPM Drum & Bass'],
  ['game10', 'TRACK 10', '#ff66cc', 'A-Moll 100 BPM Synthwave'],
  ['game11', 'TRACK 11', '#33ddff', 'G-Moll 128 BPM Cyberpunk'],
  ['game12', 'TRACK 12', '#ff3300', 'A-Moll 150 BPM Hardstyle'],
  ['game13', 'TRACK 13', '#00ff99', 'C-Moll 140 BPM Dark Electro'],
  ['game14', 'TRACK 14', '#ff9900', 'E-Moll 132 BPM Breakbeat'],
  ['game15', 'TRACK 15', '#eeeeee', 'D-Moll 90 BPM Orchestral War'],
  ['game16', 'TRACK 16', '#bb00ff', 'D-Moll 170 BPM Neurofunk'],
  ['game17', 'TRACK 17', '#ff4400', 'H-Moll 160 BPM Industrial March'],
  ['game18', 'TRACK 18', '#88ccff', 'C-Dur 85 BPM Lo-Fi'],
  ['game19', 'TRACK 19', '#00eebb', 'A-Moll 148 BPM Psytrance'],
  ['game20', 'TRACK 20', '#cc99ff', 'F-Moll 135 BPM Minimal Techno'],
  ['game21', 'TRACK 21', '#ff0066', 'E-Moll 145 BPM Aggrotech'],
  ['game22', 'TRACK 22', '#ddaa00', 'D-Moll 95 BPM Epic Trailer'],
  ['game23', 'TRACK 23', '#ff3300', 'E-Moll 190 BPM Speed Metal'],
  ['game24', 'TRACK 24', '#ffdd44', 'C-Dur 120 BPM Electro Swing'],
  ['game25', 'TRACK 25', '#334466', 'H-Moll 75 BPM Ambient Dark'],
  ['game26', 'TRACK 26', '#00ff66', 'G-Moll 138 BPM Acid Techno'],
  ['game27', 'TRACK 27', '#9966ff', 'A-Moll 140 BPM Trap'],
  ['game28', 'TRACK 28', '#ff88cc', 'C-Moll 110 BPM Retrowave'],
  ['game29', 'TRACK 29', '#ff6600', 'D-Moll 165 BPM Jungle'],
  ['game30', 'TRACK 30', '#aaddff', 'E-Moll 125 BPM Hybrid Orchestral'],
  ['game31', 'TRACK 31', '#00ffcc', 'E-Moll 128 BPM Agent Techno'],
]

export function OptionsScreen() {
  const setPhase = useGameStore((s) => s.setPhase)
  const { bloodIntensity, setBloodIntensity, mobileControls, setMobileControls,
          musicEnabled, setMusicEnabled, musicTrack, setMusicTrack,
          difficulty, setDifficulty } = useSettingsStore()
  const { credits, setCredits } = useLoadoutStore()

  const [view, setView]           = useState<'main' | 'music'>('main')
  const [previewing, setPreviewing] = useState<string | null>(null)

  function handlePreview(val: PreviewId) {
    if (previewing === val) { stopMusic(); setPreviewing(null); return }
    setPreviewing(val)
    previewTrack(val, 8000)
    setTimeout(() => setPreviewing((p) => p === val ? null : p), 8000)
  }

  const bloodLabels = ['AUS', 'DEZENT', 'NORMAL', 'ÜBERTRIEBEN'] as const

  const wrap: React.CSSProperties = {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', overflowY: 'auto',
    background: 'radial-gradient(ellipse at center, #070720 0%, #020208 70%)',
    fontFamily: "'Courier New', monospace", userSelect: 'none',
  }
  const section: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 10,
    padding: '16px 20px', background: '#04050f',
    border: '1px solid #141e2a', borderRadius: 4, width: '100%',
  }
  const labelStyle: React.CSSProperties = {
    color: '#8899aa', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
  }
  const tog = (active: boolean, color: string): React.CSSProperties => ({
    background: active ? `${color}28` : 'transparent',
    border: `1px solid ${active ? color : '#1a2a35'}`,
    color: active ? color : '#667788',
    fontSize: 11, letterSpacing: 3, padding: '7px 18px', cursor: 'pointer',
    fontFamily: "'Courier New', monospace", textTransform: 'uppercase', transition: 'all 0.12s',
    boxShadow: active ? `0 0 10px ${color}44` : 'none',
  })
  const backBtn: React.CSSProperties = {
    background: 'transparent', border: '1px solid #1a2a35', color: '#7799aa',
    fontSize: 12, letterSpacing: 4, padding: '11px', cursor: 'pointer',
    fontFamily: "'Courier New', monospace", textTransform: 'uppercase', transition: 'all 0.12s',
  }

  const currentTrack = tracks.find(([id]) => id === musicTrack)
  const trackLabel   = musicTrack === 'auto' ? 'AUTO' : (currentTrack?.[1] ?? '—')
  const trackColor   = currentTrack?.[2] ?? '#ffaa00'

  // ── Music sub-screen ─────────────────────────────────────────────────────────
  if (view === 'music') {
    return (
      <div style={wrap}>
        <div style={{ color: '#00ccff', fontSize: 22, fontWeight: 'bold', letterSpacing: 6, marginTop: 24, marginBottom: 4, textShadow: '0 0 14px #00aaff88' }}>
          KAMPF-MUSIK
        </div>
        <div style={{ color: '#445566', fontSize: 10, letterSpacing: 4, marginBottom: 20 }}>TRACK AUSWÄHLEN</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 'min(92vw, 480px)', paddingBottom: 24 }}>
          {/* AUTO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={tog(musicTrack === 'auto', '#ffaa00')} onClick={() => setMusicTrack('auto')}>AUTO</button>
            <span style={{ color: '#667788', fontSize: 9, letterSpacing: 1 }}>Jeder Level hat seinen eigenen Track</span>
          </div>

          {/* Tracks */}
          {tracks.map(([val, lbl, col, desc]) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={tog(musicTrack === val, col)} onClick={() => setMusicTrack(val)}>{lbl}</button>
              <button
                onClick={() => handlePreview(val)}
                style={{
                  background: previewing === val ? `${col}33` : 'transparent',
                  border: `1px solid ${previewing === val ? col : '#223344'}`,
                  color: previewing === val ? col : '#556677',
                  fontSize: 10, letterSpacing: 1, padding: '6px 10px', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.12s', flexShrink: 0,
                  boxShadow: previewing === val ? `0 0 8px ${col}44` : 'none',
                }}
              >
                {previewing === val ? '■ STOP' : '▶ PREVIEW'}
              </button>
              <span style={{ color: '#556677', fontSize: 9, letterSpacing: 1 }}>{desc}</span>
            </div>
          ))}

          <button
            style={backBtn}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#cce4ff'; e.currentTarget.style.borderColor = '#334455' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#7799aa'; e.currentTarget.style.borderColor = '#1a2a35' }}
            onClick={() => { stopMusic(); setPreviewing(null); setView('main') }}
          >
            ← Zurück zu Optionen
          </button>
        </div>
      </div>
    )
  }

  // ── Main options screen ──────────────────────────────────────────────────────
  return (
    <div style={wrap}>
      <div style={{ color: '#00ccff', fontSize: 26, fontWeight: 'bold', letterSpacing: 6, marginBottom: 4, marginTop: 20, textShadow: '0 0 14px #00aaff88' }}>
        OPTIONEN
      </div>
      <div style={{ color: '#445566', fontSize: 10, letterSpacing: 4, marginBottom: 28 }}>
        COVERT OPERATIONS
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(92vw, 420px)', paddingBottom: 24 }}>

        {/* ── Difficulty ── */}
        <div style={section}>
          <div style={labelStyle}>Schwierigkeitsgrad</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => {
              const colors: Record<Difficulty, string> = {
                ultra_easy: '#00ff88', very_easy: '#44ee44', easy: '#aaee00',
                normal: '#ffee00', hard: '#ff8800', hardcore: '#ff4400', nightmare: '#ff0044',
              }
              return (
                <button key={d} style={tog(difficulty === d, colors[d])} onClick={() => setDifficulty(d)}>
                  {DIFFICULTY_LABELS[d]}
                </button>
              )
            })}
          </div>
          <div style={{ color: '#667788', fontSize: 9, letterSpacing: 1 }}>
            {`Gegner-HP ×${DIFFICULTY_MULTS[difficulty][0]} · Schaden ×${DIFFICULTY_MULTS[difficulty][1]} · Speed ×${DIFFICULTY_MULTS[difficulty][2]} · Spieler-HP ×${DIFFICULTY_MULTS[difficulty][3]}`}
          </div>
        </div>

        {/* ── Blood intensity ── */}
        <div style={section}>
          <div style={labelStyle}>Bluteffekt</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([0, 1, 2, 3] as const).map((v) => (
              <button key={v} style={tog(bloodIntensity === v, '#cc2200')} onClick={() => setBloodIntensity(v)}>
                {bloodLabels[v]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Music (compact) ── */}
        <div style={section}>
          <div style={labelStyle}>Musik</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <button style={tog(musicEnabled, '#ffaa00')} onClick={() => setMusicEnabled(true)}>Ein</button>
            <button style={tog(!musicEnabled, '#667788')} onClick={() => setMusicEnabled(false)}>Aus</button>
          </div>
          {musicEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: trackColor, fontSize: 11, letterSpacing: 2, fontWeight: 'bold' }}>
                {trackLabel}
              </span>
              <button
                style={{
                  background: 'transparent', border: '1px solid #223344', color: '#7799aa',
                  fontSize: 10, letterSpacing: 2, padding: '6px 14px', cursor: 'pointer',
                  fontFamily: "'Courier New', monospace", transition: 'all 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#00ccff'; e.currentTarget.style.borderColor = '#00aaff' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#7799aa'; e.currentTarget.style.borderColor = '#223344' }}
                onClick={() => setView('music')}
              >
                TRACKS AUSWÄHLEN →
              </button>
            </div>
          )}
        </div>

        {/* ── Mobile controls ── */}
        <div style={section}>
          <div style={labelStyle}>Mobile Steuerung (Touch)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={tog(mobileControls, '#00aaff')} onClick={() => setMobileControls(true)}>Ein</button>
            <button style={tog(!mobileControls, '#667788')} onClick={() => setMobileControls(false)}>Aus</button>
          </div>
          {mobileControls && (
            <div style={{ color: '#7799aa', fontSize: 10, letterSpacing: 1, lineHeight: 1.6 }}>
              Virtueller Joystick links · FIRE / GRN / DIVE / BT rechts<br />
              Automatisches Zielen auf nächsten Gegner
            </div>
          )}
        </div>

        {/* ── Credits (dev) ── */}
        <div style={section}>
          <div style={labelStyle}>Credits (Test-Modus)</div>
          <div style={{ color: '#ffee44', fontSize: 20, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 }}>
            {credits.toString().padStart(5, '0')} CR
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[500, 2000, 5000, 99999].map((v) => (
              <button key={v} style={tog(false, '#ffaa00')} onClick={() => setCredits(v)}>
                {v >= 1000 ? `${v / 1000}K` : v}
              </button>
            ))}
          </div>
          <div style={{ color: '#667788', fontSize: 10, letterSpacing: 1 }}>
            Betrag setzen um alle Waffen zu testen
          </div>
        </div>

        {/* ── Controls reference ── */}
        <div style={section}>
          <div style={labelStyle}>Tastatur-Steuerung</div>
          <div style={{ color: '#8899aa', fontSize: 10, letterSpacing: 1, lineHeight: 1.8 }}>
            WASD — Bewegen &nbsp;·&nbsp; Maus — Zielen &nbsp;·&nbsp; LMT — Schießen<br />
            G — Granate &nbsp;·&nbsp; Space — Dive &nbsp;·&nbsp; Shift — Bullet Time<br />
            1–5 — Waffe wechseln &nbsp;·&nbsp; R — Nachladen &nbsp;·&nbsp; V — Vernichter<br />
            L — Todeslaser &nbsp;·&nbsp; I — Ionen-Kanone &nbsp;·&nbsp; F — Ego-Perspektive<br />
            Q / E — Ballett-Spin (Akimbo)
          </div>
        </div>

        <button
          style={backBtn}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#cce4ff'; e.currentTarget.style.borderColor = '#334455' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#7799aa'; e.currentTarget.style.borderColor = '#1a2a35' }}
          onClick={() => setPhase('menu')}
        >
          ← Zurück
        </button>
      </div>
    </div>
  )
}
