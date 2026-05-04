import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'
import { SKIN_CONFIGS, SKIN_ORDER } from '../game/skins'
import type { SkinId } from '../game/skins'

export function CharacterSelectScreen() {
  const setPhase    = useGameStore((s) => s.setPhase)
  const playerSkin  = useSettingsStore((s) => s.playerSkin)
  const setPlayerSkin = useSettingsStore((s) => s.setPlayerSkin)

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      fontFamily: "'DM Sans', sans-serif", userSelect: 'none', overflow: 'hidden',
      animation: 'menuFadeIn 0.35s cubic-bezier(0.2,0.8,0.3,1) both',
    }}>

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(138,154,98,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(138,154,98,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: '0.3em', color: '#e05418', marginBottom: 8 }}>
          Δ COVERT OPERATIONS
        </div>
        <div style={{
          fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
          fontSize: 'clamp(28px, 5vw, 44px)', letterSpacing: '0.18em',
          color: 'rgba(224,220,200,0.9)', textShadow: '0 0 40px rgba(224,84,24,0.15)',
        }}>
          CHARAKTER AUSWAHL
        </div>
        <div style={{ width: 300, height: 1, background: 'rgba(224,84,24,0.5)', margin: '12px auto 0' }} />
      </div>

      {/* Skin cards */}
      <div style={{
        display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
        width: 'min(96vw, 900px)', marginBottom: 32,
      }}>
        {SKIN_ORDER.map((id: SkinId) => {
          const cfg     = SKIN_CONFIGS[id]
          const active  = playerSkin === id
          return (
            <div
              key={id}
              onClick={() => setPlayerSkin(id)}
              style={{
                width: 155, cursor: 'pointer',
                background: active ? `${cfg.accent}12` : 'rgba(10,12,7,0.85)',
                border: `2px solid ${active ? cfg.accent : 'rgba(138,154,98,0.18)'}`,
                boxShadow: active ? `0 0 18px ${cfg.accent}44, inset 0 0 16px ${cfg.accent}0a` : 'none',
                borderRadius: 2, padding: '14px 12px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transition: 'all 0.15s',
              }}
            >
              {/* Color preview */}
              <div style={{ display: 'flex', gap: 5, width: '100%' }}>
                <div style={{
                  flex: 2, height: 52, borderRadius: 2,
                  background: cfg.uniform,
                  boxShadow: `inset 0 0 8px ${cfg.uniformEmissive}`,
                  border: '1px solid #ffffff11',
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <div style={{
                    flex: 1, borderRadius: 2,
                    background: cfg.helmet,
                    boxShadow: `inset 0 0 6px ${cfg.helmetEmissive}`,
                    border: '1px solid #ffffff11',
                  }} />
                  <div style={{
                    flex: 1, borderRadius: 2,
                    background: cfg.pants,
                    border: '1px solid #ffffff11',
                  }} />
                </div>
              </div>

              {/* Name */}
              <div style={{
                color: active ? cfg.accent : 'rgba(220,216,200,0.85)',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11, letterSpacing: 3, fontWeight: 'bold',
                textAlign: 'center', textTransform: 'uppercase',
                textShadow: active ? `0 0 8px ${cfg.accent}88` : 'none',
              }}>
                {cfg.name}
              </div>

              {/* Description */}
              <div style={{
                color: 'rgba(138,154,98,0.4)', fontSize: 9, letterSpacing: 1,
                textAlign: 'center', lineHeight: 1.5,
              }}>
                {cfg.desc}
              </div>

              {/* Selected indicator */}
              {active && (
                <div style={{
                  color: cfg.accent, fontSize: 9, letterSpacing: 3,
                  textShadow: `0 0 8px ${cfg.accent}`,
                }}>
                  ▶ AKTIV
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, width: 'min(96vw, 520px)', paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }}>
        <button
          onClick={() => setPhase('multiplayer_menu')}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.3em',
            color: 'rgba(106,112,72,0.6)', textTransform: 'uppercase', transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(224,84,24,0.8)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(106,112,72,0.6)' }}
        >← ZURÜCK</button>
        <button
          onClick={() => setPhase('shop')}
          style={{
            flex: 1, background: 'rgba(224,84,24,0.08)', border: '1px solid rgba(224,84,24,0.5)',
            color: '#e05418', fontSize: 11, letterSpacing: '0.3em', padding: '13px', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(224,84,24,0.18)'; e.currentTarget.style.color = '#f4f0e4' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(224,84,24,0.08)'; e.currentTarget.style.color = '#e05418' }}
        >WEITER →</button>
      </div>
    </div>
  )
}
