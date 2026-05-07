import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'
import { setSkydiveResult } from './skydiveResultStore'
import { startSkydiveMusic, stopMusic } from '../game/music'
import { playHit, playDeath, playPickup } from '../game/sounds'
import type { WeaponId } from '../game/types'

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_ALT  = 3000
const CHUTE_ALT  = 380    // altitude at which parachute window opens
const ARENA_HALF = 400    // half-width of arena in world units
const BASE_SPD   = 110    // alt/s freefall
const DIVE_SPD   = 280    // alt/s when W held
const BRAKE_SPD  = 28     // alt/s when S held
const CHUTE_SPD  = 42     // alt/s with chute deployed
const LAT_SPD    = 200    // world units/s lateral
const P_RAD      = 16
const E_RAD      = 18
const CRATE_RAD  = 30
const B_RAD      = 6
const P_BSPD     = 520
const E_BSPD     = 300
const BLIFE      = 3.0
const E_FIRE     = 1.8
const E_SPD      = 90
const DMG_EB     = 18
const DMG_CT     = 12
const INV_DUR    = 0.75

// ── Time Machine layer config ──────────────────────────────────────────────────
// Layer 0 = top/smallest/furthest preview, Layer 4 = bottom/largest/player layer
// altBelow: how many altitude units BELOW the player this layer shows
const LAYER_W    = [0.24, 0.34, 0.48, 0.65, 0.96]  // width fraction of canvas
const LAYER_H    = [0.042, 0.054, 0.073, 0.102, 0]  // height fraction (0 = remaining)
const LAYER_DALT = [1800,  1200,  700,   320,   0]   // altitude units below player

// ── Fixed game objects ────────────────────────────────────────────────────────
const WEAPON_CRATES: { x: number; alt: number; weapon: WeaponId }[] = [
  { x: -220, alt: 2620, weapon: 'smg'     },
  { x:  270, alt: 2130, weapon: 'shotgun' },
  { x:  -70, alt: 1620, weapon: 'rifle'   },
  { x:  190, alt: 1110, weapon: 'm16'     },
  { x: -290, alt: 660,  weapon: 'mp5'     },
  { x:  110, alt: 340,  weapon: 'blaster' },
]

const ENEMY_SPAWNS: { x: number; alt: number }[] = [
  { x: -180, alt: 2400 },
  { x:  260, alt: 1900 },
  { x:  -40, alt: 1400 },
  { x:  200, alt: 950  },
  { x: -250, alt: 490  },
]

const W_LABEL: Partial<Record<WeaponId, string>> = {
  smg: 'SMG', shotgun: 'SPAS', rifle: 'G36', m16: 'M16', mp5: 'MP5K', blaster: 'BLST',
}

// ── Layer rect helper ─────────────────────────────────────────────────────────
function layerRects(cw: number, ch: number) {
  const GAP  = 3
  const recs: { x: number; y: number; w: number; h: number }[] = []
  let   curY = 0
  for (let i = 0; i < 4; i++) {
    const lw = LAYER_W[i] * cw
    const lh = LAYER_H[i] * ch
    recs.push({ x: (cw - lw) / 2, y: curY, w: lw, h: lh })
    curY += lh + GAP
  }
  const plw = LAYER_W[4] * cw
  recs.push({ x: (cw - plw) / 2, y: curY, w: plw, h: ch - curY })
  return recs
}

// ── Component ─────────────────────────────────────────────────────────────────
type UIPhase = 'select' | 'countdown' | 'go' | 'playing'

