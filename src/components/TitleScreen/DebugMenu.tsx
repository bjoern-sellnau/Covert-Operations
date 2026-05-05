import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useSettingsStore } from '../../store/settingsStore'
import { Particles } from './Particles'
import { playHover, playClick } from '../../game/uiSounds'

export function DebugMenu() {
  const setPhase          = useGameStore((s) => s.setPhase)
  const showBoundingBoxes = useSettingsStore((s) => s.showBoundingBoxes)
  const setShowBoundingBoxes = useSettingsStore((s) => s.setShowBoundingBoxes)
  const resetSettings     = useSettingsStore((s) => s.resetSettings)
  const [hovered, setHovered] = useState<string | null>(null)
  const [resetDone, setResetDone]     = useState(false)
  const [cleanupCount, setCleanupCount] = useState<number | null>(null)

  function handleCleanup() {
    playClick()
    const current = new Set(['covert-ops-editor-v1', 'covert-ops-loadout-v2', 'covert-ops-settings-v2', 'covert-ops-mutators-v3'])
    const stale: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('covert-ops-') && !current.has(k)) stale.push(k)
    }
    stale.forEach(k => localStorage.removeItem(k))
    setCleanupCount(stale.length)
    setTimeout(() => setCleanupCount(null), 2000)
  }

  function handleReset() {
    playClick()
    resetSettings()
    setResetDone(true)
    setTimeout(() => setResetDone(false), 1500)
  }

  type RowConfig = { label: string; sub: string; action: () => void; toggle?: boolean; toggleOn?: boolean }
  const rows: RowConfig[] = [
    {
      label: 'Bounding Boxes',
      sub: showBoundingBoxes ? 'EIN' : 'AUS',
      action: () => { playClick(); setShowBoundingBoxes(!showBoundingBoxes) },
      toggle: true, toggleOn: showBoundingBoxes,
    },
    {
      label: 'Cleanup Settings',
      sub: cleanupCount !== null ? `${cleanupCount} REMOVED` : 'STALE DATA',
      action: handleCleanup,
    },
    {
      label: 'Settings zurücksetzen',
      sub: resetDone ? 'DONE ✓' : 'RESET',
      action: handleReset,
    },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', animation: 'menuFadeIn 0.35s cubic-bezier(0.2,0.8,0.3,1) both' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(224,84,24,0.8), transparent)',
      }} />
      <Particles />

      {([['top','left'],['top','right'],['bottom','left'],['bottom','right']] as const).map(([v,h]) => (
        <div key={v+h} style={{
          position: 'absolute',
          [v]: 20, [h]: 24,
          width: 28, height: 28,
          [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]: '1.5px solid #8a9a62',
          [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]: '1.5px solid #8a9a62',
          opacity: 0.5, pointerEvents: 'none',
        }} />
      ))}

      <div style={stampStyle('left')}>CLASSIFIED</div>
      <div style={{ ...stampStyle('left'), top: 36, fontSize: 7, letterSpacing: '0.2em', color: 'rgba(106,112,72,0.35)' }}>© 2026 Loona! Designs</div>
      <div style={stampStyle('right')}>TOP SECRET // CO-Δ-0.1.0-ALPHA</div>

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
            fontSize: 13, letterSpacing: '0.3em', color: '#e05418',
          }}>Δ COVERT OPERATIONS</div>
        </div>

        <div style={{
          fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
          fontSize: 'clamp(36px, 6vw, 56px)', letterSpacing: '0.18em',
          color: 'rgba(224,220,200,0.9)', marginBottom: 4,
          textShadow: '0 0 40px rgba(224,84,24,0.15)',
        }}>DEBUG</div>

        <div style={{ width: 320, height: 1, background: 'rgba(224,84,24,0.5)', marginBottom: 40 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 320 }}>
          {rows.map((row) => {
            const isHov = hovered === row.label
            return (
              <div
                key={row.label}
                onMouseEnter={() => { setHovered(row.label); playHover() }}
                onMouseLeave={() => setHovered(null)}
                onClick={row.action}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(138,154,98,0.1)',
                  cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
                    fontSize: 11, color: '#e05418',
                    opacity: isHov ? 1 : 0,
                    transform: isHov ? 'translateX(0)' : 'translateX(-6px)',
                    transition: 'opacity 0.15s, transform 0.15s',
                    width: 12, display: 'inline-block',
                  }}>Δ</span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                    fontSize: 14, letterSpacing: isHov ? '0.22em' : '0.16em',
                    textTransform: 'uppercase',
                    color: isHov ? '#f4f0e4' : 'rgba(220,216,200,0.8)',
                    transition: 'color 0.15s, letter-spacing 0.15s',
                  }}>{row.label}</span>
                </div>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 8, letterSpacing: '0.25em',
                  color: row.toggleOn ? '#e05418' : 'rgba(106,112,72,0.6)',
                  transition: 'color 0.15s',
                }}>{row.sub}</span>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
                  background: isHov ? 'rgba(224,84,24,0.4)' : 'transparent',
                  transition: 'background 0.15s',
                }} />
              </div>
            )
          })}
        </div>

        <button
          onClick={() => { playClick(); setPhase('title_screen') }}
          style={{
            marginTop: 48, background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(106,112,72,0.6)', transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { playHover(); (e.currentTarget as HTMLButtonElement).style.color = 'rgba(224,84,24,0.8)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(106,112,72,0.6)' }}
        >← ZURÜCK</button>
      </div>

    </div>
  )
}

const stampStyle = (side: 'left' | 'right'): React.CSSProperties => ({
  position: 'absolute', top: 22, [side]: 64,
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
  color: 'rgba(106,112,72,0.5)', pointerEvents: 'none',
})
