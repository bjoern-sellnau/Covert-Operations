import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { useInput } from '../game/useInput'
import { useSkydiveHUD } from './skydiveHudStore'
import { useSettingsStore } from '../store/settingsStore'
import { mobileInput } from '../store/mobileStore'
import { playPistol, playHit, playDeath } from '../game/sounds'

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_FALL   = 260   // z-units from spawn to ground
const FALL_BASE    = 11    // units/s freefall
const FALL_BOOST   = 30    // units/s dive boost (Shift)
const LATERAL_SPD  = 8
const BOUNDS_X     = 13
const CHUTE_ZONE   = 44    // last N z-units = parachute window (~500m)
const CHUTE_DECEL  = 2.6   // terminal speed with chute open
const P_RADIUS     = 0.38
const BPOOL        = 22
const EPOOL        = 5
const PPOOL        = 30   // blood particle pool
const ENEMY_SPD    = 5.5
const ENEMY_FIRE   = 1.9
const P_BSPD       = 22
const E_BSPD       = 13
const BLIFE        = 2.2
const INVDUR       = 0.9
const DMG_OBS      = 25
const DMG_CONTACT  = 12
const DMG_EBULLET  = 15

// ── Seeded deterministic RNG ──────────────────────────────────────────────────
function makeRng(seed: number) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Obstacle generation ───────────────────────────────────────────────────────
interface ObsData {
  id: number; x: number; z: number
  type: 'rock' | 'crate' | 'drone'
  sx: number; sz: number; height: number; color: string
}

function genObstacles(): ObsData[] {
  const rng = makeRng(31337)
  const out: ObsData[] = []
  let id = 0
  for (let cz = 12; cz < TOTAL_FALL - CHUTE_ZONE - 8; cz += 16) {
    const n = 2 + Math.floor(rng() * 3)
    for (let i = 0; i < n; i++) {
      const x      = (rng() - 0.5) * BOUNDS_X * 1.9
      const z      = cz + rng() * 13
      const t      = rng()
      const type: ObsData['type'] = t < 0.48 ? 'rock' : t < 0.78 ? 'crate' : 'drone'
      const sx     = type === 'rock' ? 1.4 + rng() * 2.4 : type === 'crate' ? 1.1 + rng() * 0.7 : 2.4 + rng() * 0.8
      const sz     = type === 'rock' ? 1.4 + rng() * 2.4 : type === 'crate' ? sx : 1.4
      const height = type === 'rock' ? 1.5 + rng() * 2.5 : type === 'crate' ? 1.1 : 0.65
      const color  = type === 'rock' ? '#4a4a5a' : type === 'crate' ? '#4a3010' : '#1a3a4a'
      out.push({ id: id++, x, z, type, sx, sz, height, color })
    }
  }
  return out
}

interface CloudData { x: number; y: number; z: number; r: number }
function genClouds(): CloudData[] {
  const rng = makeRng(99991)
  return Array.from({ length: 40 }, (_, i) => ({
    x: (rng() - 0.5) * 80,
    y: 3 + rng() * 16,
    z: (i / 40) * (TOTAL_FALL * 1.1) + 2,
    r: 2 + rng() * 7,
  }))
}

