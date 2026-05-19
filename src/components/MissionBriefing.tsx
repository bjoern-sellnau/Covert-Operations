import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'

type Card = { title: string; body: string[] }

const ARENA_CARDS: Card[] = [
  {
    title: 'MISSION',
    body: [
      'Überlebe endlose Angriffswellen feindlicher Agenten.',
      'Jede Wave wird stärker — eliminiere alle Gegner um weiterzukommen.',
      'Credits für getötete Feinde → im Shop in bessere Ausrüstung investieren.',
    ],
  },
  {
    title: 'BEWEGEN & ZIELEN',
    body: [
      'WASD — Bewegen',
      'Maus — Zielen',
      'Linke Maustaste — Schießen',
      'Mobile: Joystick links, FIRE-Button rechts',
    ],
  },
  {
    title: 'SPECIAL MOVES',
    body: [
      '1-5 — Waffe wechseln · R — Nachladen',
      'SHIFT — Bullet Time · LEERTASTE — Dive-Roll',
      'Slot 7 — Granate · G — Gun Kata (Mutator) · V — Vernichter',
      'F — Ego-Perspektive umschalten',
    ],
  },
  {
    title: 'ÜBERLEBENSSTRATEGIE',
    body: [
      'Rote Gegner = Standard · Orange = Schnell · Lila = Tank',
      'Granaten für Gruppen — Bullet Time für harte 1v1',
      'Dive-Roll aus Ecken befreien',
      'Munition geht zur Neige → verwalte dein Feuer',
    ],
  },
]

const SKYDIVE_CARDS: Card[] = [
  {
    title: 'MISSION',
    body: [
      'Springe aus 8.000 Metern Höhe über dem Zielobjekt.',
      'Steuere deinen freien Fall in die Zielzone.',
      'Deploye den Fallschirm rechtzeitig — zu spät = Aufprall.',
    ],
  },
  {
    title: 'STEUERUNG',
    body: [
      'WASD / Joystick — Körper im freien Fall neigen',
      'LEERTASTE / DIVE-Button — Fallschirm öffnen',
      'Mobile: Joystick zum Steuern, DIVE zum Öffnen',
    ],
  },
  {
    title: 'TIPPS',
    body: [
      'Je mehr Geschwindigkeit beim Öffnen, desto weiter driftest du',
      'Zielzone ist markiert — treffe die Mitte für maximale Punkte',
      'Öffne zu früh = du driftest ab · zu spät = Aufprall',
    ],
  },
  { title: 'FPV-KAMERA', body: [] }, // special card — rendered as toggle
]

const RANGE_CARDS: Card[] = [
  {
    title: 'SCHIEßSTAND',
    body: [
      'Trainiere deine Waffen ohne Risiko.',
      'Unbegrenzte Munition — keine Lebenspunkte-Strafe.',
      'Ziele tauchen in Wellen auf — teste Feuerkraft und Präzision.',
    ],
  },
  {
    title: 'STEUERUNG',
    body: [
      'WASD — Bewegen',
      'Maus / Joystick — Zielen',
      'Linke Maustaste / FIRE — Schießen',
      'ESC / zurück zum Menü jederzeit möglich',
    ],
  },
]

