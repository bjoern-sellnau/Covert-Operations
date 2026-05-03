import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from '../game/loadoutStore'
import { entityStore } from '../game/entityStore'
import { useSettingsStore } from '../store/settingsStore'
import { hudData } from '../game/hudData'
import { ARENA_HALF, PLAYER_MAX_HEALTH, FOCUS_MAX, WEAPON_CONFIGS, AMMO_CONFIGS, DIVE_COOLDOWN, SPIN_COOLDOWN, WEAPON_SLOT_WEAPONS, type WeaponId } from '../game/types'
import { useDemoStore } from '../store/demoStore'
import { startAudioRecording, stopAudioRecording } from '../game/audioCore'
import { useEditorStore } from '../editor/editorStore'

function P2Panel() {
  const p2Active  = useGameStore((s) => s.p2Active)
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

function RecButton() {
  const isRecording    = useDemoStore((s) => s.isRecording)
  const startRecording = useDemoStore((s) => s.startRecording)
  // Stop: just set isRecording=false; DemoRecorder.useFrame detects the transition and saves frames
  const stopRecording  = () => useDemoStore.setState({ isRecording: false })
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    if (!isRecording) { setPulse(false); return }
    const id = setInterval(() => setPulse(p => !p), 600)
    return () => clearInterval(id)
  }, [isRecording])
  return (
    <div
      onClick={() => isRecording ? stopRecording() : startRecording()}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        cursor: 'pointer', userSelect: 'none',
        opacity: isRecording ? 1 : 0.45,
        transition: 'opacity 0.15s',
      }}
      title={isRecording ? 'Aufnahme stoppen' : 'Demo aufnehmen'}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: isRecording ? (pulse ? '#ff2200' : '#aa1100') : '#334455',
        boxShadow: isRecording ? `0 0 6px ${pulse ? '#ff2200' : '#660000'}` : 'none',
        transition: 'all 0.3s',
      }} />
      <span style={{ color: isRecording ? '#ff4422' : '#334455', fontSize: 9, letterSpacing: 2 }}>
        {isRecording ? 'REC' : 'REC'}
      </span>
    </div>
  )
}

