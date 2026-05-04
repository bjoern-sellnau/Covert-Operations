import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { Particles } from './Particles'

interface Item {
  label: string
  sub?: string
  disabled?: boolean
  action?: () => void
}

export function SingleplayerMenu() {
  const setPhase = useGameStore((s) => s.setPhase)
  const [hovered, setHovered] = useState<string | null>(null)

  const items: Item[] = [
    { label: 'Story',     sub: 'BALD',      disabled: true },
    { label: 'Missionen', sub: 'SOLO',      action: () => setPhase('missions') },
    { label: 'Optionen',  sub: 'SETTINGS',  action: () => setPhase('options') },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
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

      {/* corner brackets */}
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

      {/* stamps */}
      <div style={stampStyle('left')}>CLASSIFIED</div>
      <div style={{ ...stampStyle('left'), top: 36, fontSize: 7, letterSpacing: '0.2em', color: 'rgba(106,112,72,0.35)' }}>© 2026 Loona! Designs</div>
      <div style={stampStyle('right')}>TOP SECRET // CO-Δ-0.1.0-ALPHA</div>

      {/* content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 0,
      }}>
        {/* wordmark */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
            fontSize: 13, letterSpacing: '0.3em', color: '#e05418',
          }}>Δ COVERT OPERATIONS</div>
        </div>

        {/* section title */}
        <div style={{
          fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
          fontSize: 'clamp(36px, 6vw, 56px)', letterSpacing: '0.18em',
          color: 'rgba(224,220,200,0.9)', marginBottom: 4,
          textShadow: '0 0 40px rgba(224,84,24,0.15)',
        }}>SINGLEPLAYER</div>

        {/* orange rule */}
        <div style={{ width: 320, height: 1, background: 'rgba(224,84,24,0.5)', marginBottom: 40 }} />

        {/* menu items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 320 }}>
          {items.map((item) => {
            const isHov = !item.disabled && hovered === item.label
            return (
              <div
                key={item.label}
                onMouseEnter={() => !item.disabled && setHovered(item.label)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => !item.disabled && item.action?.()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(138,154,98,0.1)',
                  cursor: item.disabled ? 'default' : 'pointer',
                  opacity: item.disabled ? 0.3 : 1,
                  transition: 'all 0.15s',
                  position: 'relative',
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
                  }}>{item.label}</span>
                </div>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 8, letterSpacing: '0.25em',
                  color: item.disabled ? 'rgba(224,84,24,0.7)' : 'rgba(106,112,72,0.6)',
                }}>{item.sub}</span>
                {/* underline */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
                  background: isHov ? 'rgba(224,84,24,0.4)' : 'transparent',
                  transition: 'background 0.15s',
                }} />
              </div>
            )
          })}
        </div>

        {/* back */}
        <button
          onClick={() => setPhase('title_screen')}
          style={{
            marginTop: 48, background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(106,112,72,0.6)', transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(224,84,24,0.8)' }}
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
