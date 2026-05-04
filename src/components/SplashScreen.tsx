import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'

interface Card { label?: string; title: string; sub?: string; useDelta?: boolean; isLoader?: boolean }

const CARDS: Card[] = [
  { isLoader: true,                                 title: 'Loading Mission Data' },
  { label: 'Coded by',                              title: 'Claude Code' },
  { label: 'Published by',                          title: 'Loona! Designs', useDelta: true },
  { label: 'Based on the Flash Games by Loona! Designs', title: '"Covert Operations"', sub: '& "Covert Operations Tournament"' },
]

const FADE_MS   = 500
const HOLD_MS   = 1700
const LOADER_MS = 2200  // loader bar fill duration

let splashShown = false

export function SplashScreen() {
  const setPhase           = useGameStore((s) => s.setPhase)
  const [cardIdx, setCard] = useState(0)
  const [visible, setVis]  = useState(false)
  const [dots, setDots]    = useState('')

  const skip = splashShown
    || new URLSearchParams(window.location.search).get('skipSplash') === '1'
    || new URLSearchParams(window.location.search).get('skipIntro')  === '1'

  function done() { setPhase('title_screen') }

  useEffect(() => {
    if (skip) { done(); return }
    splashShown = true
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

    let t = 300
    CARDS.forEach((card, i) => {
      const hold = card.isLoader ? LOADER_MS : HOLD_MS
      at(t,              () => setVis(true))
      at(t + hold,       () => setVis(false))
      at(t + hold + FADE_MS, () => {
        if (i + 1 < CARDS.length) { setCard(i + 1); setVis(false) }
        else done()
      })
      t += hold + FADE_MS + 150
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  // Animated dots for loader
  useEffect(() => {
    if (!CARDS[cardIdx]?.isLoader) return
    let n = 0
    const id = setInterval(() => { n = (n + 1) % 4; setDots('.'.repeat(n)) }, 380)
    return () => clearInterval(id)
  }, [cardIdx])

  if (skip) return null
  const card = CARDS[cardIdx]

  return (
    <div
      onClick={done}
      style={{
        position: 'absolute', inset: 0,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
        userSelect: 'none', cursor: 'default',
      }}
    >
      {card.isLoader ? (
        /* ── Loader card ── */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
          width: 'min(90vw, 420px)',
        }}>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase',
            color: 'rgba(138,154,98,0.7)',
          }}>
            {card.title}{dots}
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%', height: 2,
            background: 'rgba(138,154,98,0.12)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              background: 'linear-gradient(90deg, rgba(224,84,24,0.6), #e05418)',
              width: visible ? '100%' : '0%',
              transition: `width ${LOADER_MS - 100}ms cubic-bezier(0.1, 0.6, 0.4, 1)`,
              boxShadow: '0 0 8px rgba(224,84,24,0.6)',
            }} />
          </div>

          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 7, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(80,80,80,0.5)',
          }}>
            CO-Δ v0.1.0-ALPHA
          </div>
        </div>
      ) : (
        /* ── Publisher logo card ── */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '36px 56px',
          border: '1px solid rgba(138,154,98,0.22)',
          gap: 12, minWidth: 320,
        }}>
          {card.label && (
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase',
              color: 'rgba(138,154,98,0.45)',
            }}>
              {card.label}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {card.useDelta && (
              <span style={{
                fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
                fontSize: 'clamp(28px, 4vw, 40px)',
                color: '#e05418',
                textShadow: '0 0 20px rgba(224,84,24,0.5)',
              }}>Δ</span>
            )}
            <div style={{
              fontFamily: "'Saira Condensed', sans-serif", fontWeight: 800,
              fontSize: 'clamp(20px, 3.5vw, 32px)',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#e0dcc8',
              textShadow: '0 0 30px rgba(224,220,200,0.1)',
            }}>
              {card.title}
            </div>
          </div>

          {card.sub && (
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(138,154,98,0.45)',
            }}>
              {card.sub}
            </div>
          )}
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 28,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 7, letterSpacing: '0.3em',
        color: 'rgba(50,50,50,0.6)', textTransform: 'uppercase',
      }}>
        Klicken zum Überspringen
      </div>
    </div>
  )
}