export function SkydiveScene() {
  const setPhase = useGameStore((s) => s.setPhase)

  const [uiPhase,  setUIPhase]  = useState<UIPhase>('select')
  const [countN,   setCountN]   = useState(3)
  const [showJump, setShowJump] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const diffRef   = useRef<'easy' | 'hard'>('easy')

  function chooseDiff(d: 'easy' | 'hard') {
    diffRef.current = d
    setUIPhase('countdown')
    setCountN(3)
    let n = 3
    const t = setInterval(() => {
      n--
      if (n > 0) {
        setCountN(n)
      } else {
        clearInterval(t)
        setShowJump(true)
        setUIPhase('go')
        setTimeout(() => { setShowJump(false); setUIPhase('playing') }, 800)
      }
    }, 1000)
  }

  // ── Game loop (runs when uiPhase becomes 'playing') ───────────────────────
  useEffect(() => {
    if (uiPhase !== 'playing') return
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    // Mutable game state
    const gs = {
      alt: TOTAL_ALT, px: 0, health: 100, invTimer: 0,
      spd: BASE_SPD, shootTimer: 0, kills: 0,
      weapons: [] as WeaponId[],
      phase: 'diving' as 'diving' | 'chute_warning' | 'deployed' | 'dead' | 'won',
      timingPos: 0, timingDir: 1 as 1 | -1,
      done: false,
    }

    const enemies = ENEMY_SPAWNS.map(sp => ({
      active: false, spawned: false,
      x: sp.x, spawnAlt: sp.alt, hp: 2,
      shootTimer: E_FIRE, hitFlash: 0,
    }))

    const crates = WEAPON_CRATES.map(c => ({ ...c, collected: false }))

    const bullets: {
      active: boolean; x: number; alt: number
      vx: number; valt: number; life: number; isEnemy: boolean
    }[] = Array.from({ length: 24 }, () => ({
      active: false, x: 0, alt: 0, vx: 0, valt: 0, life: 0, isEnemy: false,
    }))

    // Input
    const keys = new Set<string>()
    function onDown(e: KeyboardEvent) {
      keys.add(e.code)
      if ((e.code === 'Space' || e.code === 'KeyF') && gs.phase === 'chute_warning') {
        pullChute()
      }
    }
    function onUp(e: KeyboardEvent) { keys.delete(e.code) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup',   onUp)

    // Canvas sizing
    let cw = 1, ch = 1
    function resize() {
      cw = canvas.offsetWidth  || 400
      ch = canvas.offsetHeight || 700
      canvas.width  = cw
      canvas.height = ch
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

    // ── Parachute deploy ────────────────────────────────────────────────────
    function pullChute() {
      gs.phase = 'deployed'
      if (diffRef.current === 'hard' && (gs.timingPos < 0.38 || gs.timingPos > 0.62)) {
        gs.health = Math.max(0, gs.health - 35)
        if (gs.health <= 0) { die(); return }
      }
      playPickup()
    }

    function spawnBullet(x: number, alt: number, vx: number, valt: number, isEnemy: boolean) {
      for (const b of bullets) {
        if (!b.active) { Object.assign(b, { active: true, x, alt, vx, valt, life: BLIFE, isEnemy }); return }
      }
    }

    function die() {
      if (gs.done) return
      gs.done = true; gs.phase = 'dead'
      setSkydiveResult({
        kills: gs.kills, weapons: gs.weapons,
        healthRemaining: 0, survived: false, difficulty: diffRef.current,
      })
      setTimeout(() => { stopMusic(); setPhase('skydive_win') }, 1400)
    }

    function land() {
      if (gs.done) return
      gs.done = true; gs.phase = 'won'
      setSkydiveResult({
        kills: gs.kills, weapons: gs.weapons,
        healthRemaining: Math.max(0, gs.health), survived: true, difficulty: diffRef.current,
      })
      setTimeout(() => { stopMusic(); setPhase('skydive_win') }, 1000)
    }

    // ── Update ──────────────────────────────────────────────────────────────
    function update(dt: number) {
      // Descent speed
      if (gs.phase === 'deployed') {
        gs.spd = CHUTE_SPD
      } else {
        const target = keys.has('KeyW') || keys.has('ArrowUp')   ? DIVE_SPD
          : keys.has('KeyS') || keys.has('ArrowDown') ? BRAKE_SPD : BASE_SPD
        gs.spd += (target - gs.spd) * Math.min(1, 6 * dt)
      }
      gs.alt = Math.max(0, gs.alt - gs.spd * dt)

      // Lateral movement
      if (keys.has('KeyA') || keys.has('ArrowLeft'))  gs.px -= LAT_SPD * dt
      if (keys.has('KeyD') || keys.has('ArrowRight')) gs.px += LAT_SPD * dt
      gs.px = Math.max(-ARENA_HALF + P_RAD, Math.min(ARENA_HALF - P_RAD, gs.px))

      // Phase transitions
      if (gs.phase === 'diving' && gs.alt <= CHUTE_ALT) gs.phase = 'chute_warning'

      // Hard mode timing bar
      if (gs.phase === 'chute_warning' && diffRef.current === 'hard') {
        gs.timingPos += gs.timingDir * 0.9 * dt
        if (gs.timingPos >= 1) { gs.timingPos = 1; gs.timingDir = -1 }
        if (gs.timingPos <= 0) { gs.timingPos = 0; gs.timingDir =  1 }
      }

      // Landing
      if (gs.alt <= 0) {
        if (gs.phase === 'deployed') land(); else die()
        return
      }

      gs.invTimer = Math.max(0, gs.invTimer - dt)

      // Auto-shoot nearest enemy
      gs.shootTimer = Math.max(0, gs.shootTimer - dt)
      if (gs.shootTimer <= 0) {
        let nearest: typeof enemies[0] | null = null
        let nearDist = Infinity
        for (const e of enemies) {
          if (!e.active) continue
          const dx = e.x - gs.px; const da = e.spawnAlt - gs.alt
          const d  = Math.sqrt(dx * dx + da * da)
          if (d < 650 && d < nearDist) { nearDist = d; nearest = e }
        }
        if (nearest) {
          const dx = nearest.x - gs.px; const da = nearest.spawnAlt - gs.alt
          const len = Math.sqrt(dx * dx + da * da)
          spawnBullet(gs.px, gs.alt, (dx / len) * P_BSPD, (da / len) * P_BSPD, false)
          gs.shootTimer = 0.24
        }
      }

      // Enemy updates
      for (const e of enemies) {
        if (!e.spawned && gs.alt <= e.spawnAlt + 350) { e.spawned = true; e.active = true }
        if (!e.active) continue
        e.hitFlash = Math.max(0, e.hitFlash - dt)

        // Chase laterally
        const dx = gs.px - e.x
        if (Math.abs(dx) > E_RAD) e.x += (dx / Math.abs(dx)) * E_SPD * dt

        // Shoot when player is within alt range
        const altDiff = Math.abs(e.spawnAlt - gs.alt)
        if (altDiff < 420) {
          e.shootTimer -= dt
          if (e.shootTimer <= 0) {
            e.shootTimer = E_FIRE
            const dxs = gs.px - e.x; const das = gs.alt - e.spawnAlt
            const len = Math.sqrt(dxs * dxs + das * das)
            if (len > 0.1) spawnBullet(e.x, e.spawnAlt, (dxs / len) * E_BSPD, (das / len) * E_BSPD, true)
          }
        }

        // Contact damage
        if (gs.invTimer <= 0 && altDiff < 180 && Math.abs(gs.px - e.x) < P_RAD + E_RAD) {
          gs.health -= DMG_CT; gs.invTimer = INV_DUR
          if (gs.health <= 0) { die(); return }
        }
      }

      // Bullet updates
      for (const b of bullets) {
        if (!b.active) continue
        b.x += b.vx * dt; b.alt += b.valt * dt; b.life -= dt
        if (b.life <= 0 || Math.abs(b.x) > ARENA_HALF + 100) { b.active = false; continue }

        if (!b.isEnemy) {
          for (const e of enemies) {
            if (!e.active) continue
            const dx = b.x - e.x; const da = b.alt - e.spawnAlt
            if (Math.sqrt(dx * dx + da * da) < B_RAD + E_RAD) {
              b.active = false; e.hp--; e.hitFlash = 0.12
              if (e.hp <= 0) { e.active = false; gs.kills++; playDeath(0.4) }
              else           { playHit(0.6) }
              break
            }
          }
        } else if (gs.invTimer <= 0) {
          const dx = b.x - gs.px; const da = b.alt - gs.alt
          if (Math.sqrt(dx * dx + da * da) < B_RAD + P_RAD) {
            b.active = false; gs.health -= DMG_EB; gs.invTimer = INV_DUR * 0.5
            if (gs.health <= 0) { die(); return }
          }
        }
      }

      // Crate pickups
      for (const c of crates) {
        if (c.collected) continue
        const dx = gs.px - c.x; const da = gs.alt - c.alt
        if (Math.sqrt(dx * dx + da * da) < P_RAD + CRATE_RAD) {
          c.collected = true
          if (!gs.weapons.includes(c.weapon)) gs.weapons.push(c.weapon)
          playPickup()
        }
      }
    }

    // ── Draw ────────────────────────────────────────────────────────────────
    function draw() {
      ctx.clearRect(0, 0, cw, ch)
      const bg = ctx.createRadialGradient(cw / 2, ch * 0.3, 0, cw / 2, ch * 0.3, Math.max(cw, ch) * 0.85)
      bg.addColorStop(0, '#0c140a')
      bg.addColorStop(1, '#040608')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, cw, ch)

      const recs = layerRects(cw, ch)

      // Time Machine connector lines (diagonal trapezoid outlines between layers)
      ctx.strokeStyle = '#152212'
      ctx.lineWidth   = 0.8
      for (let i = 0; i < 4; i++) {
        const r0 = recs[i]; const r1 = recs[i + 1]
        ctx.beginPath()
        ctx.moveTo(r0.x,       r0.y + r0.h); ctx.lineTo(r1.x,       r1.y)
        ctx.moveTo(r0.x + r0.w, r0.y + r0.h); ctx.lineTo(r1.x + r1.w, r1.y)
        ctx.stroke()
      }

      // Draw all layers (0 = top/small, 4 = bottom/player)
      for (let li = 0; li < 5; li++) {
        // Each layer shows the world at (playerAlt - LAYER_DALT[li]) altitude
        const layerAlt = gs.alt - LAYER_DALT[li]
        drawLayer(ctx, recs[li], layerAlt, li === 4)
      }

      drawHUD(ctx, recs[4])
      if (gs.phase === 'chute_warning') drawChuteUI(ctx, recs[4])
      if (gs.phase === 'dead')          drawFlash(ctx, 'rgba(120,0,0,0.45)', 'TOT')
      if (gs.phase === 'won')           drawFlash(ctx, 'rgba(0,80,20,0.4)',   'GELANDET')
    }

    // ── Draw a single layer ─────────────────────────────────────────────────
    function drawLayer(
      ctx: CanvasRenderingContext2D,
      r: { x: number; y: number; w: number; h: number },
      layerAlt: number,
      isPlayer: boolean,
    ) {
      const { x, y, w, h } = r
      const cx = x + w / 2
      const cy = y + h / 2
      const sc = w / (ARENA_HALF * 2)   // world → screen scale

      // Background
      ctx.fillStyle = '#08100a'
      ctx.fillRect(x, y, w, h)

      // Subtle grid (player layer only)
      if (isPlayer) {
        const step = Math.round(100 * sc)
        if (step >= 5) {
          ctx.strokeStyle = '#0e1a0c'
          ctx.lineWidth   = 0.5
          for (let gx = x + step - ((x % step + step) % step); gx < x + w; gx += step) {
            ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke()
          }
          for (let gy = y + step; gy < y + h; gy += step) {
            ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke()
          }
        }
      }

      // Border
      ctx.strokeStyle = isPlayer ? '#1e3a18' : '#0e1e0e'
      ctx.lineWidth   = isPlayer ? 1.5 : 0.5
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)

      // Visibility range: objects within this many alt-units of layerAlt are drawn
      const visR = isPlayer ? 220 : 140

      // Maps object altitude to screen Y within the player layer.
      // Objects above (higher alt than player) → bottom of layer (already passed).
      // Objects below (lower alt, upcoming)    → top of layer (approaching).
      function alty(objAlt: number): number {
        if (!isPlayer) return cy
        // upcoming (objAlt < playerAlt) → above center (smaller y)
        return cy + (objAlt - gs.alt) / 280 * h * 0.38
      }

      // Weapon crates
      for (const c of crates) {
        if (c.collected) continue
        const ad = Math.abs(c.alt - layerAlt)
        if (ad > visR) continue
        const op = 1 - ad / visR
        const ox = cx + c.x * sc
        const oy = alty(c.alt)
        const sz = Math.max(3, CRATE_RAD * sc)
        ctx.globalAlpha = op * 0.85
        ctx.fillStyle = '#b84800'
        ctx.fillRect(ox - sz * 0.65, oy - sz * 0.65, sz * 1.3, sz * 1.3)
        ctx.strokeStyle = '#ff8822'
        ctx.lineWidth = isPlayer ? 1.5 : 0.5
        ctx.strokeRect(ox - sz * 0.65, oy - sz * 0.65, sz * 1.3, sz * 1.3)
        if (isPlayer && sz > 10) {
          ctx.fillStyle   = '#ffaa44'
          ctx.font        = `${Math.max(7, Math.round(sz * 0.55))}px monospace`
          ctx.textAlign   = 'center'
          ctx.fillText(W_LABEL[c.weapon] ?? c.weapon.toUpperCase(), ox, oy + sz * 0.28)
        }
        ctx.globalAlpha = 1
      }

      // Enemies
      for (const e of enemies) {
        if (!e.spawned) continue
        const ad = Math.abs(e.spawnAlt - layerAlt)
        if (ad > visR) continue
        const op = (1 - ad / visR) * (e.active ? 1 : 0.25)
        const ex = cx + e.x * sc
        const ey = alty(e.spawnAlt)
        const er = Math.max(3, E_RAD * sc)
        ctx.globalAlpha = op
        ctx.fillStyle   = e.hitFlash > 0 ? '#ffffff' : (e.active ? '#cc2222' : '#552222')
        ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill()
        if (e.active) {
          ctx.strokeStyle = '#ff4444'
          ctx.lineWidth   = isPlayer ? 1.5 : 0.5
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }

      // Bullets
      for (const b of bullets) {
        if (!b.active) continue
        const ad = Math.abs(b.alt - layerAlt)
        if (ad > (isPlayer ? 280 : 110)) continue
        const op = isPlayer ? 1 : Math.max(0, 1 - ad / 110)
        const bx = cx + b.x * sc
        const by = alty(b.alt)
        const br = Math.max(2, B_RAD * sc)
        ctx.globalAlpha = op
        ctx.fillStyle   = b.isEnemy ? '#ff6600' : '#ffee00'
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      }

      // Player (player layer only)
      if (isPlayer) {
        const flash = gs.invTimer > 0 && Math.sin(gs.invTimer * 30) > 0
        if (!flash) {
          const pr = Math.max(6, P_RAD * sc)
          const px = cx + gs.px * sc
          ctx.fillStyle   = '#00ccdd'
          ctx.beginPath(); ctx.arc(px, cy, pr, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = '#00ffff'
          ctx.lineWidth   = 1.5
          ctx.stroke()
          // Parachute visual
          if (gs.phase === 'deployed') {
            const cr = pr * 1.7
            ctx.strokeStyle = '#ff7700'
            ctx.lineWidth   = 1.5
            ctx.beginPath(); ctx.arc(px, cy - pr - 4, cr, Math.PI, 0); ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(px - cr,       cy - pr - 4); ctx.lineTo(px - pr * 0.6, cy)
            ctx.moveTo(px + cr,       cy - pr - 4); ctx.lineTo(px + pr * 0.6, cy)
            ctx.stroke()
          }
        }
      }
    }

    // ── HUD ─────────────────────────────────────────────────────────────────
    function drawHUD(ctx: CanvasRenderingContext2D, pr: { x: number; y: number; w: number; h: number }) {
      // Altitude bar to the left of player rect
      const bw = 10; const bh = pr.h * 0.75
      const bx = pr.x - bw - 6
      const by = pr.y + (pr.h - bh) * 0.5
      const af = gs.alt / TOTAL_ALT
      const ac = af > 0.3 ? '#00aaff' : af > 0.12 ? '#ffaa00' : '#ff3300'
      ctx.fillStyle   = '#060e0a'
      ctx.fillRect(bx, by, bw, bh)
      ctx.strokeStyle = '#162214'; ctx.lineWidth = 1
      ctx.strokeRect(bx, by, bw, bh)
      ctx.fillStyle = ac
      ctx.fillRect(bx, by + bh * (1 - af), bw, bh * af)
      ctx.font = '9px monospace'; ctx.textAlign = 'center'
      ctx.fillText(`${Math.round(gs.alt)}`, bx + bw / 2, by - 4)

      // Health bar top-center of player layer
      const hf  = Math.max(0, gs.health / 100)
      const hbw = pr.w * 0.5
      const hbx = pr.x + (pr.w - hbw) * 0.5
      const hby = pr.y + 8
      const hc  = hf > 0.5 ? '#00cc44' : hf > 0.25 ? '#ffaa00' : '#ff3300'
      ctx.fillStyle = '#060e0a';  ctx.fillRect(hbx, hby, hbw, 4)
      ctx.fillStyle = hc;         ctx.fillRect(hbx, hby, hbw * hf, 4)
      ctx.strokeStyle = '#1a2a1a'; ctx.lineWidth = 0.5
      ctx.strokeRect(hbx, hby, hbw, 4)

      // Kill count
      if (gs.kills > 0) {
        ctx.fillStyle = '#8a9a62'; ctx.font = '10px monospace'; ctx.textAlign = 'left'
        ctx.fillText(`${gs.kills}✗`, pr.x + 8, pr.y + 22)
      }
      // Collected weapons
      if (gs.weapons.length > 0) {
        ctx.fillStyle = '#e05418'; ctx.font = '9px monospace'; ctx.textAlign = 'right'
        ctx.fillText(gs.weapons.map(w => W_LABEL[w] ?? w).join(' '), pr.x + pr.w - 8, pr.y + 22)
      }
    }

    // ── Parachute UI ─────────────────────────────────────────────────────────
    function drawChuteUI(ctx: CanvasRenderingContext2D, pr: { x: number; y: number; w: number; h: number }) {
      const t     = performance.now() / 1000
      const pulse = 0.55 + 0.45 * Math.sin(t * 5)
      const wcy   = pr.y + pr.h * 0.35

      ctx.globalAlpha = pulse
      ctx.fillStyle   = '#ff3300'
      ctx.font        = `bold ${Math.max(18, Math.round(cw * 0.055))}px monospace`
      ctx.textAlign   = 'center'
      ctx.fillText('FALLSCHIRM', cw / 2, wcy)
      ctx.globalAlpha = 1

      ctx.fillStyle = '#ffaa00'
      ctx.font      = `${Math.max(12, Math.round(cw * 0.032))}px monospace`
      ctx.fillText(diffRef.current === 'easy' ? 'SPACE / F DRÜCKEN' : 'ZONE TREFFEN!', cw / 2, wcy + Math.round(cw * 0.044))

      // Timing bar for hard mode
      if (diffRef.current === 'hard') {
        const bw = Math.min(300, cw * 0.5)
        const bx = (cw - bw) * 0.5
        const by = wcy + Math.round(cw * 0.06)
        const bh = 18
        ctx.fillStyle   = '#0a0a0a'; ctx.fillRect(bx, by, bw, bh)
        ctx.fillStyle   = '#00aa44'; ctx.fillRect(bx + bw * 0.38, by, bw * 0.24, bh)
        ctx.fillStyle   = '#ffffff'; ctx.fillRect(bx + gs.timingPos * bw - 3, by - 3, 6, bh + 6)
        ctx.strokeStyle = '#334433'; ctx.lineWidth = 1
        ctx.strokeRect(bx, by, bw, bh)
      }
    }

    function drawFlash(ctx: CanvasRenderingContext2D, overlay: string, text: string) {
      ctx.fillStyle = overlay;  ctx.fillRect(0, 0, cw, ch)
      ctx.fillStyle = '#ffffff'
      ctx.font      = `bold ${Math.round(cw * 0.1)}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText(text, cw / 2, ch * 0.5)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      stopMusic()
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup',   onUp)
      window.removeEventListener('resize',  resize)
    }
  }, [uiPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {(uiPhase === 'select') && (
        <DifficultySelect onSelect={chooseDiff} />
      )}
      {(uiPhase === 'countdown') && (
        <CountdownOverlay n={countN} jump={false} />
      )}
      {(uiPhase === 'go' && showJump) && (
        <CountdownOverlay n={0} jump={true} />
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

function DifficultySelect({ onSelect }: { onSelect: (d: 'easy' | 'hard') => void }) {
  return (
    <div style={{
      ...OVERLAY,
      background: 'radial-gradient(ellipse at 50% 30%, rgba(20,28,14,0.97) 0%, rgba(6,8,5,1) 65%)',
    }}>
      <div style={{ color: '#4a5a32', fontSize: 11, letterSpacing: 8, marginBottom: 12 }}>
        SKYDIVE 2.0
      </div>
      <div style={{
        color: '#e05418', fontSize: 40, fontWeight: 700, letterSpacing: 4, marginBottom: 8,
        textShadow: '0 0 24px #e0541866',
      }}>
        ABSPRUNG
      </div>
      <div style={{ color: '#2a3a1a', fontSize: 11, letterSpacing: 4, marginBottom: 48 }}>
        SCHWIERIGKEITSGRAD WÄHLEN
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        {([
          { id: 'easy' as const, label: 'LEICHT', desc: 'Fallschirm: Knopf drücken' },
          { id: 'hard' as const, label: 'SCHWER', desc: 'Fallschirm: Timing-Minispiel' },
        ]).map(({ id, label, desc }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            style={{
              background: 'rgba(224,84,24,0.08)', border: '1px solid #e05418',
              color: '#e05418', padding: '20px 32px', cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,84,24,0.22)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(224,84,24,0.08)'; e.currentTarget.style.color = '#e05418' }}
          >
            <div style={{ fontSize: 18, letterSpacing: 4, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 10, letterSpacing: 2, opacity: 0.7 }}>{desc}</div>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 48, color: '#1a2a12', fontSize: 10, letterSpacing: 3 }}>
        W/S TEMPO · A/D GLEITEN · SPACE/F FALLSCHIRM
      </div>
    </div>
  )
}

function CountdownOverlay({ n, jump }: { n: number; jump: boolean }) {
  return (
    <div style={{ ...OVERLAY, pointerEvents: 'none' }}>
      <div style={{
        color: '#e05418',
        fontSize: jump ? 32 : 96,
        fontWeight: 700,
        letterSpacing: jump ? 14 : 0,
        textShadow: '0 0 40px #e0541888',
      }}>
        {jump ? 'SPRINGEN!' : n}
      </div>
    </div>
  )
}

