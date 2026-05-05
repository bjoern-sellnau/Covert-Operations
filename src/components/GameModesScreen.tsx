import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useMutatorsStore } from '../store/mutatorsStore'
import type { GameType } from '../store/mutatorsStore'
import { playClick, playHover } from '../game/uiSounds'

const NO_SHOP: Set<GameType> = new Set(['instakill', 'instakill_wave', 'hardline_solo', 'hardline', 'deathmatch', 'arena'])

type ModeConfig = { id: GameType; label: string; desc: string; color: string; noShop: boolean }

const MODES: ModeConfig[] = [
  { id: 'waves',          label: 'WELLENMODUS',    color: '#cc2200', noShop: false, desc: 'Endlose Wellen — überlebe so lange wie möglich. Credits für den Shop.' },
  { id: 'roundtime',      label: 'RUNDENZEIT',     color: '#ff6600', noShop: false, desc: 'Zeitlimit läuft ab — dann Sudden Death oder Spielende.' },
  { id: 'instakill',      label: 'INSTAKILL',      color: '#ff0044', noShop: true,  desc: 'Ein Treffer = sofortiger Tod. Bots spawnen sofort nach.' },
  { id: 'instakill_wave', label: 'INSTAKILL WELLE',color: '#cc0044', noShop: true,  desc: 'Instakill kombiniert mit klassischen Wellen.' },
  { id: 'hardline_solo',  label: 'HARDLINE SOLO',  color: '#ffcc00', noShop: true,  desc: 'Starte mit Messer — jeder Kill schaltet die nächste Waffe frei.' },
  { id: 'hardline',       label: 'HARDLINE',       color: '#ffaa00', noShop: true,  desc: 'Hardline mit Bots. Alle kämpfen um dieselben Waffen-Upgrades.' },
  { id: 'deathmatch',     label: 'DEATHMATCH',     color: '#cc44ff', noShop: true,  desc: 'Bots spawnen sofort nach. Unbegrenzte Action.' },
  { id: 'arena',          label: 'ARENA',          color: '#00aacc', noShop: true,  desc: 'Unreal-Tournament-Stil. Waffen-Pickups via Mutatoren konfigurierbar.' },
]

export function GameModesScreen() {
  const setPhase      = useGameStore((s) => s.setPhase)
  const setSkipShop   = useGameStore((s) => s.setSkipShop)
  const gameType      = useMutatorsStore((s) => s.gameType)
  const setGameType   = useMutatorsStore((s) => s.setGameType)
  const [hovered, setHovered] = useState<GameType | null>(null)

  const selected = MODES.find((m) => m.id === gameType) ?? MODES[0]

  function confirm() {
    playClick()
    setSkipShop(NO_SHOP.has(gameType))
    setPhase('mutators')
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      animation: 'menuFadeIn 0.35s cubic-bezier(0.2,0.8,0.3,1) both',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      fontFamily: "'DM Sans', sans-serif", userSelect: 'none',
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
        }}>SPIELMODUS</div>
        <div style={{ width: 300, height: 1, background: 'rgba(224,84,24,0.5)', margin: '12px auto 0' }} />
      </div>

      {/* Mode grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
        gap: 8,
        width: 'min(96vw, 820px)',
        marginBottom: 20,
      }}>
        {MODES.map((m) => {
          const active = gameType === m.id
          const isHov  = hovered === m.id
          return (
            <div
              key={m.id}
              onClick={() => { playClick(); setGameType(m.id) }}
              onMouseEnter={() => { setHovered(m.id); playHover() }}
              onMouseLeave={() => setHovered(null)}
              style={{
                cursor: 'pointer', borderRadius: 2, padding: '14px 14px 12px',
                background: active ? `${m.color}14` : isHov ? 'rgba(138,154,98,0.05)' : 'rgba(10,12,7,0.85)',
                border: `2px solid ${active ? m.color : isHov ? 'rgba(138,154,98,0.3)' : 'rgba(138,154,98,0.14)'}`,
                boxShadow: active ? `0 0 16px ${m.color}44, inset 0 0 12px ${m.color}08` : 'none',
                transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}
            >
              <div style={{
                fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
                fontSize: 12, letterSpacing: '0.2em',
                color: active ? m.color : isHov ? 'rgba(224,220,200,0.9)' : 'rgba(200,196,176,0.7)',
                textShadow: active ? `0 0 8px ${m.color}88` : 'none',
                transition: 'color 0.15s',
              }}>{m.label}</div>
              {m.noShop && (
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 8, letterSpacing: '0.2em',
                  color: active ? m.color : 'rgba(106,112,72,0.5)',
                }}>KEIN SHOP</div>
              )}
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10, color: 'rgba(138,154,98,0.5)', lineHeight: 1.5,
              }}>{m.desc}</div>
              {active && (
                <div style={{
                  fontSize: 9, letterSpacing: '0.25em',
                  color: m.color, fontFamily: "'Share Tech Mono', monospace",
                  textShadow: `0 0 8px ${m.color}`,
                }}>▶ AKTIV</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected description */}
      <div style={{
        width: 'min(96vw, 820px)', marginBottom: 24,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 10, letterSpacing: '0.15em',
        color: selected.color, opacity: 0.8,
        textAlign: 'center',
      }}>
        {selected.noShop ? '[ KEIN SHOP — Mutator-Einstellungen gelten trotzdem ]' : '[ SHOP VERFÜGBAR — Waffen & Ausrüstung kaufen ]'}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', gap: 10, width: 'min(96vw, 820px)',
        paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
      }}>
        <button
          onClick={() => { playClick(); setPhase('character_select') }}
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
        >MUTATOREN →</button>
      </div>
    </div>
  )
}