// Enemy spawn positions (fixed per level)
const ENEMY_SPAWNS = [
  { x: -7, z: 50 },
  { x:  9, z: 86 },
  { x: -3, z: 116 },
  { x: -11, z: 150 },
  { x:  7, z: 182 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function circleAABB(cx: number, cz: number, cr: number, ox: number, oz: number, hw: number, hd: number) {
  const nx = Math.max(ox - hw, Math.min(cx, ox + hw))
  const nz = Math.max(oz - hd, Math.min(cz, oz + hd))
  return (cx - nx) ** 2 + (cz - nz) ** 2 < cr * cr
}

// ── Scene ─────────────────────────────────────────────────────────────────────
export function SkydiveScene() {
  const setPhase = useGameStore((s) => s.setPhase)
  const setHUD   = useSkydiveHUD((s) => s.setHUD)
  const input    = useInput()
  const skyFPV   = useSettingsStore((s) => s.skyFPV)

  // Mutable game state (no React re-renders)
  const gs = useRef({
    px: 0, pz: 0,
    fallSpeed: FALL_BASE,
    health: 100,
    shootCooldown: 0,
    parachuteDeployed: false,
    invincibleTimer: 0,
    lastHudUpdate: 0,
    done: false,
    fPrev: false,
  })

  const obstacles = useMemo(() => genObstacles(), [])
  const clouds    = useMemo(() => genClouds(), [])

  // Mesh ref pools
  const playerRef   = useRef<THREE.Mesh>(null)
  const chuteRef    = useRef<THREE.Mesh>(null)
  const bulletRefs  = useRef<Array<THREE.Mesh | null>>(new Array(BPOOL).fill(null))
  const enemyRefs   = useRef<Array<THREE.Mesh | null>>(new Array(EPOOL).fill(null))
  const particleRefs = useRef<Array<THREE.Mesh | null>>(new Array(PPOOL).fill(null))

  // Blood particle pool
  const particles = useRef(Array.from({ length: PPOOL }, () => ({
    active: false, x: 0, y: 0.3, z: 0, vx: 0, vy: 0, vz: 0, life: 0,
  })))

  // Bullet pool state
  const bullets = useRef(Array.from({ length: BPOOL }, () => ({
    active: false, x: 0, z: 0, vx: 0, vz: 0, life: 0, isEnemy: false,
  })))

  // Enemy pool state
  const enemies = useRef(ENEMY_SPAWNS.map((sp) => ({
    active: false, spawned: false,
    spawnX: sp.x, spawnZ: sp.z,
    x: sp.x, z: sp.z,
    hp: 2, shootTimer: 1.5,
    hitFlash: 0, deathFlash: 0,
  })))

  // Raycaster for mouse-aim on ground plane
  const rc     = useRef(new THREE.Raycaster())
  const gPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const mWorld = useRef(new THREE.Vector3())

  function spawnBullet(x: number, z: number, vx: number, vz: number, isEnemy: boolean) {
    for (const b of bullets.current) {
      if (!b.active) { Object.assign(b, { active: true, x, z, vx, vz, life: BLIFE, isEnemy }); return }
    }
  }

  function spawnBlood(x: number, z: number, count = 6) {
    let spawned = 0
    for (const p of particles.current) {
      if (p.active) continue
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 3
      p.active = true
      p.x = x; p.y = 0.4; p.z = z
      p.vx = Math.cos(angle) * speed
      p.vy = 1 + Math.random() * 2
      p.vz = Math.sin(angle) * speed
      p.life = 0.3 + Math.random() * 0.3
      if (++spawned >= count) break
    }
  }

  function die() {
    gs.current.done = true
    setTimeout(() => setPhase('gameover'), 300)
  }

  useFrame((state, delta) => {
    const g = gs.current
    if (g.done) return
    const dt   = Math.min(delta, 0.05)
    const keys = input.current.keys
    const mb   = input.current.mouseButtons
    const { camera, pointer } = state

    // Mouse world position for aiming
    rc.current.setFromCamera(pointer, camera)
    rc.current.ray.intersectPlane(gPlane.current, mWorld.current)

    // F key edge detection (parachute trigger)
    const fNow  = keys.has('KeyF')
    const fJust = fNow && !g.fPrev
    g.fPrev = fNow

    // ── Fall physics ────────────────────────────────────────────────────
    if (!g.parachuteDeployed) {
      const target = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? FALL_BOOST : FALL_BASE
      g.fallSpeed += (target - g.fallSpeed) * Math.min(1, 7 * dt)
    } else {
      g.fallSpeed = Math.max(CHUTE_DECEL, g.fallSpeed - 20 * dt)
    }
    g.pz += g.fallSpeed * dt

    // ── Lateral movement ────────────────────────────────────────────────
    if (keys.has('KeyA')) g.px -= LATERAL_SPD * dt
    if (keys.has('KeyD')) g.px += LATERAL_SPD * dt
    // W/S: small fore-aft body adjustment (freefall body position)
    if (keys.has('KeyW') && !(keys.has('ShiftLeft') || keys.has('ShiftRight'))) g.pz -= 2.5 * dt
    if (keys.has('KeyS')) g.pz += 2 * dt
    g.px = Math.max(-BOUNDS_X, Math.min(BOUNDS_X, g.px))

    // ── Parachute ───────────────────────────────────────────────────────
    const inChuteZone = g.pz >= TOTAL_FALL - CHUTE_ZONE
    if (fJust && inChuteZone && !g.parachuteDeployed) g.parachuteDeployed = true

    // ── Ground check ────────────────────────────────────────────────────
    if (g.pz >= TOTAL_FALL) {
      g.done = true
      if (g.parachuteDeployed) setTimeout(() => setPhase('skydive_win'), 400)
      else die()
      return
    }

    g.invincibleTimer = Math.max(0, g.invincibleTimer - dt)

    // ── Shooting ────────────────────────────────────────────────────────
    g.shootCooldown = Math.max(0, g.shootCooldown - dt)
    const isShooting = mb.has(0) || mobileInput.fire
    if (isShooting && g.shootCooldown <= 0) {
      const dx  = mWorld.current.x - g.px
      const dz2 = mWorld.current.z - g.pz
      const len = Math.sqrt(dx * dx + dz2 * dz2)
      if (len > 0.1) {
        spawnBullet(g.px, g.pz, (dx / len) * P_BSPD, (dz2 / len) * P_BSPD, false)
        playPistol(0.55)
      }
      g.shootCooldown = 0.18
    }

    // ── Bullet updates ──────────────────────────────────────────────────
    for (const b of bullets.current) {
      if (!b.active) continue
      b.x += b.vx * dt
      b.z += b.vz * dt
      b.life -= dt
      if (b.life <= 0 || Math.abs(b.x) > BOUNDS_X + 10 || b.z < g.pz - 30 || b.z > g.pz + 42) {
        b.active = false; continue
      }
      if (!b.isEnemy) {
        // vs obstacles
        for (const obs of obstacles) {
          if (Math.abs(obs.z - b.z) > obs.sz / 2 + 1) continue
          if (circleAABB(b.x, b.z, 0.12, obs.x, obs.z, obs.sx / 2, obs.sz / 2)) { b.active = false; break }
        }
        if (!b.active) continue
        // vs enemies
        for (const e of enemies.current) {
          if (!e.active) continue
          if ((b.x - e.x) ** 2 + (b.z - e.z) ** 2 < 0.6 ** 2) {
            b.active = false
            e.hp -= 1
            e.hitFlash = 0.14
            spawnBlood(e.x, e.z, 5)
            if (e.hp <= 0) {
              e.active = false
              e.deathFlash = 0.22
              spawnBlood(e.x, e.z, 12)
              playDeath(0.45)
            } else {
              playHit(0.7)
            }
            break
          }
        }
      } else {
        // enemy bullet vs player
        if (g.invincibleTimer <= 0 && (b.x - g.px) ** 2 + (b.z - g.pz) ** 2 < 0.48 ** 2) {
          b.active = false
          g.health -= DMG_EBULLET
          g.invincibleTimer = INVDUR * 0.5
          if (g.health <= 0) { die(); return }
        }
      }
    }

    // ── Enemy updates ───────────────────────────────────────────────────
    for (const e of enemies.current) {
      // Activate when player gets within range
      if (!e.spawned && g.pz + 40 > e.spawnZ) {
        e.spawned = true; e.active = true
        e.x = e.spawnX; e.z = e.spawnZ; e.hp = 2; e.shootTimer = 1.5
      }
      if (!e.active) continue

      // Chase player
      const edx = g.px - e.x
      const edz = g.pz - e.z
      const el  = Math.sqrt(edx * edx + edz * edz)
      if (el > 0.6) { e.x += (edx / el) * ENEMY_SPD * dt; e.z += (edz / el) * ENEMY_SPD * dt }

      // Shoot
      e.shootTimer -= dt
      if (e.shootTimer <= 0) {
        const a = Math.atan2(edx, edz)
        spawnBullet(e.x, e.z, Math.sin(a) * E_BSPD, Math.cos(a) * E_BSPD, true)
        e.shootTimer = ENEMY_FIRE
      }

      // Contact damage
      if (g.invincibleTimer <= 0 && (g.px - e.x) ** 2 + (g.pz - e.z) ** 2 < 0.75 ** 2) {
        g.health -= DMG_CONTACT; g.invincibleTimer = INVDUR
        if (g.health <= 0) { die(); return }
      }
    }

    // ── Player vs obstacles ─────────────────────────────────────────────
    if (g.invincibleTimer <= 0) {
      for (const obs of obstacles) {
        if (Math.abs(obs.z - g.pz) > obs.sz / 2 + P_RADIUS + 1) continue
        if (circleAABB(g.px, g.pz, P_RADIUS, obs.x, obs.z, obs.sx / 2, obs.sz / 2)) {
          g.health -= DMG_OBS; g.invincibleTimer = INVDUR
          if (g.health <= 0) { die(); return }
          break
        }
      }
    }

    // ── Mesh updates ────────────────────────────────────────────────────
    playerRef.current?.position.set(g.px, 0.45, g.pz)
    if (chuteRef.current) {
      chuteRef.current.visible = g.parachuteDeployed
      chuteRef.current.position.set(g.px, 3.4, g.pz)
    }
    for (let i = 0; i < BPOOL; i++) {
      const m = bulletRefs.current[i]; const b = bullets.current[i]
      if (!m) continue
      m.visible = b.active
      if (b.active) m.position.set(b.x, 0.3, b.z)
    }
    // ── Blood particles ─────────────────────────────────────────────────────
    for (let i = 0; i < PPOOL; i++) {
      const m = particleRefs.current[i]; const p = particles.current[i]
      if (!m) continue
      if (p.active) {
        p.x  += p.vx * dt; p.y  += p.vy * dt; p.z  += p.vz * dt
        p.vy -= 9 * dt   // gravity
        p.life -= dt
        if (p.life <= 0) { p.active = false }
      }
      m.visible = p.active
      if (p.active) m.position.set(p.x, p.y, p.z)
    }
    for (let i = 0; i < EPOOL; i++) {
      const m = enemyRefs.current[i]; const e = enemies.current[i]
      if (!m) continue
      // Decay flash timers
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt)
      if (e.deathFlash > 0) e.deathFlash = Math.max(0, e.deathFlash - dt)
      // Show death flash briefly even after active=false
      const showDeathFlash = !e.active && e.deathFlash > 0
      m.visible = e.active || showDeathFlash
      if (m.visible) {
        m.position.set(e.x, 0.4, e.z)
        const mat = m.material as THREE.MeshStandardMaterial
        if (showDeathFlash) {
          mat.emissive.set('#ffffff')
          mat.emissiveIntensity = e.deathFlash * 18
          m.scale.setScalar(1 + (0.22 - e.deathFlash) * 6)
        } else if (e.hitFlash > 0) {
          mat.emissive.set('#ffffff')
          mat.emissiveIntensity = 4
          m.scale.setScalar(1)
        } else {
          mat.emissive.set('#ee1100')
          mat.emissiveIntensity = 0.7
          m.scale.setScalar(1)
        }
      }
    }

    // ── Camera ───────────────────────────────────────────────────────────
    if (skyFPV) {
      // First-person: camera at player's head, looking forward-down
      camera.position.set(g.px, 1.2, g.pz)
      const lookX = mWorld.current.x !== 0 ? mWorld.current.x : g.px
      const lookZ = mWorld.current.z !== 0 ? mWorld.current.z : g.pz + 10
      camera.lookAt(lookX, 0, lookZ)
    } else {
      // Top-down with slight forward tilt
      camera.position.set(g.px * 0.6, 26, g.pz - 20)
      camera.lookAt(g.px * 0.2, 0, g.pz + 14)
    }

    // ── HUD update (throttled ~80 ms) ───────────────────────────────────
    const now = performance.now()
    if (now - g.lastHudUpdate > 80) {
      g.lastHudUpdate = now
      const alt = Math.max(0, Math.round((1 - g.pz / TOTAL_FALL) * 3000))
      setHUD(alt, Math.max(0, g.health), inChuteZone, g.parachuteDeployed)
    }
  })

  return (
    <>
      {/* Sky background */}
      <color attach="background" args={['#0a1428']} />

      {/* Lighting */}
      <ambientLight intensity={0.55} color="#aaccff" />
      <directionalLight position={[15, 50, -10]} intensity={1.3} color="#ffe8cc" />
      <hemisphereLight args={['#4488cc', '#1a3a0a', 0.38]} />
      <fog attach="fog" args={['#1a2a6a', 50, 135]} />

      {/* Sky floor (dark ocean/ground far below) */}
      <mesh position={[0, -3, 130]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[150, 380]} />
        <meshStandardMaterial color="#111a38" roughness={1} />
      </mesh>

      {/* Landing zone (ground) */}
      <mesh position={[0, -1.5, TOTAL_FALL + 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 28]} />
        <meshStandardMaterial color="#1a4a10" roughness={1} />
      </mesh>

      {/* Helicopter at spawn */}
      <group position={[0, 5.5, -12]}>
        <mesh>
          <boxGeometry args={[2.2, 1.0, 4.6]} />
          <meshStandardMaterial color="#2a3a4a" roughness={0.6} metalness={0.55} />
        </mesh>
        {/* Rotor mast */}
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 1.0, 6]} />
          <meshStandardMaterial color="#1a2836" />
        </mesh>
        {/* Rotor blade */}
        <mesh position={[0, 1.4, 0]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[5.5, 0.06, 0.25]} />
          <meshStandardMaterial color="#1a2836" />
        </mesh>
        {/* Tail boom */}
        <mesh position={[0, 0, 3.0]}>
          <boxGeometry args={[0.5, 0.5, 2.2]} />
          <meshStandardMaterial color="#253545" roughness={0.65} metalness={0.5} />
        </mesh>
      </group>

      {/* Clouds */}
      {clouds.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]}>
          <sphereGeometry args={[c.r, 8, 6]} />
          <meshStandardMaterial color="#c8daf5" transparent opacity={0.30} roughness={1} />
        </mesh>
      ))}

      {/* Obstacles */}
      {obstacles.map((obs) => (
        <mesh
          key={obs.id}
          position={[obs.x, obs.height / 2 - 1, obs.z]}
          scale={[obs.sx, obs.height, obs.sz]}
        >
          {obs.type === 'rock'
            ? <cylinderGeometry args={[0.5, 0.65, 1, 7]} />
            : <boxGeometry args={[1, 1, 1]} />}
          <meshStandardMaterial
            color={obs.color}
            roughness={obs.type === 'rock' ? 0.93 : 0.65}
            metalness={obs.type === 'drone' ? 0.75 : 0.1}
            emissive={obs.type === 'drone' ? '#003366' : '#000000'}
            emissiveIntensity={obs.type === 'drone' ? 0.7 : 0}
          />
        </mesh>
      ))}

      {/* Player */}
      <mesh ref={playerRef} position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.3, 0.22, 0.85, 8]} />
        <meshStandardMaterial color="#1a2d3d" roughness={0.6} metalness={0.45}
          emissive="#0a1820" emissiveIntensity={0.4} />
      </mesh>

      {/* Parachute canopy (shown after deploy) */}
      <mesh ref={chuteRef} visible={false}>
        <sphereGeometry args={[2.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#cc2200" transparent opacity={0.85}
          side={THREE.DoubleSide} roughness={0.75} />
      </mesh>

      {/* Enemy pool */}
      {Array.from({ length: EPOOL }).map((_, i) => (
        <mesh key={i} ref={(r) => { enemyRefs.current[i] = r }} visible={false}>
          <cylinderGeometry args={[0.33, 0.33, 0.75, 8]} />
          <meshStandardMaterial color="#cc2222" emissive="#ee1100" emissiveIntensity={0.7} />
        </mesh>
      ))}

      {/* Bullet pool */}
      {Array.from({ length: BPOOL }).map((_, i) => (
        <mesh key={i} ref={(r) => { bulletRefs.current[i] = r }} visible={false}>
          <sphereGeometry args={[0.1, 5, 4]} />
          <meshStandardMaterial color="#ffee00" emissive="#ffaa00" emissiveIntensity={3} />
        </mesh>
      ))}

      {/* Blood particle pool */}
      {Array.from({ length: PPOOL }).map((_, i) => (
        <mesh key={i} ref={(r) => { particleRefs.current[i] = r }} visible={false}>
          <sphereGeometry args={[0.07, 4, 3]} />
          <meshStandardMaterial color="#cc1100" emissive="#ff2200" emissiveIntensity={1.5} />
        </mesh>
      ))}
    </>
  )
}