export function MissionBriefing() {
  const setPhase            = useGameStore((s) => s.setPhase)
  const gameMode            = useGameStore((s) => s.gameMode)
  const offlinePath         = useGameStore((s) => s.offlinePath)
  const skipShop            = useGameStore((s) => s.skipShop)
  const briefingReturnTo    = useGameStore((s) => s.briefingReturnTo)
  const { skyFPV, setSkyFPV } = useSettingsStore()
  const [page, setPage] = useState(0)

  const cards = gameMode === 'skydive' ? SKYDIVE_CARDS
    : gameMode === 'shooting_range'    ? RANGE_CARDS
    : ARENA_CARDS

  const card = cards[page]
  const isLast = page === cards.length - 1

  function launch() {
    if (offlinePath && !skipShop) {
      setPhase('shop')
    } else if (offlinePath) {
      setPhase('playing')
    } else if (gameMode === 'skydive') {
      setPhase('skydive')
    } else if (gameMode === 'shooting_range') {
      setPhase('shop')
    } else {
      setPhase('mutators')
    }
  }

  const accentColor = gameMode === 'skydive' ? '#ff8800'
    : gameMode === 'shooting_range'           ? '#00ff88'
    : '#e05418'

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{ color: accentColor, fontSize: 11, letterSpacing: 5, marginBottom: 6, opacity: 0.7 }}>
        MISSION BRIEFING
      </div>
      <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginBottom: 36 }}>
        {page + 1} / {cards.length}
      </div>

      {/* Card */}
      <div style={{
        width: 'min(92vw, 420px)',
        background: `${accentColor}08`,
        border: `1px solid ${accentColor}44`,
        borderRadius: 8,
        padding: '28px 26px',
        minHeight: 220,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ color: accentColor, fontSize: 16, fontWeight: 'bold', letterSpacing: 4, textShadow: `0 0 10px ${accentColor}66` }}>
          {card.title}
        </div>

        {/* FPV special card */}
        {card.title === 'FPV-KAMERA' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ color: 'rgba(200,196,176,0.6)', fontSize: 12, letterSpacing: 1, lineHeight: 1.6 }}>
              Erlebe den freien Fall aus der Ego-Perspektive.<br />
              Die Kamera sitzt direkt am Helm — vollständiges Eintauchen.
            </div>
            <div
              onClick={() => setSkyFPV(!skyFPV)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                padding: '14px 18px',
                background: skyFPV ? `${accentColor}22` : 'rgba(10,12,7,0.85)',
                border: `1px solid ${skyFPV ? accentColor : 'rgba(138,154,98,0.18)'}`,
                borderRadius: 6, transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 42, height: 24, borderRadius: 12,
                background: skyFPV ? accentColor : 'rgba(138,154,98,0.18)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: skyFPV ? 21 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
              <div>
                <div style={{ color: skyFPV ? accentColor : 'rgba(138,154,98,0.45)', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 }}>
                  FPV-MODUS {skyFPV ? 'EIN' : 'AUS'}
                </div>
                <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, marginTop: 2 }}>
                  {skyFPV ? 'Ego-Perspektive aktiviert' : 'Top-Down Perspektive'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {card.body.map((line, i) => (
              <div key={i} style={{ color: 'rgba(200,196,176,0.6)', fontSize: 12, letterSpacing: 1, lineHeight: 1.5, display: 'flex', gap: 8 }}>
                <span style={{ color: accentColor, opacity: 0.6 }}>›</span>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation dots */}
      <div style={{ display: 'flex', gap: 8, margin: '24px 0 20px' }}>
        {cards.map((_, i) => (
          <div
            key={i}
            onClick={() => setPage(i)}
            style={{
              width: i === page ? 20 : 8, height: 8, borderRadius: 4,
              background: i === page ? accentColor : 'rgba(138,154,98,0.18)',
              transition: 'all 0.2s', cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, width: 'min(92vw, 420px)' }}>
        {page > 0 && (
          <button
            onClick={() => setPage(page - 1)}
            style={{
              flex: 1, background: 'transparent', border: '1px solid rgba(138,154,98,0.18)', color: 'rgba(138,154,98,0.4)',
              fontSize: 12, letterSpacing: 3, padding: '12px', cursor: 'pointer',
              fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.12s',
            }}
          >
            ← Zurück
          </button>
        )}

        {!isLast ? (
          <button
            onClick={() => setPage(page + 1)}
            style={{
              flex: 1, background: `${accentColor}22`, border: `1px solid ${accentColor}`,
              color: accentColor, fontSize: 12, letterSpacing: 3, padding: '12px', cursor: 'pointer',
              fontFamily: 'inherit', textTransform: 'uppercase', fontWeight: 'bold',
              boxShadow: `0 0 12px ${accentColor}33`, transition: 'all 0.12s',
            }}
          >
            Weiter →
          </button>
        ) : (
          <button
            onClick={launch}
            style={{
              flex: 1, background: `${accentColor}33`, border: `2px solid ${accentColor}`,
              color: accentColor, fontSize: 14, letterSpacing: 4, padding: '14px', cursor: 'pointer',
              fontFamily: 'inherit', textTransform: 'uppercase', fontWeight: 'bold',
              boxShadow: `0 0 20px ${accentColor}55`, transition: 'all 0.12s',
            }}
          >
            ⚡ MISSION STARTEN
          </button>
        )}
      </div>

      <button
        onClick={() => setPhase(offlinePath ? 'map_select' : briefingReturnTo)}
        style={{
          background: 'transparent', border: 'none', color: 'rgba(138,154,98,0.4)',
          fontSize: 10, letterSpacing: 2, padding: '12px', cursor: 'pointer',
          fontFamily: 'inherit', textTransform: 'uppercase', marginTop: 8,
          paddingBottom: 'max(12px, calc(env(safe-area-inset-bottom, 0px) + 12px))',
        }}
      >
        {offlinePath ? '← Zurück' : '← Abbrechen'}
      </button>
    </div>
  )
}
