import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from '../game/loadoutStore'
import { PLAYER_MAX_HEALTH, FOCUS_MAX, WEAPON_CONFIGS, AMMO_CONFIGS } from '../game/types'

export function HUD() {
  const health = useGameStore((s) => s.health)
  const score = useGameStore((s) => s.score)
  const wave = useGameStore((s) => s.wave)
  const waveMessage = useGameStore((s) => s.waveMessage)
  const focus = useGameStore((s) => s.focus)
  const isBulletTime = useGameStore((s) => s.isBulletTime)
  const ammo = useGameStore((s) => s.ammo)
  const maxAmmo = useGameStore((s) => s.maxAmmo)
  const creditsEarned = useGameStore((s) => s.creditsEarned)

  const { selectedWeapon, selectedAmmo } = useLoadoutStore()
  const weaponCfg = WEAPON_CONFIGS[selectedWeapon]
  const ammoCfg = AMMO_CONFIGS[selectedAmmo]

  const hpPct = Math.max(0, health / PLAYER_MAX_HEALTH) * 100
  const hpColor = hpPct > 50 ? '#00ff88' : hpPct > 25 ? '#ffaa00' : '#ff3300'
  const focusPct = (focus / FOCUS_MAX) * 100
  const ammoPct = maxAmmo > 0 ? (ammo / maxAmmo) * 100 : 0
  const ammoColor = ammoPct > 40 ? '#00ccff' : ammoPct > 15 ? '#ffaa00' : '#ff3300'
  const outOfAmmo = ammo === 0

  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none', fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 20, left: 20, right: 20,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        {/* Left: Health + Focus */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
          {/* Health */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ color: '#aaaacc', fontSize: 10, letterSpacing: 2 }}>HEALTH</div>
            <div style={{ height: 10, background: '#111122', border: '1px solid #334', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${hpPct}%`, background: hpColor,
                transition: 'width 0.1s, background 0.3s', boxShadow: `0 0 6px ${hpColor}`,
              }} />
            </div>
            <div style={{ color: hpColor, fontSize: 11, fontWeight: 'bold' }}>{health} / {PLAYER_MAX_HEALTH}</div>
          </div>

          {/* Focus */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isBulletTime ? '#00ccff' : '#aaaacc', fontSize: 10, letterSpacing: 2 }}>
              FOCUS
              {isBulletTime && (
                <span style={{ fontSize: 9, letterSpacing: 3, textShadow: '0 0 8px #00ccff', animation: 'btPulse 0.6s ease-in-out infinite alternate' }}>
                  ● AKTIV
                </span>
              )}
            </div>
            <div style={{ height: 10, background: '#080814', border: `1px solid ${isBulletTime ? '#224466' : '#1a2030'}`, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${focusPct}%`,
                background: isBulletTime ? 'linear-gradient(90deg, #0066cc, #00ccff)' : '#224466',
                boxShadow: isBulletTime ? '0 0 8px #00aaff' : 'none',
              }} />
            </div>
            <div style={{ color: '#445566', fontSize: 10 }}>{Math.round(focus)} / {FOCUS_MAX} — Shift</div>
          </div>
        </div>

        {/* Center: Wave */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#aaaacc', fontSize: 11, letterSpacing: 2 }}>WAVE</div>
          <div style={{ color: '#00aaff', fontSize: 32, fontWeight: 'bold', lineHeight: 1, textShadow: '0 0 12px #00aaff' }}>
            {wave}
          </div>
        </div>

        {/* Right: Score + Ammo + Credits */}
        <div style={{ textAlign: 'right', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Score */}
          <div>
            <div style={{ color: '#aaaacc', fontSize: 10, letterSpacing: 2 }}>SCORE</div>
            <div style={{ color: '#ffee00', fontSize: 22, fontWeight: 'bold', textShadow: '0 0 10px #ffcc00' }}>
              {score.toString().padStart(6, '0')}
            </div>
          </div>

          {/* Ammo */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 3 }}>
              <span style={{ color: ammoCfg.color, fontSize: 9, letterSpacing: 2 }}>{ammoCfg.shortName}</span>
              <span style={{ color: '#445566', fontSize: 10, letterSpacing: 2 }}>{weaponCfg.shortName}</span>
            </div>
            <div style={{ height: 8, background: '#111122', border: `1px solid ${outOfAmmo ? '#ff3300' : '#334'}`, borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
              <div style={{
                height: '100%', width: `${ammoPct}%`, background: ammoColor,
                transition: 'width 0.05s', boxShadow: `0 0 4px ${ammoColor}`,
                animation: outOfAmmo ? 'btPulse 0.3s ease-in-out infinite alternate' : 'none',
              }} />
            </div>
            <div style={{ color: outOfAmmo ? '#ff3300' : ammoColor, fontSize: 11, fontWeight: 'bold' }}>
              {outOfAmmo ? 'LEER' : `${ammo} / ${maxAmmo}`}
            </div>
          </div>

          {/* Credits earned this run */}
          {creditsEarned > 0 && (
            <div>
              <div style={{ color: '#445566', fontSize: 10, letterSpacing: 2 }}>CREDITS</div>
              <div style={{ color: '#ffaa00', fontSize: 13, fontWeight: 'bold' }}>+{creditsEarned}</div>
            </div>
          )}
        </div>
      </div>

      {/* Wave announcement */}
      {waveMessage && (
        <div style={{
          position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)',
          color: '#00aaff', fontSize: 48, fontWeight: 'bold', letterSpacing: 6,
          textTransform: 'uppercase', textShadow: '0 0 20px #00aaff, 0 0 40px #0066ff',
          animation: 'fadeInOut 2s ease-in-out',
        }}>
          {waveMessage}
        </div>
      )}

      {/* Controls hint */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        color: '#334455', fontSize: 10, letterSpacing: 1, textAlign: 'center', whiteSpace: 'nowrap',
      }}>
        WASD — Bewegen &nbsp;|&nbsp; Maus — Zielen &nbsp;|&nbsp; LMT / Space — Schießen &nbsp;|&nbsp; Shift — Bullet Time
      </div>
    </div>
  )
}
