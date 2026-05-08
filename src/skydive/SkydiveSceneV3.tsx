import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'
import { getSkydiveResult, setSkydiveResult } from './skydiveResultStore'
import { startSkydiveMusic, stopMusic } from '../game/music'
import { playHit, playDeath, playPickup, playPistol } from '../game/sounds'
import { WEAPON_CONFIGS } from '../game/types'
import type { WeaponId } from '../game/types'

// ── Map ────────────────────────────────────────────────────────────────────────
// 0=floor  1=wall  2=enemy-spawn  3=exit
const MAP_W = 14
const MAP_H = 15
const MAP = [
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,2,0,0,0,0,0,0,0,0,2,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,1,1,1,0,1,1,1,1,1,0,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,2,0,0,0,2,0,2,0,0,2,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,1,0,1,1,1,0,1,0,1,1,1,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,2,0,0,0,0,0,0,0,0,2,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,1,1,1,1,0,1,1,1,0,1,1,1,1,
  1,0,0,0,0,0,3,0,0,0,0,0,0,1,  // 3 = exit
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,
]

// ── Constants ─────────────────────────────────────────────────────────────────
const FOV       = Math.PI / 2.4   // ~75°
const MOVE_SPD  = 3.8
const ROT_SPD   = 2.4
const P_COL_R   = 0.22
const E_DETECT  = 6.5             // enemy sight range
const E_FIRE    = 2.2             // seconds between enemy shots
const DMG_ENEMY = 20
const INV_DUR   = 0.6

// ── Types ─────────────────────────────────────────────────────────────────────
interface Enemy {
  x: number; y: number; hp: number; active: boolean
  shootTimer: number; hitFlash: number
}

interface GS {
  x: number; y: number; angle: number
  health: number; ammo: number
  weapon: WeaponId; weaponIdx: number
  invTimer: number; shootTimer: number; muzzleFlash: number
  phase: 'playing' | 'dead' | 'won'
  kills: number; done: boolean
}

// ── Solid check ───────────────────────────────────────────────────────────────
function solid(x: number, y: number): boolean {
  const mx = Math.floor(x); const my = Math.floor(y)
  if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) return true
  const t = MAP[my * MAP_W + mx]
  return t === 1
}

