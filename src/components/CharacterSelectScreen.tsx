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
      background: 'radial-gradient(ellipse at 50% 30%, #0d1840 0%, #050512 65%, #020208 100%)',
      fontFamily: "'Courier New', monospace", userSelect: 'none', overflow: 'hidden',
    }}>

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(0,100,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,100,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ color: '#00aaff66', fontSize: 9, letterSpacing: 6, marginBottom: 8 }}>
          AUSRÜSTUNG
        </div>
        <div style={{
          color: '#e8f4ff', fontSize: 'clamp(20px, 3.5vw, 28px)', letterSpacing: 10,
          textShadow: '0 0 12px #88ccff88',
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
                background: active ? `${cfg.accent}12` : 'rgba(5,2,8,0.88)',
                border: `2px solid ${active ? cfg.accent : '#1a2535'}`,
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
                color: active ? cfg.accent : '#aabbcc',
                fontSize: 11, letterSpacing: 3, fontWeight: 'bold',
                textAlign: 'center', textTransform: 'uppercase',
                textShadow: active ? `0 0 8px ${cfg.accent}88` : 'none',
              }}>
                {cfg.name}
              </div>

              {/* Description */}
              <div style={{
                color: '#445566', fontSize: 9, letterSpacing: 1,
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
      <div style={{ display: 'flex', gap: 10, width: 'min(96vw, 520px)' }}>
        <button
          onClick={() => setPhase('menu')}
          style={{
            background: 'transparent', border: '1px solid #2a3a4a', color: '#7799aa',
            fontSize: 10, letterSpacing: 3, padding: '12px 18px', cursor: 'pointer',
            fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#cce4ff'; e.currentTarget.style.borderColor = '#4a6a80' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#7799aa'; e.currentTarget.style.borderColor = '#2a3a4a' }}
        >← Zurück</button>
        <button
          onClick={() => setPhase('shop')}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #003366 0%, #001a44 100%)',
            border: '1px solid #00aaff', color: '#00ddff',
            fontSize: 13, letterSpacing: 5, padding: '13px', cursor: 'pointer',
            fontFamily: 'inherit', textTransform: 'uppercase',
            boxShadow: '0 0 20px #00aaff44, inset 0 0 20px #00aaff11',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #005599 0%, #003366 100%)'
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.boxShadow = '0 0 32px #00aaff88, inset 0 0 24px #00aaff22'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #003366 0%, #001a44 100%)'
            e.currentTarget.style.color = '#00ddff'
            e.currentTarget.style.boxShadow = '0 0 20px #00aaff44, inset 0 0 20px #00aaff11'
          }}
        >Weiter →</button>
      </div>
    </div>
  )
}
