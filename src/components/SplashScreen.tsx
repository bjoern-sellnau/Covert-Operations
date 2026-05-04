import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { getCtx } from '../game/audioCore'

interface Card { label?: string; title: string; sub?: string; useDelta?: boolean; isLoader?: boolean }

const CARDS: Card[] = [
  { isLoader: true,                                 title: 'Loading Mission Data' },
  { label: 'Coded by',                              title: 'Claude Code' },
  { label: 'Idea by',                               title: 'Loona! Designs', useDelta: true },
  { label: 'Based on the Flash Games by Loona! Designs', title: '"Covert Operations"', sub: '& "Covert Operations Tournament"' },
]

const FADE_MS   = 400
const HOLD_MS   = 2500
const LOADER_MS = 2400

let splashShown = false

export function SplashScreen() {
  const setPhase            = useGameStore((s) => s.setPhase)
  const [cardIdx, setCard]  = useState(0)
  const [visible, setVis]   = useState(false)
  const [dots, setDots]     = useState('')
  const [showInitBtn, setShowInitBtn] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const [skip] = useState(() =>
    splashShown
    || new URLSearchParams(window.location.search).get('skipSplash') === '1'
    || new URLSearchParams(window.location.search).get('skipIntro')  === '1'
  )

  function done() { setPhase('title_screen') }

  function handleInit() {
    getCtx().resume().catch(() => {})
    setShowInitBtn(false)
    setVis(false)

    const at = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms)
      timersRef.current.push(id)
    }

    let t = FADE_MS + 150
    CARDS.slice(1).forEach((_, i) => {
      const idx = i + 1
      at(t, () => { setCard(idx); setVis(true) })
      at(t + HOLD_MS, () => setVis(false))
      at(t + HOLD_MS + FADE_MS, () => {
        if (idx + 1 < CARDS.length) setCard(idx + 1)
        else done()
      })
      t += HOLD_MS + FADE_MS + 150
    })
  }

  useEffect(() => {
    if (skip) { done(); return }
    if (splashShown) return
    splashShown = true

    const id1 = setTimeout(() => setVis(true), 300)
    const id2 = setTimeout(() => setShowInitBtn(true), 300 + LOADER_MS)
    timersRef.current = [id1, id2]

    return () => timersRef.current.forEach(clearTimeout)
  }, [])

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
      onClick={!card.isLoader ? done : undefined}
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

          {showInitBtn && (
            <button
              onClick={(e) => { e.stopPropagation(); handleInit() }}
              style={{
                marginTop: 8,
                padding: '10px 32px',
                background: 'transparent',
                border: '1px solid rgba(224,84,24,0.5)',
                cursor: 'pointer',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase',
                color: '#e05418',
                transition: 'background 0.2s, border-color 0.2s',
                animation: 'tsFadeIn 0.5s ease both',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = 'rgba(224,84,24,0.12)'
                el.style.borderColor = 'rgba(224,84,24,0.9)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = 'transparent'
                el.style.borderColor = 'rgba(224,84,24,0.5)'
              }}
            >
              INITIALIZE SYSTEM
            </button>
          )}
        </div>
      ) : (
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

      {!showInitBtn && (
        <div style={{
          position: 'absolute', bottom: 28,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 7, letterSpacing: '0.3em',
          color: 'rgba(50,50,50,0.6)', textTransform: 'uppercase',
        }}>
          {card.isLoader ? '' : 'Klicken zum Überspringen'}
        </div>
      )}
    </div>
  )
}
