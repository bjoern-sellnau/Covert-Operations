import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'

interface Card { lines: string[]; emphasis: number }

const CARDS: Card[] = [
  { lines: ['Coded by', 'Claude Code'],                                      emphasis: 1 },
  { lines: ['Loona! Designs'],                                               emphasis: 0 },
  { lines: ['Based on the Flash Games', '"Covert Operations"', '& "Covert Operations Tournament"', 'by Loona! Designs'], emphasis: 1 },
]

const FADE_MS = 500
const HOLD_MS = 1600

let splashShown = false

export function SplashScreen() {
  const setPhase           = useGameStore((s) => s.setPhase)
  const [cardIdx, setCard] = useState(0)
  const [visible, setVis]  = useState(false)

  const skip = splashShown
    || new URLSearchParams(window.location.search).get('skipSplash') === '1'
    || new URLSearchParams(window.location.search).get('skipIntro')  === '1'

  function done() { setPhase('title_screen') }

  useEffect(() => {
    if (skip) { done(); return }
    splashShown = true

    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

    let t = 200
    CARDS.forEach((_, i) => {
      at(t,                    () => setVis(true))
      at(t + HOLD_MS,          () => setVis(false))
      at(t + HOLD_MS + FADE_MS, () => {
        if (i + 1 < CARDS.length) { setCard(i + 1); setVis(false) }
        else done()
      })
      t += HOLD_MS + FADE_MS + 120
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  if (skip) return null

  const card = CARDS[cardIdx]

  return (
    <div
      onClick={done}
      style={{
        position: 'absolute', inset: 0,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
        fontFamily: "'Share Tech Mono', monospace",
        userSelect: 'none', cursor: 'default',
      }}
    >
      {card.lines.map((line, i) => (
        <div key={i} style={{
          color: i === card.emphasis ? '#e0dcc8' : 'rgba(138,154,98,0.55)',
          fontSize: i === card.emphasis ? 'clamp(16px, 3vw, 26px)' : 11,
          letterSpacing: i === card.emphasis ? '0.45em' : '0.3em',
          textTransform: 'uppercase',
          marginBottom: i < card.lines.length - 1 ? 10 : 0,
          textShadow: i === card.emphasis ? '0 0 24px rgba(224,220,200,0.18)' : 'none',
        }}>
          {line}
        </div>
      ))}

      <div style={{
        position: 'absolute', bottom: 32,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 8, letterSpacing: '0.3em',
        color: 'rgba(80,80,80,0.5)', textTransform: 'uppercase',
      }}>
        Klicken zum Überspringen
      </div>
    </div>
  )
}
