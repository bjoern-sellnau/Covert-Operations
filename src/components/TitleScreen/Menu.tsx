import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { playHover, playClick } from '../../game/uiSounds'

const ITEMS = [
  { label: 'Singleplayer', testId: 'menu-singleplayer', phase: 'singleplayer_menu' as const },
  { label: 'Multiplayer',  testId: 'menu-multiplayer',  phase: 'multiplayer_menu'  as const },
  { label: 'Level Editor', testId: 'menu-level-editor', phase: 'editor'            as const },
  { label: 'Track Player', testId: 'menu-track-player', phase: 'options'           as const },
  { label: 'Demos',        testId: 'menu-demos',        phase: 'demo_viewer'       as const },
  { label: 'Debug',        testId: 'menu-debug',        phase: 'debug_menu' as const },
]

type Child = { type: 'item'; label: string; testId: string; phase: string | null } | { type: 'div' }
const CHILDREN: Child[] = ITEMS.reduce<Child[]>((acc, item, i) => {
  acc.push({ type: 'item', ...item })
  if (i < ITEMS.length - 1) acc.push({ type: 'div' })
  return acc
}, [])

interface MenuProps { skipIntro: boolean }

export function Menu({ skipIntro }: MenuProps) {
  const setPhase = useGameStore((s) => s.setPhase)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{
      position: 'absolute',
      bottom: '18%',
      left: '50%',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 0,
      transform: skipIntro ? 'translate(-50%, -50%)' : undefined,
      opacity: 0,
      animation: skipIntro
        ? 'tsFadeIn 0.35s ease both'
        : 'tsFadeUp 1.4s 4.3s cubic-bezier(0.2,0.8,0.3,1) both',
    }}>
      {CHILDREN.map((child, i) => {
        const delay = `${4.3 + i * 0.1}s`

        if (child.type === 'div') {
          return (
            <div key={i} style={{
              width: 1, height: 18,
              background: 'rgba(224,84,24,0.3)',
              opacity: 0,
              animation: skipIntro ? 'tsFadeIn 0.35s ease both' : `tsFadeIn 0.4s ${delay} forwards`,
              flexShrink: 0,
            }} />
          )
        }

        const isHovered = hovered === child.label
        return (
          <div
            key={child.label}
            data-testid={child.testId}
            role="button"
            tabIndex={0}
            onMouseEnter={() => { setHovered(child.label); playHover() }}
            onMouseLeave={() => setHovered(null)}
            onClick={() => { if (child.phase) { playClick(); setPhase(child.phase as Parameters<typeof setPhase>[0]) } }}
            onKeyDown={(e) => { if (e.key === 'Enter' && child.phase) { playClick(); setPhase(child.phase as Parameters<typeof setPhase>[0]) } }}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 12,
              letterSpacing: isHovered ? '0.22em' : '0.18em',
              color: isHovered ? '#e8e4d4' : 'rgba(220,216,200,0.75)',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '10px 16px',
              position: 'relative',
              transition: 'color 0.2s, letter-spacing 0.2s',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              opacity: 0,
              animation: skipIntro ? 'tsFadeIn 0.35s ease both' : `tsFadeIn 0.4s ${delay} forwards`,
            }}
          >
            <span style={{
              position: 'absolute',
              left: '50%',
              top: -8,
              transform: isHovered ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-2px)',
              fontFamily: "'Saira Condensed', sans-serif",
              fontWeight: 900,
              fontSize: 11,
              color: '#e05418',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s, transform 0.2s',
              pointerEvents: 'none',
            }}>Δ</span>

            {child.label}

            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              bottom: 6, height: 1,
              background: isHovered ? 'rgba(224,84,24,0.6)' : 'rgba(224,84,24,0)',
              transition: 'background 0.2s',
              pointerEvents: 'none',
            }} />
          </div>
        )
      })}
    </div>
  )
}