function tileAt(x: number, y: number): number {
  const mx = Math.floor(x); const my = Math.floor(y)
  if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) return 1
  return MAP[my * MAP_W + mx]
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SkydiveSceneV3() {
  const setPhase    = useGameStore((s) => s.setPhase)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const [started,   setStarted]   = useState(false)
  const [countdown, setCountdown] = useState(0)

  function startGame() {
    setCountdown(3)
    let n = 3
    const t = setInterval(() => {
      n--
      if (n > 0) setCountdown(n)
      else { clearInterval(t); setCountdown(0); setStarted(true) }
    }, 1000)
  }

  useEffect(() => {
    if (!started) return
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')!

    // Collect weapons from previous skydive (V2), fallback pistol
    const prev    = getSkydiveResult()
    const weapons: WeaponId[] = prev.weapons.length > 0
      ? ['pistol', ...prev.weapons.filter(w => w !== 'pistol')]
      : ['pistol']

    const gs: GS = {
      x: 1.5, y: 1.5, angle: Math.PI * 0.45,
      health: 100,
      ammo:   WEAPON_CONFIGS[weapons[0]].baseAmmo,
      weapon: weapons[0], weaponIdx: 0,
      invTimer: 0, shootTimer: 0, muzzleFlash: 0,
      phase: 'playing', kills: 0, done: false,
    }

    const enemies: Enemy[] = MAP.flatMap((tile, idx) => {
      if (tile !== 2) return []
      const ex = (idx % MAP_W) + 0.5
      const ey = Math.floor(idx / MAP_W) + 0.5
      return [{ x: ex, y: ey, hp: 2, active: true, shootTimer: E_FIRE * Math.random(), hitFlash: 0 }]
    })

    const keys = new Set<string>()
    function onDown(e: KeyboardEvent) {
      keys.add(e.code)
      if (e.code === 'Space' || e.code === 'KeyE') shoot()
      if ((e.code === 'KeyQ' || e.code === 'Tab') && !e.repeat) {
        e.preventDefault()
        gs.weaponIdx = (gs.weaponIdx + 1) % weapons.length
        gs.weapon    = weapons[gs.weaponIdx]
        gs.ammo      = WEAPON_CONFIGS[gs.weapon].baseAmmo
      }
    }
    function onUp(e: KeyboardEvent) { keys.delete(e.code) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup',   onUp)

    let cw = 1, ch = 1
    const zbuf: number[] = []
    function resize() {
      cw = canvas.offsetWidth  || 480
      ch = canvas.offsetHeight || 640
      canvas.width = cw; canvas.height = ch
      zbuf.length = cw; zbuf.fill(0)
    }
    resize()
    window.addEventListener('resize', resize)

    startSkydiveMusic()

    let raf: number
    let last = performance.now()

    function tick() {
      const now = performance.now()
      const dt  = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!gs.done) update(dt)
      draw()
      raf = requestAnimationFrame(tick)
    }

    // ── Shoot ────────────────────────────────────────────────────────────────
    function shoot() {
      if (gs.phase !== 'playing') return
      if (gs.ammo <= 0 || gs.shootTimer > 0) return
      gs.ammo--
      gs.shootTimer   = WEAPON_CONFIGS[gs.weapon].shootCooldown
      gs.muzzleFlash  = 0.08
      playPistol(0.55)

      // Hitscan: find nearest enemy near crosshair
      let nearest: Enemy | null = null
      let nearDist = Infinity
      const HALF_ARC = 0.14   // ~8° tolerance

      for (const e of enemies) {
        if (!e.active) continue
        const dx  = e.x - gs.x; const dy = e.y - gs.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const ang  = Math.atan2(dy, dx)
        let   diff = ang - gs.angle
        while (diff >  Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        if (Math.abs(diff) < HALF_ARC && dist < nearDist && hasLOS(gs.x, gs.y, e.x, e.y)) {
          nearDist = dist; nearest = e
        }
      }

      if (nearest) {
        const dmg = WEAPON_CONFIGS[gs.weapon].baseDamage * (WEAPON_CONFIGS[gs.weapon].pellets ?? 1)
        nearest.hp      -= Math.max(1, dmg)
        nearest.hitFlash = 0.14
        if (nearest.hp <= 0) {
          nearest.active = false; gs.kills++
          playDeath(0.4)
        } else {
          playHit(0.6)
        }
      }
    }

    // ── Line-of-sight check ──────────────────────────────────────────────────
    function hasLOS(ax: number, ay: number, bx: number, by: number): boolean {
      const steps = Math.ceil(Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2) * 8)
      for (let i = 1; i < steps; i++) {
        const t  = i / steps
        const tx = ax + (bx - ax) * t; const ty = ay + (by - ay) * t
        if (solid(tx, ty)) return false
      }
      return true
    }

    // ── Update ───────────────────────────────────────────────────────────────
    function update(dt: number) {
      gs.invTimer    = Math.max(0, gs.invTimer    - dt)
      gs.shootTimer  = Math.max(0, gs.shootTimer  - dt)
      gs.muzzleFlash = Math.max(0, gs.muzzleFlash - dt)

      // Rotation
      if (keys.has('ArrowLeft')  || keys.has('KeyA')) gs.angle -= ROT_SPD * dt
      if (keys.has('ArrowRight') || keys.has('KeyD')) gs.angle += ROT_SPD * dt

      // Movement
      const spd   = MOVE_SPD * dt
      const dirX  = Math.cos(gs.angle); const dirY = Math.sin(gs.angle)
      const sideX = -dirY;              const sideY = dirX

      let moveX = 0, moveY = 0
      if (keys.has('KeyW') || keys.has('ArrowUp'))   { moveX += dirX  * spd; moveY += dirY  * spd }
      if (keys.has('KeyS') || keys.has('ArrowDown')) { moveX -= dirX  * spd; moveY -= dirY  * spd }
      if (keys.has('KeyQ')) { moveX -= sideX * spd * 0.7; moveY -= sideY * spd * 0.7 }
      if (keys.has('KeyE') && !keys.has('Space')) {
        moveX += sideX * spd * 0.7; moveY += sideY * spd * 0.7
      }

      if (!solid(gs.x + moveX + Math.sign(moveX) * P_COL_R, gs.y)) gs.x += moveX
      if (!solid(gs.x, gs.y + moveY + Math.sign(moveY) * P_COL_R)) gs.y += moveY

      // Exit check
      if (tileAt(gs.x, gs.y) === 3) {
        gs.done = true; gs.phase = 'won'
        setSkydiveResult({
          kills:           gs.kills,
          weapons:         weapons,
          healthRemaining: Math.max(0, gs.health),
          survived:        true,
          difficulty:      prev.difficulty,
        })
        setTimeout(() => { stopMusic(); setPhase('skydive_win') }, 800)
        return
      }

      // Enemy updates
      for (const e of enemies) {
        if (!e.active) continue
        e.hitFlash = Math.max(0, e.hitFlash - dt)
        const dx   = gs.x - e.x; const dy = gs.y - e.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Shoot at player if in range + LOS
        if (dist < E_DETECT && hasLOS(e.x, e.y, gs.x, gs.y)) {
          e.shootTimer -= dt
          if (e.shootTimer <= 0) {
            e.shootTimer = E_FIRE
            if (gs.invTimer <= 0) {
              gs.health -= DMG_ENEMY; gs.invTimer = INV_DUR
              if (gs.health <= 0) {
                gs.health = 0; gs.done = true; gs.phase = 'dead'
                setSkydiveResult({ kills: gs.kills, weapons, healthRemaining: 0, survived: false, difficulty: prev.difficulty })
                setTimeout(() => { stopMusic(); setPhase('skydive_win') }, 1400)
                return
              }
            }
          }
        }
      }

      // Pickup ammo when out (auto-reload after walking a bit — grace mechanic)
      if (gs.ammo <= 0 && gs.shootTimer <= 0) {
        gs.ammo = Math.floor(WEAPON_CONFIGS[gs.weapon].baseAmmo * 0.4)
        playPickup()
      }
    }

    // ── Draw ─────────────────────────────────────────────────────────────────
    function draw() {
      ctx.clearRect(0, 0, cw, ch)

      // Ceiling & floor
      const ceiling = ctx.createLinearGradient(0, 0, 0, ch / 2)
      ceiling.addColorStop(0, '#040804')
      ceiling.addColorStop(1, '#0c1208')
      ctx.fillStyle = ceiling
      ctx.fillRect(0, 0, cw, ch / 2)

      const floor = ctx.createLinearGradient(0, ch / 2, 0, ch)
      floor.addColorStop(0, '#0e0c08')
      floor.addColorStop(1, '#060604')
      ctx.fillStyle = floor
      ctx.fillRect(0, ch / 2, cw, ch / 2)

      const dirX   = Math.cos(gs.angle); const dirY   = Math.sin(gs.angle)
      const plLen  = Math.tan(FOV / 2)
      const plX    = -dirY * plLen;       const plY    =  dirX * plLen

      // ── Raycasting ────────────────────────────────────────────────────────
      const t = performance.now() / 1000
      for (let col = 0; col < cw; col++) {
        const camX   = 2 * col / cw - 1
        const rayDX  = dirX + plX * camX
        const rayDY  = dirY + plY * camX

        let mx = Math.floor(gs.x); let my = Math.floor(gs.y)
        const ddx = rayDX === 0 ? 1e30 : Math.abs(1 / rayDX)
        const ddy = rayDY === 0 ? 1e30 : Math.abs(1 / rayDY)
        const sx = rayDX < 0 ? -1 : 1; const sy = rayDY < 0 ? -1 : 1
        let sdx = rayDX < 0 ? (gs.x - mx) * ddx : (mx + 1 - gs.x) * ddx
        let sdy = rayDY < 0 ? (gs.y - my) * ddy : (my + 1 - gs.y) * ddy

        let side = 0; let hitTile = 1; let steps = 0
        while (steps++ < 48) {
          if (sdx < sdy) { sdx += ddx; mx += sx; side = 0 }
          else           { sdy += ddy; my += sy; side = 1 }
          const tile = tileAt(mx, my)
          if (tile === 1 || tile === 3) { hitTile = tile; break }
        }

        const wallDist = side === 0 ? sdx - ddx : sdy - ddy
        zbuf[col] = wallDist

        const lineH = Math.round(ch / wallDist)
        const y0    = Math.max(0, Math.floor(ch / 2 - lineH / 2))
        const y1    = Math.min(ch, Math.ceil(ch / 2 + lineH / 2))

        if (hitTile === 3) {
          // Exit: orange glow
          const pulse = 0.65 + 0.35 * Math.sin(t * 3)
          const bright = Math.min(1, 3.5 / wallDist) * pulse
          const r = Math.round(224 * bright); const g = Math.round(84 * bright); const b = Math.round(24 * bright)
          ctx.fillStyle = `rgb(${r},${g},${b})`
        } else {
          // Regular wall: olive tones, side dimming + distance fog
          const fog    = Math.min(1, 3.0 / wallDist)
          const dimmed = side === 1 ? fog * 0.62 : fog
          const v = Math.round(48 * dimmed)
          ctx.fillStyle = `rgb(${v},${Math.round(v*1.15)},${Math.round(v*0.65)})`
        }
        ctx.fillRect(col, y0, 1, y1 - y0)
      }

      // ── Enemy sprites ─────────────────────────────────────────────────────
      const sorted = enemies
        .filter(e => e.active)
        .map(e => ({ e, d2: (e.x - gs.x) ** 2 + (e.y - gs.y) ** 2 }))
        .sort((a, b) => b.d2 - a.d2)

      const invDet = 1 / (plX * dirY - dirX * plY)

      for (const { e } of sorted) {
        const dx  = e.x - gs.x; const dy = e.y - gs.y
        const trX = invDet * (dirY * dx - dirX * dy)
        const trY = invDet * (-plY * dx + plX * dy)
        if (trY <= 0.1) continue

        const scrX  = Math.floor(cw / 2 * (1 + trX / trY))
        const sprH  = Math.abs(Math.floor(ch / trY)) | 0
        const sprW  = Math.floor(sprH * 0.6)
        const drawX0 = Math.floor(scrX - sprW / 2)
        const drawX1 = Math.floor(scrX + sprW / 2)
        const drawY0 = Math.floor(ch / 2 - sprH / 2)

        const fog     = Math.min(1, 3.0 / trY)
        const isFlash = e.hitFlash > 0

        for (let sx = Math.max(0, drawX0); sx < Math.min(cw, drawX1); sx++) {
          if (zbuf[sx] < trY) continue
          const fx = (sx - drawX0) / sprW
          if (fx < 0.12 || fx > 0.88) continue

          // Body (60-90% height)
          const bodyR = isFlash ? 255 : Math.round(180 * fog)
          const bodyG = isFlash ? 255 : Math.round(40  * fog)
          const bodyB = isFlash ? 255 : Math.round(30  * fog)
          ctx.fillStyle = `rgb(${bodyR},${bodyG},${bodyB})`
          ctx.fillRect(sx, Math.max(0, drawY0 + sprH * 0.25), 1,
            Math.min(ch, drawY0 + sprH * 0.92) - Math.max(0, drawY0 + sprH * 0.25))

          // Head
          if (fx > 0.2 && fx < 0.8) {
            const hR = isFlash ? 255 : Math.round(140 * fog)
            ctx.fillStyle = `rgb(${hR},${Math.round(hR*0.7)},${Math.round(hR*0.55)})`
            ctx.fillRect(sx, Math.max(0, drawY0 + sprH * 0.05), 1,
              Math.min(ch, drawY0 + sprH * 0.28) - Math.max(0, drawY0 + sprH * 0.05))
          }
        }
      }

      drawHUD(ctx)
      if (gs.phase === 'dead') drawFlash(ctx, 'rgba(120,0,0,0.5)', 'TOT')
      if (gs.phase === 'won')  drawFlash(ctx, 'rgba(0,70,10,0.45)', 'ENTKOMMEN')
    }

    // ── HUD ──────────────────────────────────────────────────────────────────
    function drawHUD(ctx: CanvasRenderingContext2D) {
      // Health bar — top left
      const hf   = Math.max(0, gs.health / 100)
      const hbw  = Math.min(160, cw * 0.38)
      const hc   = hf > 0.5 ? '#00cc44' : hf > 0.25 ? '#ffaa00' : '#ff3300'
      ctx.fillStyle = 'rgba(0,0,0,0.55)';  ctx.fillRect(12, 12, hbw + 4, 14)
      ctx.fillStyle = '#1a1a1a';            ctx.fillRect(14, 14, hbw, 10)
      ctx.fillStyle = hc;                   ctx.fillRect(14, 14, hbw * hf, 10)
      ctx.fillStyle = hc; ctx.font = '9px monospace'; ctx.textAlign = 'left'
      ctx.fillText(`HP ${gs.health}`, 14, 38)

      // Weapon + ammo — bottom center
      const wCfg   = WEAPON_CONFIGS[gs.weapon]
      const wLabel = `${wCfg.shortName}  ${gs.ammo}`
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      const tw = ctx.measureText(wLabel).width + 28
      ctx.fillRect(cw / 2 - tw / 2, ch - 36, tw, 22)
      ctx.fillStyle = gs.ammo > 0 ? '#e05418' : '#ff3300'
      ctx.font = '12px monospace'; ctx.textAlign = 'center'
      ctx.fillText(wLabel, cw / 2, ch - 20)

      // Weapon switch hint
      if (weapons.length > 1) {
        ctx.fillStyle = '#2a3a1a'; ctx.font = '9px monospace'
        ctx.fillText('[Q/TAB] WECHSELN', cw / 2, ch - 8)
      }

      // Kills — top right
      if (gs.kills > 0) {
        ctx.fillStyle = '#8a9a62'; ctx.font = '10px monospace'; ctx.textAlign = 'right'
        ctx.fillText(`${gs.kills}✗`, cw - 14, 26)
      }

      // Crosshair
      ctx.strokeStyle = gs.muzzleFlash > 0 ? '#ffee00' : 'rgba(255,255,255,0.6)'
      ctx.lineWidth   = 1
      const cx2 = cw / 2, cy2 = ch / 2, cs = 8
      ctx.beginPath()
      ctx.moveTo(cx2 - cs, cy2); ctx.lineTo(cx2 - 3, cy2)
      ctx.moveTo(cx2 + 3,  cy2); ctx.lineTo(cx2 + cs, cy2)
      ctx.moveTo(cx2, cy2 - cs); ctx.lineTo(cx2, cy2 - 3)
      ctx.moveTo(cx2, cy2 + 3);  ctx.lineTo(cx2, cy2 + cs)
      ctx.stroke()

      // Muzzle flash
      if (gs.muzzleFlash > 0) {
        const gr = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, 32)
        gr.addColorStop(0, 'rgba(255,220,80,0.7)')
        gr.addColorStop(1, 'rgba(255,100,0,0)')
        ctx.fillStyle = gr; ctx.fillRect(cx2 - 32, cy2 - 32, 64, 64)
      }

      // Minimap — top right corner
      const mmS = 5; const mmX = cw - 14 - MAP_W * mmS; const mmY = 36
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(mmX - 2, mmY - 2, MAP_W * mmS + 4, MAP_H * mmS + 4)
      for (let my = 0; my < MAP_H; my++) {
        for (let mx = 0; mx < MAP_W; mx++) {
          const tile = MAP[my * MAP_W + mx]
          if (tile === 1) ctx.fillStyle = '#3a4a2a'
          else if (tile === 3) ctx.fillStyle = '#e05418'
          else ctx.fillStyle = '#101408'
          ctx.fillRect(mmX + mx * mmS, mmY + my * mmS, mmS - 1, mmS - 1)
        }
      }
      // Enemies on minimap
      for (const e of enemies) {
        if (!e.active) continue
        ctx.fillStyle = '#cc2222'
        ctx.fillRect(mmX + e.x * mmS - 1, mmY + e.y * mmS - 1, 3, 3)
      }
      // Player on minimap
      ctx.fillStyle = '#00ccdd'
      ctx.fillRect(mmX + gs.x * mmS - 2, mmY + gs.y * mmS - 2, 4, 4)
      // Direction indicator
      ctx.strokeStyle = '#00ccdd'; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(mmX + gs.x * mmS, mmY + gs.y * mmS)
      ctx.lineTo(mmX + (gs.x + Math.cos(gs.angle) * 1.5) * mmS, mmY + (gs.y + Math.sin(gs.angle) * 1.5) * mmS)
      ctx.stroke()
    }

    function drawFlash(ctx: CanvasRenderingContext2D, overlay: string, text: string) {
      ctx.fillStyle = overlay; ctx.fillRect(0, 0, cw, ch)
      ctx.fillStyle = '#ffffff'; ctx.font = `bold ${Math.round(cw * 0.1)}px monospace`
      ctx.textAlign = 'center'; ctx.fillText(text, cw / 2, ch / 2)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      stopMusic()
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup',   onUp)
      window.removeEventListener('resize',  resize)
    }
  }, [started]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {!started && countdown === 0 && (
        <IntroOverlay onStart={startGame} />
      )}
      {countdown > 0 && (
        <div style={{ ...OVERLAY, pointerEvents: 'none' }}>
          <div style={{ color: '#e05418', fontSize: 96, fontWeight: 700, textShadow: '0 0 40px #e0541888' }}>
            {countdown}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

const OVERLAY: CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  fontFamily: '"Share Tech Mono", "Courier New", monospace',
  userSelect: 'none',
}

function IntroOverlay({ onStart }: { onStart: () => void }) {
  const prev = getSkydiveResult()
  const hasWeapons = prev.weapons.length > 0

  return (
    <div style={{
      ...OVERLAY,
      background: 'radial-gradient(ellipse at 50% 30%, rgba(20,28,14,0.97) 0%, rgba(6,8,5,1) 65%)',
    }}>
      <div style={{ color: '#4a5a32', fontSize: 11, letterSpacing: 8, marginBottom: 12 }}>SKYDIVE 3 · ALPHA</div>
      <div style={{
        color: '#e05418', fontSize: 36, fontWeight: 700, letterSpacing: 4, marginBottom: 6,
        textShadow: '0 0 24px #e0541866',
      }}>
        AFTERMATH
      </div>
      <div style={{ color: '#2a3a1a', fontSize: 10, letterSpacing: 4, marginBottom: 40 }}>
        INFILTRATIONS-ZONE · RÄUM DAS GEBÄUDE
      </div>

      {hasWeapons && (
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ color: '#3a4a2a', fontSize: 9, letterSpacing: 5, marginBottom: 10 }}>
            AUSRÜSTUNG AUS DEM ABSPRUNG
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {['pistol' as const, ...prev.weapons].map(w => (
              <div key={w} style={{
                padding: '5px 10px', background: 'rgba(224,84,24,0.08)',
                border: '1px solid #e05418', color: '#e05418', fontSize: 10, letterSpacing: 2,
              }}>
                {WEAPON_CONFIGS[w]?.shortName ?? w.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onStart}
        style={{
          background: 'rgba(224,84,24,0.12)', border: '2px solid #e05418',
          color: '#e05418', padding: '16px 40px', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 14, letterSpacing: 6,
          transition: 'all 0.15s', marginBottom: 32,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,84,24,0.25)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(224,84,24,0.12)'; e.currentTarget.style.color = '#e05418' }}
      >
        EINDRINGEN
      </button>

      <div style={{ color: '#1a2a12', fontSize: 9, letterSpacing: 3, lineHeight: 2, textAlign: 'center' }}>
        W/S GEHEN · A/D DREHEN · Q/TAB WAFFE · SPACE/E SCHUSS
      </div>
    </div>
  )
}

