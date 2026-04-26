import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from '../game/loadoutStore'
import { entityStore } from '../game/entityStore'
import { PLAYER_MAX_HEALTH, FOCUS_MAX, WEAPON_CONFIGS, AMMO_CONFIGS, DIVE_COOLDOWN, SPIN_COOLDOWN, type WeaponId } from '../game/types'

function P2Panel() {
  const p2Active  = useGameStore((s) => s.p2Active)
  const p2Health  = useGameStore((s) => s.p2Health)
  const p2Ammo    = useGameStore((s) => s.p2Ammo)
  const p2MaxAmmo = useGameStore((s) => s.p2MaxAmmo)

  if (!p2Active) {
    return (
      <div style={{
        position: 'absolute', bottom: 20, left: 20,
        color: '#334455', fontSize: 10, letterSpacing: 2,
      }}>
        PFEILTASTEN / GAMEPAD = SPIELER 2
      </div>
    )
  }

  const hpPct    = Math.max(0, p2Health / PLAYER_MAX_HEALTH) * 100
  const hpColor  = hpPct > 50 ? '#ff8833' : hpPct > 25 ? '#ffaa00' : '#ff3300'
  const ammoPct  = p2MaxAmmo > 0 ? (p2Ammo / p2MaxAmmo) * 100 : 0
  const p2Grens  = entityStore.grenadeCount2

  return (
    <div style={{
      position: 'absolute', bottom: 20, left: 20,
      background: '#08080fcc', border: '1px solid #ff440044',
      borderRadius: 4, padding: '10px 14px', minWidth: 160,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{ color: '#ff6600', fontSize: 10, letterSpacing: 3, marginBottom: 8, textShadow: '0 0 6px #ff4400' }}>
        SPIELER 2
      </div>
      <div style={{ color: '#88aacc', fontSize: 9, letterSpacing: 2, marginBottom: 3 }}>HEALTH</div>
      <div style={{ height: 7, background: '#111122', border: `1px solid #ff440033`, borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
        <div style={{ height: '100%', width: `${hpPct}%`, background: hpColor, transition: 'width 0.1s', boxShadow: `0 0 5px ${hpColor}` }} />
      </div>
      <div style={{ color: hpColor, fontSize: 11, fontWeight: 'bold', marginBottom: 8 }}>
        {p2Health <= 0 ? 'TOT' : `${p2Health} / ${PLAYER_MAX_HEALTH}`}
      </div>
      <div style={{ color: '#88aacc', fontSize: 9, letterSpacing: 2, marginBottom: 3 }}>MUNITION</div>
      <div style={{ height: 5, background: '#111122', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
        <div style={{ height: '100%', width: `${ammoPct}%`, background: '#ff8844', transition: 'width 0.05s' }} />
      </div>
      <div style={{ color: '#cc6644', fontSize: 10, marginBottom: 8 }}>{p2Ammo} / {p2MaxAmmo}</div>
      <div style={{ color: p2Grens > 0 ? '#88ff44' : '#334433', fontSize: 13 }}>
        {'◉ '.repeat(p2Grens).trim() || '○'}
        {p2Grens > 0 && p2Grens < 3 ? ' ' + '○ '.repeat(3 - p2Grens).trim() : ''}
      </div>
      <div style={{ color: '#334455', fontSize: 9, letterSpacing: 1, marginTop: 8 }}>
        ↑↓←→ Bewegen · RCtrl Schießen<br />RShift Granate · Gamepad OK
      </div>
    </div>
  )
}

function ManeuverBar({ label, cooldown, maxCooldown, color, active }: {
  label: string; cooldown: number; maxCooldown: number; color: string; active: boolean
}) {
  const ready = cooldown <= 0
  const pct   = ready ? 100 : Math.max(0, (1 - cooldown / maxCooldown)) * 100
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 68 }}>
      <div style={{ color: active ? color : ready ? color : '#445566', fontSize: 9, letterSpacing: 2, textAlign: 'center',
        textShadow: active ? `0 0 8px ${color}` : 'none',
        animation: active ? 'btPulse 0.3s ease-in-out infinite alternate' : 'none',
      }}>
        {label}
      </div>
      <div style={{ height: 4, background: '#0a0a14', border: `1px solid ${ready || active ? color + '88' : '#1a2030'}`, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: active ? color : ready ? color + '88' : '#224466',
          boxShadow: ready ? `0 0 6px ${color}` : 'none',
          transition: 'width 0.08s',
        }} />
      </div>
    </div>
  )
}

export function HUD() {
  const health        = useGameStore((s) => s.health)
  const score         = useGameStore((s) => s.score)
  const wave          = useGameStore((s) => s.wave)
  const waveMessage   = useGameStore((s) => s.waveMessage)
  const focus         = useGameStore((s) => s.focus)
  const isBulletTime  = useGameStore((s) => s.isBulletTime)
  const ammo          = useGameStore((s) => s.ammo)
  const maxAmmo       = useGameStore((s) => s.maxAmmo)
  const creditsEarned = useGameStore((s) => s.creditsEarned)
  const roundTimer    = useGameStore((s) => s.roundTimer)
  const playerLives   = useGameStore((s) => s.playerLives)
  const inSuddenDeath = useGameStore((s) => s.inSuddenDeath)
  const chaosActive   = useGameStore((s) => s.chaosActive)
  const cameraMode    = useGameStore((s) => s.cameraMode)

  const { selectedWeapon, selectedAmmo, isAkimbo, ownedWeapons } = useLoadoutStore()
  const weaponCfg = WEAPON_CONFIGS[selectedWeapon]
  const ammoCfg   = AMMO_CONFIGS[selectedAmmo]

  const [diveCd,      setDiveCd]      = useState(0)
  const [spinCd,      setSpinCd]      = useState(0)
  const [maneuver,    setManeuver]    = useState<'none' | 'dive' | 'spin'>('none')
  const [grenades,    setGrenades]    = useState(3)
  const [vernAmmo,    setVernAmmo]    = useState(1)
  const [vernActive,  setVernActive]  = useState(false)
  const [reloadTimer, setReloadTimer] = useState(0)
  const [weaponAmmo,  setWeaponAmmo]  = useState<Map<string, number>>(new Map())
  useEffect(() => {
    const id = setInterval(() => {
      setDiveCd(Math.max(0, entityStore.diveCooldown))
      setSpinCd(Math.max(0, entityStore.spinCooldown))
      setManeuver(entityStore.maneuver)
      setGrenades(entityStore.grenadeCount)
      setVernAmmo(entityStore.vernichterAmmo)
      setVernActive(entityStore.vernichterProjectile !== null)
      setReloadTimer(entityStore.reloadTimer)
      setWeaponAmmo(new Map(entityStore.weaponAmmo))
    }, 50)
    return () => clearInterval(id)
  }, [])

  const hpPct     = Math.max(0, health / PLAYER_MAX_HEALTH) * 100
  const hpColor   = hpPct > 50 ? '#00ff88' : hpPct > 25 ? '#ffaa00' : '#ff3300'
  const focusPct  = (focus / FOCUS_MAX) * 100
  const ammoPct   = maxAmmo > 0 ? (ammo / maxAmmo) * 100 : 0
  const ammoColor = ammoPct > 40 ? '#00ccff' : ammoPct > 15 ? '#ffaa00' : '#ff3300'
  const outOfAmmo = ammo === 0
  const canAkimbo = isAkimbo && (selectedWeapon === 'pistol' || selectedWeapon === 'smg')

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
      pointerEvents: 'none', fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      <div style={{
        position: 'absolute', top: 20, left: 20, right: 20,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        {/* Left: Health + Focus + Maneuver cooldowns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ color: '#aaaacc', fontSize: 10, letterSpacing: 2 }}>HEALTH</div>
            <div style={{ height: 10, background: '#111122', border: '1px solid #334', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${hpPct}%`, background: hpColor, transition: 'width 0.1s, background 0.3s', boxShadow: `0 0 6px ${hpColor}` }} />
            </div>
            <div style={{ color: hpColor, fontSize: 11, fontWeight: 'bold' }}>{health} / {PLAYER_MAX_HEALTH}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isBulletTime ? '#00ccff' : '#aaaacc', fontSize: 10, letterSpacing: 2 }}>
              FOCUS
              {isBulletTime && <span style={{ fontSize: 9, letterSpacing: 3, textShadow: '0 0 8px #00ccff', animation: 'btPulse 0.6s ease-in-out infinite alternate' }}>● AKTIV</span>}
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

          {/* Maneuver cooldowns */}
          <div style={{ display: 'flex', gap: 10 }}>
            <ManeuverBar label={maneuver === 'dive' ? '▶ DIVE' : 'DIVE'} cooldown={diveCd} maxCooldown={DIVE_COOLDOWN} color="#00ccff" active={maneuver === 'dive'} />
            {canAkimbo && (
              <ManeuverBar label={maneuver === 'spin' ? '↺ SPIN' : 'SPIN'} cooldown={spinCd} maxCooldown={SPIN_COOLDOWN} color="#cc44ff" active={maneuver === 'spin'} />
            )}
          </div>
        </div>

        {/* Center: Wave + Timer + Lives + Camera mode */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {roundTimer > 0 ? (
            <>
              <div style={{ color: inSuddenDeath ? '#cc1100' : '#aaaacc', fontSize: 9, letterSpacing: 3,
                animation: inSuddenDeath ? 'btPulse 0.4s ease-in-out infinite alternate' : 'none' }}>
                {inSuddenDeath ? 'SUDDEN DEATH' : 'ZEIT'}
              </div>
              <div style={{
                color: inSuddenDeath ? '#ff1100' : roundTimer < 30 ? '#ff6600' : '#00aaff',
                fontSize: 36, fontWeight: 'bold', lineHeight: 1,
                textShadow: inSuddenDeath ? '0 0 16px #ff0000' : '0 0 12px #00aaff',
                animation: roundTimer < 10 ? 'btPulse 0.5s ease-in-out infinite alternate' : 'none',
              }}>
                {Math.floor(roundTimer / 60)}:{String(Math.floor(roundTimer % 60)).padStart(2, '0')}
              </div>
              {playerLives < 999 && (
                <div style={{ color: '#ff6600', fontSize: 13, letterSpacing: 1 }}>
                  {'♥ '.repeat(Math.max(0, playerLives)).trim() || '—'}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ color: '#aaaacc', fontSize: 11, letterSpacing: 2 }}>WAVE</div>
              <div style={{ color: '#00aaff', fontSize: 32, fontWeight: 'bold', lineHeight: 1, textShadow: '0 0 12px #00aaff' }}>{wave}</div>
            </>
          )}
          {chaosActive && (
            <div style={{ color: '#cc00ff', fontSize: 9, letterSpacing: 2, marginTop: 2,
              textShadow: '0 0 8px #cc00ff', animation: 'btPulse 0.3s ease-in-out infinite alternate' }}>
              ★ CHAOS
            </div>
          )}
          <div style={{ color: '#2a2a3a', fontSize: 8, letterSpacing: 2, marginTop: 2 }}>
            [F] {cameraMode.toUpperCase()}
          </div>
        </div>

        {/* Right: Score + Ammo + Grenades + Credits */}
        <div style={{ textAlign: 'right', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ color: '#aaaacc', fontSize: 10, letterSpacing: 2 }}>SCORE</div>
            <div style={{ color: '#ffee00', fontSize: 22, fontWeight: 'bold', textShadow: '0 0 10px #ffcc00' }}>
              {score.toString().padStart(6, '0')}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 3 }}>
              {canAkimbo && <span style={{ color: '#cc44ff', fontSize: 9, letterSpacing: 2, textShadow: '0 0 6px #cc44ff' }}>AKIMBO</span>}
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

          {/* Grenades */}
          <div>
            <div style={{ color: '#445566', fontSize: 10, letterSpacing: 2 }}>GRANATEN [G]</div>
            <div style={{ color: grenades > 0 ? '#88ff44' : '#334433', fontSize: 16, textShadow: grenades > 0 ? '0 0 8px #66dd22' : 'none' }}>
              {'◉ '.repeat(grenades).trim() || '○ ○ ○'}
              {grenades > 0 && grenades < 3 ? ' ' + '○ '.repeat(3 - grenades).trim() : ''}
            </div>
          </div>

          {/* Vernichter */}
          <div>
            <div style={{ color: '#445566', fontSize: 10, letterSpacing: 2 }}>VERNICHTER [R]</div>
            <div style={{
              color: vernActive ? '#ffaa00' : vernAmmo > 0 ? '#ff6600' : '#331100',
              fontSize: vernAmmo > 0 ? 20 : 14, fontWeight: 'bold',
              textShadow: vernAmmo > 0 ? '0 0 12px #ff4400' : 'none',
              animation: vernActive ? 'btPulse 0.2s ease-in-out infinite alternate' : 'none',
            }}>
              {vernActive ? '◉ AKTIV' : vernAmmo > 0 ? `◉ ×${vernAmmo}` : '○ LEER'}
            </div>
          </div>

          {creditsEarned > 0 && (
            <div>
              <div style={{ color: '#445566', fontSize: 10, letterSpacing: 2 }}>CREDITS</div>
              <div style={{ color: '#ffaa00', fontSize: 13, fontWeight: 'bold' }}>+{creditsEarned}</div>
            </div>
          )}
        </div>
      </div>

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

      {maneuver === 'spin' && (
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
          color: '#ff88ff', fontSize: 22, letterSpacing: 6, fontWeight: 'bold',
          textShadow: '0 0 18px #cc44ff, 0 0 40px #8800cc',
          animation: 'btPulse 0.3s ease-in-out infinite alternate',
          pointerEvents: 'none',
        }}>
          ↺ BALLETT-SPIN
        </div>
      )}

      {/* Weapon slots bar */}
      <div style={{
        position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, alignItems: 'flex-end',
      }}>
        {Array.from({ length: 5 }, (_, i) => {
          const w = ownedWeapons[i] as WeaponId | undefined
          const active = w === selectedWeapon
          const slotAmmo = w ? (w === selectedWeapon ? ammo : (weaponAmmo.get(w) ?? 0)) : 0
          const slotMax  = w ? WEAPON_CONFIGS[w].baseAmmo : 1
          const ammoPct  = w ? slotAmmo / slotMax : 0
          const reloading = active && reloadTimer > 0
          const reloadPct = reloading ? 1 - reloadTimer / WEAPON_CONFIGS[selectedWeapon].reloadTime : 1
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '4px 7px',
              background: active ? '#00aaff18' : w ? '#ffffff08' : 'transparent',
              border: `1px solid ${active ? '#00aaff88' : w ? '#223344' : '#111'}`,
              borderRadius: 3, minWidth: 52,
              opacity: w ? 1 : 0.3,
            }}>
              <div style={{ color: '#445566', fontSize: 8, letterSpacing: 1 }}>{i + 1}</div>
              {w ? (
                <>
                  <div style={{ color: active ? '#00aaff' : '#556677', fontSize: 10, fontWeight: active ? 'bold' : 'normal', letterSpacing: 1 }}>
                    {WEAPON_CONFIGS[w].shortName}
                  </div>
                  {/* Ammo bar */}
                  <div style={{ width: '100%', height: 3, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${ammoPct * 100}%`, background: ammoPct > 0.3 ? '#00ccff' : '#ff4400', transition: 'width 0.05s' }} />
                  </div>
                  {/* Reload progress */}
                  {reloading && (
                    <div style={{ width: '100%', height: 2, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${reloadPct * 100}%`, background: '#ffcc00', transition: 'width 0.05s' }} />
                    </div>
                  )}
                  <div style={{ color: reloading ? '#ffcc00' : ammoPct > 0 ? '#445566' : '#ff3300', fontSize: 9 }}>
                    {reloading ? 'LADEN' : `${slotAmmo}`}
                  </div>
                </>
              ) : (
                <div style={{ color: '#223344', fontSize: 9 }}>—</div>
              )}
            </div>
          )
        })}
      </div>

      <P2Panel />
    </div>
  )
}