function AudioRecButton() {
  const [recording, setRecording] = useState(false)
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    if (!recording) { setPulse(false); return }
    const id = setInterval(() => setPulse(p => !p), 600)
    return () => clearInterval(id)
  }, [recording])
  const toggle = async () => {
    if (!recording) {
      const ok = startAudioRecording()
      if (ok) setRecording(true)
    } else {
      setRecording(false)
      const blob = await stopAudioRecording()
      if (blob.size > 0) {
        const ext = blob.type.includes('ogg') ? 'ogg' : 'webm'
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `covert-ops-${Date.now()}.${ext}`
        a.click()
        URL.revokeObjectURL(url)
      }
    }
  }
  return (
    <div
      onClick={toggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        cursor: 'pointer', userSelect: 'none',
        opacity: recording ? 1 : 0.45,
        transition: 'opacity 0.15s',
      }}
      title={recording ? 'Audio-Aufnahme stoppen & herunterladen' : 'Audio aufnehmen'}
    >
      <div style={{
        width: 8, height: 8, borderRadius: 2,
        background: recording ? (pulse ? '#ff8800' : '#aa5500') : '#334455',
        boxShadow: recording ? `0 0 6px ${pulse ? '#ff8800' : '#663300'}` : 'none',
        transition: 'all 0.3s',
      }} />
      <span style={{ color: recording ? '#ff9933' : '#334455', fontSize: 9, letterSpacing: 2 }}>
        AUD
      </span>
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
  const armor         = useGameStore((s) => s.armor)
  const roundTimer    = useGameStore((s) => s.roundTimer)
  const playerLives   = useGameStore((s) => s.playerLives)
  const inSuddenDeath = useGameStore((s) => s.inSuddenDeath)
  const chaosActive   = useGameStore((s) => s.chaosActive)
  const cameraMode    = useGameStore((s) => s.cameraMode)
  const p2Active      = useGameStore((s) => s.p2Active)

  const { selectedWeapon, selectedAmmo, isAkimbo, ownedWeapons, activeSlot } = useLoadoutStore()
  const showEnemyMarkers = useSettingsStore((s) => s.showEnemyMarkers)
  const showMinimap      = useSettingsStore((s) => s.showMinimap)
  const weaponCfg = WEAPON_CONFIGS[selectedWeapon]
  const ammoCfg   = AMMO_CONFIGS[selectedAmmo]

  const [diveCd,      setDiveCd]      = useState(0)
  const [spinCd,      setSpinCd]      = useState(0)
  const [kataCd,      setKataCd]      = useState(0)
  const [maneuver,    setManeuver]    = useState<'none' | 'dive' | 'spin' | 'gunkata'>('none')
  const [reloadTimer, setReloadTimer] = useState(0)
  const [weaponAmmo,  setWeaponAmmo]  = useState<Map<string, number>>(new Map())
  const [chaosAmmo,   setChaosAmmo]   = useState(0)
  const [chaosWpnId,  setChaosWpnId]  = useState<WeaponId | null>(null)
  const [quadTimer,   setQuadTimer]   = useState(0)
  const [bersTimer,   setBersTimer]   = useState(0)
  const [fps,         setFps]         = useState(0)
  const [isPortrait,  setIsPortrait]  = useState(() => window.innerHeight > window.innerWidth)
  const fpsFrames = useRef(0)
  const fpsLast   = useRef(performance.now())
  useEffect(() => {
    const handler = () => setIsPortrait(window.innerHeight > window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  useEffect(() => {
    let id: number
    const loop = (now: number) => {
      fpsFrames.current++
      if (now - fpsLast.current >= 1000) {
        setFps(fpsFrames.current)
        fpsFrames.current = 0
        fpsLast.current = now
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  // ── Enemy markers (off-screen arrows) ─────────────────────────────────────
  type MarkerSnapshot = typeof hudData.enemyMarkers
  const [enemyMarkers, setEnemyMarkers] = useState<MarkerSnapshot>([])
  useEffect(() => {
    if (!showEnemyMarkers) return
    const id = setInterval(() => setEnemyMarkers([...hudData.enemyMarkers]), 50)
    return () => clearInterval(id)
  }, [showEnemyMarkers])

  // ── Minimap canvas ─────────────────────────────────────────────────────────
  const minimapRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!showMinimap) return
    const SIZE = 120
    const HALF = useEditorStore.getState().activePlayLevel?.arenaHalf ?? ARENA_HALF
    const toMap = (w: number) => ((w / HALF + 1) / 2) * SIZE

    const id = setInterval(() => {
      const canvas = minimapRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, SIZE, SIZE)

      // Background
      ctx.fillStyle = 'rgba(4, 6, 16, 0.82)'
      ctx.fillRect(0, 0, SIZE, SIZE)

      // Arena border
      ctx.strokeStyle = '#1a2a3a'
      ctx.lineWidth = 1
      ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2)

      // Enemies
      ctx.fillStyle = '#ff3322'
      for (const [, e] of entityStore.enemies) {
        const mx = toMap(e.position.x)
        const mz = toMap(e.position.y)
        ctx.beginPath()
        ctx.arc(mx, mz, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Player 2
      if (entityStore.player2Active) {
        const mx = toMap(entityStore.player2.position.x)
        const mz = toMap(entityStore.player2.position.y)
        ctx.fillStyle = '#ff8800'
        ctx.beginPath()
        ctx.arc(mx, mz, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Player (with facing direction)
      const px = toMap(entityStore.player.position.x)
      const pz = toMap(entityStore.player.position.y)
      const ang = entityStore.player.angle
      ctx.fillStyle = '#00ff88'
      ctx.beginPath()
      ctx.arc(px, pz, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(px, pz)
      ctx.lineTo(px + Math.sin(ang) * 8, pz - Math.cos(ang) * 8)
      ctx.stroke()
    }, 50)
    return () => clearInterval(id)
  }, [showMinimap])
  useEffect(() => {
    const id = setInterval(() => {
      setDiveCd(Math.max(0, entityStore.diveCooldown))
      setSpinCd(Math.max(0, entityStore.spinCooldown))
      setKataCd(Math.max(0, entityStore.gunKataCooldown))
      setManeuver(entityStore.maneuver)
      setReloadTimer(entityStore.reloadTimer)
      setWeaponAmmo(new Map(entityStore.weaponAmmo))
      setChaosAmmo(entityStore.chaosAmmo)
      setChaosWpnId(entityStore.chaosWeaponId)
      setQuadTimer(entityStore.player.quadDamageTimer)
      setBersTimer(entityStore.player.berserkerTimer)
    }, 50)
    return () => clearInterval(id)
  }, [])

  const hpPct     = Math.max(0, health / PLAYER_MAX_HEALTH) * 100
  const hpColor   = hpPct > 50 ? '#00ff88' : hpPct > 25 ? '#ffaa00' : '#ff3300'
  const focusPct  = (focus / FOCUS_MAX) * 100
  const isMelee   = !!weaponCfg.isMelee
  const showChaosAmmo = chaosActive && chaosWpnId !== null
  const displayAmmo   = showChaosAmmo ? chaosAmmo : ammo
  const displayMax    = showChaosAmmo ? chaosAmmo : maxAmmo
  const ammoPct   = displayMax > 0 ? (displayAmmo / displayMax) * 100 : 0
  const ammoColor = ammoPct > 40 ? '#00ccff' : ammoPct > 15 ? '#ffaa00' : '#ff3300'
  const outOfAmmo = displayAmmo === 0
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
          {!p2Active && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ color: '#aaaacc', fontSize: 10, letterSpacing: 2 }}>HEALTH</div>
              <div style={{ height: 10, background: '#111122', border: '1px solid #334', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${hpPct}%`, background: hpColor, transition: 'width 0.1s, background 0.3s', boxShadow: `0 0 6px ${hpColor}` }} />
              </div>
              <div style={{ color: hpColor, fontSize: 11, fontWeight: 'bold' }}>{health} / {PLAYER_MAX_HEALTH}</div>
            </div>
          )}

          {!p2Active && armor > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ color: '#4488ff', fontSize: 10, letterSpacing: 2 }}>RÜSTUNG</div>
              <div style={{ height: 6, background: '#111122', border: '1px solid #224', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${armor}%`, background: '#4488ff', transition: 'width 0.1s', boxShadow: '0 0 5px #4488ff' }} />
              </div>
              <div style={{ color: '#4488ff', fontSize: 10, fontWeight: 'bold' }}>{armor} / 100</div>
            </div>
          )}

          {(quadTimer > 0 || bersTimer > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {quadTimer > 0 && (
                <div style={{ color: '#ffcc00', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textShadow: '0 0 8px #ffcc00' }}>
                  ★ QUAD {Math.ceil(quadTimer)}s
                </div>
              )}
              {bersTimer > 0 && (
                <div style={{ color: '#ff6600', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textShadow: '0 0 8px #ff6600', animation: 'btPulse 0.4s ease-in-out infinite alternate' }}>
                  ⚡ BERSERKER {Math.ceil(bersTimer)}s
                </div>
              )}
            </div>
          )}

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
            {maneuver === 'gunkata' || kataCd > 0 ? (
              <ManeuverBar label={maneuver === 'gunkata' ? '✦ KATA' : 'KATA'} cooldown={kataCd} maxCooldown={3} color="#ff4488" active={maneuver === 'gunkata'} />
            ) : null}
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
              {showChaosAmmo && <span style={{ color: '#cc00ff', fontSize: 9, letterSpacing: 2, textShadow: '0 0 6px #cc00ff' }}>CHAOS</span>}
              {!isMelee && !showChaosAmmo && <span style={{ color: ammoCfg.color, fontSize: 9, letterSpacing: 2 }}>{ammoCfg.shortName}</span>}
              <span style={{ color: '#445566', fontSize: 10, letterSpacing: 2 }}>{showChaosAmmo && chaosWpnId ? WEAPON_CONFIGS[chaosWpnId].shortName : weaponCfg.shortName}</span>
            </div>
            <div style={{ height: 8, background: '#111122', border: `1px solid ${outOfAmmo ? '#ff3300' : '#334'}`, borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
              <div style={{
                height: '100%', width: `${isMelee ? (maxAmmo > 0 ? (ammo / maxAmmo) * 100 : 0) : ammoPct}%`,
                background: isMelee ? (ammo / maxAmmo > 0.5 ? '#ff8844' : ammo / maxAmmo > 0.2 ? '#ffaa00' : '#ff3300') : ammoColor,
                transition: 'width 0.05s', boxShadow: `0 0 4px ${ammoColor}`,
                animation: outOfAmmo ? 'btPulse 0.3s ease-in-out infinite alternate' : 'none',
              }} />
            </div>
            <div style={{ color: outOfAmmo ? '#ff3300' : isMelee ? '#ff8844' : ammoColor, fontSize: 11, fontWeight: 'bold' }}>
              {outOfAmmo ? (isMelee ? 'KAPUTT' : 'LEER') : isMelee ? `${ammo} / ${maxAmmo} Treffer` : `${displayAmmo} / ${displayMax}`}
            </div>
          </div>

          {creditsEarned > 0 && (
            <div>
              <div style={{ color: '#445566', fontSize: 10, letterSpacing: 2 }}>CREDITS</div>
              <div style={{ color: '#ffaa00', fontSize: 13, fontWeight: 'bold' }}>+{creditsEarned}</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <AudioRecButton />
            <RecButton />
            <div style={{ color: '#223333', fontSize: 9, letterSpacing: 1 }}>{fps} FPS</div>
          </div>
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

      {/* Weapon slots bar — portrait: left side vertical · landscape: bottom horizontal */}
      {isPortrait ? (
        /* ── Portrait: vertical list on left ── */
        <div style={{
          position: 'absolute',
          top: '50%', left: 'max(8px, env(safe-area-inset-left, 8px))',
          transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 2,
          pointerEvents: 'auto',
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((slot) => {
            const slotWeapons  = WEAPON_SLOT_WEAPONS[slot] ?? []
            const ownedInSlot  = slotWeapons.filter(w => ownedWeapons.includes(w))
            const isActiveSlot = activeSlot === slot
            const displayW: WeaponId | undefined = isActiveSlot && ownedInSlot.includes(selectedWeapon)
              ? selectedWeapon : ownedInSlot[0]
            const hasWeapons   = ownedInSlot.length > 0
            const active       = displayW === selectedWeapon && isActiveSlot
            const slotAmmo     = displayW ? (active ? ammo : (weaponAmmo.get(displayW) ?? 0)) : 0
            const slotMaxAmmo  = displayW ? Math.max(1, WEAPON_CONFIGS[displayW].baseAmmo) : 1
            const ap           = Math.min(1, slotAmmo / slotMaxAmmo)
            const reloading    = active && reloadTimer > 0
            const reloadPct    = reloading ? 1 - reloadTimer / WEAPON_CONFIGS[selectedWeapon].reloadTime : 1
            return (
              <div key={slot} style={{
                display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5,
                padding: '3px 7px',
                background: active ? '#00aaff18' : isActiveSlot ? '#ffffff06' : hasWeapons ? '#ffffff04' : 'transparent',
                border: `1px solid ${active ? '#00aaff88' : isActiveSlot ? '#334466' : hasWeapons ? '#1a2a2a' : '#111'}`,
                borderRadius: 3, opacity: hasWeapons ? 1 : 0.18,
              }}>
                <div style={{ color: isActiveSlot ? '#556688' : '#2a3a44', fontSize: 8, width: 8, flexShrink: 0 }}>
                  {slot === 0 ? '0' : slot}
                </div>
                <div style={{ color: active ? '#00ccff' : isActiveSlot ? '#4488aa' : '#334455', fontSize: 9, fontWeight: active ? 'bold' : 'normal', width: 46, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {displayW ? WEAPON_CONFIGS[displayW].shortName : '—'}
                </div>
                {displayW && (
                  <>
                    <div style={{ width: 40, height: 3, background: '#111', borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ height: '100%', width: `${(reloading ? reloadPct : ap) * 100}%`, background: reloading ? '#ffcc00' : ap > 0.3 ? '#00ccff' : '#ff4400', transition: 'width 0.05s' }} />
                    </div>
                    <div style={{ color: reloading ? '#ffcc00' : ap > 0 ? '#445566' : '#ff3300', fontSize: 8, width: 20, textAlign: 'right', flexShrink: 0 }}>
                      {reloading ? '…' : slotAmmo}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Landscape: horizontal bar at bottom ── */
        <div style={{
          position: 'absolute',
          bottom: 'max(10px, calc(env(safe-area-inset-bottom, 0px) + 10px))',
          left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 4, alignItems: 'flex-end',
          pointerEvents: 'auto',
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((slot) => {
            const slotWeapons  = WEAPON_SLOT_WEAPONS[slot] ?? []
            const ownedInSlot  = slotWeapons.filter(w => ownedWeapons.includes(w))
            const isActiveSlot = activeSlot === slot
            const displayW: WeaponId | undefined = isActiveSlot && ownedInSlot.includes(selectedWeapon)
              ? selectedWeapon : ownedInSlot[0]
            const hasWeapons   = ownedInSlot.length > 0
            const active       = displayW === selectedWeapon && isActiveSlot
            const slotAmmo     = displayW ? (active ? ammo : (weaponAmmo.get(displayW) ?? 0)) : 0
            const slotMaxAmmo  = displayW ? Math.max(1, WEAPON_CONFIGS[displayW].baseAmmo) : 1
            const ap           = Math.min(1, slotAmmo / slotMaxAmmo)
            const reloading    = active && reloadTimer > 0
            const reloadPct    = reloading ? 1 - reloadTimer / WEAPON_CONFIGS[selectedWeapon].reloadTime : 1
            const slotColor    = isActiveSlot ? '#00aaff' : '#223344'
            return (
              <div key={slot} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '4px 6px',
                background: active ? '#00aaff18' : isActiveSlot ? '#ffffff06' : hasWeapons ? '#ffffff05' : 'transparent',
                border: `1px solid ${active ? '#00aaff88' : isActiveSlot ? '#334466' : hasWeapons ? '#1a2a2a' : '#111'}`,
                borderRadius: 3, minWidth: 44,
                opacity: hasWeapons ? 1 : 0.2,
              }}>
                <div style={{ color: isActiveSlot ? '#556688' : '#334455', fontSize: 8, letterSpacing: 1 }}>
                  {slot === 0 ? '0' : slot}
                </div>
                {displayW ? (
                  <>
                    <div style={{ color: active ? '#00ccff' : isActiveSlot ? '#4488aa' : '#445566', fontSize: 10, fontWeight: active ? 'bold' : 'normal', letterSpacing: 1, whiteSpace: 'nowrap' }}>
                      {WEAPON_CONFIGS[displayW].shortName}
                    </div>
                    {ownedInSlot.length > 1 && (
                      <div style={{ color: slotColor, fontSize: 7, opacity: 0.6 }}>{'·'.repeat(ownedInSlot.length)}</div>
                    )}
                    <div style={{ width: '100%', height: 3, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${ap * 100}%`, background: ap > 0.3 ? '#00ccff' : '#ff4400', transition: 'width 0.05s' }} />
                    </div>
                    {reloading && (
                      <div style={{ width: '100%', height: 2, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${reloadPct * 100}%`, background: '#ffcc00', transition: 'width 0.05s' }} />
                      </div>
                    )}
                    <div style={{ color: reloading ? '#ffcc00' : ap > 0 ? '#445566' : '#ff3300', fontSize: 8 }}>
                      {reloading ? 'LADEN' : `${slotAmmo}`}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#1a2233', fontSize: 9 }}>—</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <P2Panel />

      {/* ── Enemy direction markers (off-screen) ────────────────────────────── */}
      {showEnemyMarkers && enemyMarkers.filter(m => !m.inView).map(m => {
        const EDGE = 0.07
        const dx = m.screenX - 0.5
        const dy = m.screenY - 0.5
        const scale = Math.max(Math.abs(dx), Math.abs(dy))
        if (scale < 0.001) return null
        const ex = (0.5 + (dx / scale) * (0.5 - EDGE)) * 100
        const ey = (0.5 + (dy / scale) * (0.5 - EDGE)) * 100
        const rot = (m.angle * 180 / Math.PI) + 90
        return (
          <div
            key={m.id}
            style={{
              position: 'absolute',
              left: `${ex}%`,
              top:  `${ey}%`,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              color: '#ff3322',
              fontSize: 14,
              lineHeight: 1,
              textShadow: '0 0 6px #ff0000',
              opacity: 0.85,
              pointerEvents: 'none',
            }}
          >
            ▲
          </div>
        )
      })}

      {/* ── Minimap ─────────────────────────────────────────────────────────── */}
      {showMinimap && (
        <canvas
          ref={minimapRef}
          width={120}
          height={120}
          style={{
            position: 'absolute',
            bottom: 'max(70px, calc(env(safe-area-inset-bottom, 0px) + 70px))' as never,
            right: 20,
            width: 120,
            height: 120,
            borderRadius: 4,
            border: '1px solid #1a2a3a',
            opacity: 0.88,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
