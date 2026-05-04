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
      fontFamily: "'Courier New', monospace", userSelect: 'none', overflow: 'hidden',
    }}>

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(138,154,98,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(138,154,98,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ color: 'rgba(224,84,24,0.4)', fontSize: 9, letterSpacing: 6, marginBottom: 8 }}>
          AUSRÜSTUNG
        </div>
        <div style={{
          color: '#e0dcc8', fontSize: 'clamp(20px, 3.5vw, 28px)', letterSpacing: 10,
          textShadow: '0 0 12px rgba(224,84,24,0.4)',
        }}>
          CHARAKTER AUSWAHL
        </div>
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
            background: 'transparent', border: '1px solid rgba(138,154,98,0.18)', color: 'rgba(200,196,176,0.6)',
            fontSize: 10, letterSpacing: 3, padding: '12px 18px', cursor: 'pointer',
            fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e0dcc8'; e.currentTarget.style.borderColor = 'rgba(138,154,98,0.7)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(200,196,176,0.6)'; e.currentTarget.style.borderColor = 'rgba(138,154,98,0.18)' }}
        >← Zurück</button>
        <button
          onClick={() => setPhase('shop')}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #1a1e0e 0%, #0a0d06 100%)',
            border: '1px solid #e05418', color: '#f07030',
            fontSize: 13, letterSpacing: 5, padding: '13px', cursor: 'pointer',
            fontFamily: 'inherit', textTransform: 'uppercase',
            boxShadow: '0 0 14px rgba(224,84,24,0.3), inset 0 0 20px rgba(224,84,24,0.06)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #2a3018 0%, #1a1e0e 100%)'
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.boxShadow = '0 0 28px rgba(224,84,24,0.5), inset 0 0 24px rgba(224,84,24,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1a1e0e 0%, #0a0d06 100%)'
            e.currentTarget.style.color = '#f07030'
            e.currentTarget.style.boxShadow = '0 0 14px rgba(224,84,24,0.3), inset 0 0 20px rgba(224,84,24,0.06)'
          }}
        >Weiter →</button>
      </div>
    </div>
  )
}
