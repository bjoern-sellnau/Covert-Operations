import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useEditorStore } from '../editor/editorStore'
import { useMutatorsStore } from '../store/mutatorsStore'
import type { Level } from '../editor/editorStore'
import { playClick, playHover } from '../game/uiSounds'

export function MapSelectScreen() {
  const setPhase      = useGameStore((s) => s.setPhase)
  const skipShop      = useGameStore((s) => s.skipShop)
  const gameType      = useMutatorsStore((s) => s.gameType)
  const levels        = useEditorStore((s) => s.levels)
  const setActivePlayLevel = useEditorStore((s) => s.setActivePlayLevel)

  const available = levels.filter(
    (l) => l.gameModes.length === 0 || l.gameModes.includes(gameType)
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  function confirm() {
    playClick()
    if (selectedId === null) {
      setActivePlayLevel(null)
    } else {
      const lvl = available.find((l) => l.id === selectedId) ?? null
      setActivePlayLevel(lvl)
    }
    setPhase('briefing')
  }

  function selectCard(id: string | null) {
    playClick()
    setSelectedId(id)
  }

  const cardStyle = (_id: string | null, active: boolean, isHov: boolean): React.CSSProperties => ({
    cursor: 'pointer', borderRadius: 2, padding: '14px 16px',
    background: active ? 'rgba(224,84,24,0.1)' : isHov ? 'rgba(138,154,98,0.05)' : 'rgba(10,12,7,0.85)',
    border: `2px solid ${active ? '#e05418' : isHov ? 'rgba(138,154,98,0.3)' : 'rgba(138,154,98,0.14)'}`,
    boxShadow: active ? '0 0 16px rgba(224,84,24,0.35), inset 0 0 12px rgba(224,84,24,0.06)' : 'none',
    transition: 'all 0.15s',
    display: 'flex', flexDirection: 'column', gap: 5,
    userSelect: 'none',
  })

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      animation: 'menuFadeIn 0.35s cubic-bezier(0.2,0.8,0.3,1) both',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(138,154,98,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(138,154,98,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Top glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(224,84,24,0.8), transparent)',
        pointerEvents: 'none',
      }} />

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

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
          fontSize: 13, letterSpacing: '0.3em', color: '#e05418', marginBottom: 8,
        }}>Δ COVERT OPERATIONS</div>
        <div style={{
          fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
          fontSize: 'clamp(28px, 5vw, 44px)', letterSpacing: '0.18em',
          color: 'rgba(224,220,200,0.9)', textShadow: '0 0 40px rgba(224,84,24,0.15)',
        }}>KARTE AUSWÄHLEN</div>
        <div style={{ width: 300, height: 1, background: 'rgba(224,84,24,0.5)', margin: '12px auto 0' }} />
      </div>

      {/* Map grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 8,
        width: 'min(96vw, 820px)',
        maxHeight: '55vh',
        overflowY: 'auto',
        marginBottom: 20,
        paddingRight: 4,
      }}>
        {/* Default arena card */}
        <div
          onClick={() => selectCard(null)}
          onMouseEnter={() => { setHovered('__default__'); playHover() }}
          onMouseLeave={() => setHovered(null)}
          style={cardStyle(null, selectedId === null, hovered === '__default__')}
        >
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11, letterSpacing: '0.15em',
            color: selectedId === null ? '#e05418' : 'rgba(200,196,176,0.7)',
          }}>STANDARD-ARENA</div>
          <div style={{ fontSize: 10, color: 'rgba(138,154,98,0.45)', lineHeight: 1.4 }}>
            Leere Arena — kein Level geladen
          </div>
          {selectedId === null && (
            <div style={{
              fontSize: 9, letterSpacing: '0.25em', color: '#e05418',
              fontFamily: "'Share Tech Mono', monospace",
              textShadow: '0 0 8px #e05418',
            }}>▶ AKTIV</div>
          )}
        </div>

        {/* User-created levels */}
        {available.map((lvl: Level) => {
          const active = selectedId === lvl.id
          const isHov  = hovered === lvl.id
          const objCount = lvl.objects.length
          return (
            <div
              key={lvl.id}
              onClick={() => selectCard(lvl.id)}
              onMouseEnter={() => { setHovered(lvl.id); playHover() }}
              onMouseLeave={() => setHovered(null)}
              style={cardStyle(lvl.id, active, isHov)}
            >
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11, letterSpacing: '0.15em',
                color: active ? '#e05418' : isHov ? 'rgba(224,220,200,0.9)' : 'rgba(200,196,176,0.7)',
                transition: 'color 0.15s',
              }}>{lvl.name.toUpperCase()}</div>
              <div style={{ fontSize: 10, color: 'rgba(138,154,98,0.45)', lineHeight: 1.4 }}>
                {objCount} Objekte
                {lvl.fogOfWar ? ' · Nebel' : ''}
                {lvl.gameModes.length > 0 ? ` · ${lvl.gameModes.length} Modi` : ' · Alle Modi'}
              </div>
              {active && (
                <div style={{
                  fontSize: 9, letterSpacing: '0.25em', color: '#e05418',
                  fontFamily: "'Share Tech Mono', monospace",
                  textShadow: '0 0 8px #e05418',
                }}>▶ AKTIV</div>
              )}
            </div>
          )
        })}

        {/* Empty state */}
        {available.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center', padding: '32px 0',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10, letterSpacing: '0.2em', color: 'rgba(106,112,72,0.4)',
          }}>
            KEINE LEVEL FÜR DIESEN MODUS — Standard-Arena wird verwendet
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', gap: 10, width: 'min(96vw, 820px)',
        paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
      }}>
        <button
          onClick={() => { playClick(); setPhase(skipShop ? 'mutators' : 'shop') }}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.3em',
            color: 'rgba(106,112,72,0.6)', textTransform: 'uppercase', transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { playHover(); e.currentTarget.style.color = 'rgba(224,84,24,0.8)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(106,112,72,0.6)' }}
        >← ZURÜCK</button>
        <button
          onClick={confirm}
          style={{
            flex: 1, background: 'rgba(224,84,24,0.08)', border: '1px solid rgba(224,84,24,0.5)',
            color: '#e05418', fontSize: 11, letterSpacing: '0.3em', padding: '13px', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { playHover(); e.currentTarget.style.background = 'rgba(224,84,24,0.18)'; e.currentTarget.style.color = '#f4f0e4' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(224,84,24,0.08)'; e.currentTarget.style.color = '#e05418' }}
        >BRIEFING →</button>
      </div>
    </div>
  )
}
