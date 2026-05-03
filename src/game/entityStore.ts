import * as THREE from 'three'
import type { EnemyType, WeaponId } from './types'
import { FOCUS_MAX } from './types'

// ── Pickup system ─────────────────────────────────────────────────────────────
export type PickupKind     = 'ammo' | 'weapon' | 'health' | 'credits' | 'bad_package' | 'armor' | 'focus' | 'quad_damage' | 'berserker'
export type ChaosModifier  = 'normal' | 'explosive' | 'jammed'

export interface PickupData {
  id:            string
  x:             number
  z:             number
  kind:          PickupKind
  weaponId:      WeaponId
  amount:        number
  active:        boolean
  spawnTime:     number
  isChaos:       boolean
  chaosModifier: ChaosModifier
  fuseTimer:     number   // bad_package: seconds until explosion; <0 = dud
  fallY:         number   // chaos crate: current Y (>0 = still falling)
}

export interface EnemyData {
  id: string
  position: THREE.Vector2
  health: number
  type: EnemyType
  hitTime: number
  lastDamageTime: number
  aiTimer: number    // general-purpose per-enemy AI timer
  aiState: number    // general-purpose per-enemy AI state integer
  shootCooldown: number
}

export interface EnemyBulletData {
  id: string
  position: THREE.Vector2
  velocity: THREE.Vector2
  lifetime: number
  damage: number
}

export interface BulletData {
  id: string
  position: THREE.Vector2
  velocity: THREE.Vector2
  lifetime: number
  damage: number
  bounces: number
  maxBounces: number
  isEnergy: boolean   // blaster / flak visual
  isFlak: boolean     // plays flak ricochet sound
}

export interface PlayerData {
  position: THREE.Vector2
  angle: number
  health: number
  armor: number
  shootCooldown: number
  invincibleUntil: number
  quadDamageTimer: number  // seconds remaining; 0 = inactive
  berserkerTimer: number   // seconds remaining; 0 = inactive
}

export interface GrenadeData {
  id: string
  x: number
  z: number
  vx: number
  vz: number
  timer: number
  bounces: number
}

export interface ProjectileData {
  x: number
  z: number
  vx: number
  vz: number
}

export interface BananaData {
  id: string
  x: number
  z: number
  vx: number
  vz: number
  timer: number   // fuse timer
  bounces: number
}

export type ParticleType = 'blood' | 'explosion' | 'spark'

export interface ParticleData {
  active: boolean
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  maxLife: number
  type: ParticleType
  scale: number
}

export interface DecalData {
  active: boolean
  x: number
  z: number
  rotY: number
  size: number
  age: number
  maxAge: number
}

const PARTICLE_POOL = 250
const DECAL_POOL    = 60

function makeParticlePool(): ParticleData[] {
  return Array.from({ length: PARTICLE_POOL }, () => ({
    active: false, x: 0, y: 0, z: 0,
    vx: 0, vy: 0, vz: 0,
    life: 0, maxLife: 1, type: 'blood' as ParticleType, scale: 1,
  }))
}

function makeDecalPool(): DecalData[] {
  return Array.from({ length: DECAL_POOL }, () => ({
    active: false, x: 0, z: 0, rotY: 0, size: 0.4, age: 0, maxAge: 18,
  }))
}

function makeEntityStore() {
  return {
    player: {
      position: new THREE.Vector2(0, 0),
      angle: 0,
      health: 100,
      armor: 0,
      shootCooldown: 0,
      invincibleUntil: 0,
      quadDamageTimer: 0,
      berserkerTimer: 0,
    } as PlayerData,
    enemies: new Map<string, EnemyData>(),
    bullets: new Map<string, BulletData>(),
    enemyBullets: new Map<string, EnemyBulletData>(),
    enemyBulletIdCounter: 0,
    mouseWorld: new THREE.Vector3(0, 0, 0),
    score: 0,
    wave: 1,
    waveBreakTimer: 0,
    inWaveBreak: false,
    enemyIdCounter: 0,
    bulletIdCounter: 0,
    focus: FOCUS_MAX,
    isBulletTime: false,
    ammo: 48,
    maxAmmo: 48,
    creditsEarned: 0,
    // Maneuvers
    maneuver: 'none' as 'none' | 'dive' | 'spin' | 'gunkata',
    maneuverTimer: 0,
    maneuverDx: 0,
    maneuverDz: 0,
    spinDir: 1,
    diveCooldown: 0,
    spinCooldown: 0,
    spinFireTimer: 0,
    gunKataCooldown: 0,
    gunKataFireTimer: 0,
    gunKataTargetQueue: [] as string[],  // ordered enemy ids to fire at
    // Grenades
    grenadeIdCounter: 0,
    grenades: [] as GrenadeData[],
    grenadeCount: 3,
    // Akimbo
    isAkimbo: false,
    // Vernichter
    vernichterAmmo: 1,
    vernichterProjectile: null as ProjectileData | null,
    // Death Laser
    laserAmmo: 0,
    laserBeam: null as { x0: number; z0: number; x1: number; z1: number; timer: number } | null,
    // Ion Cannon
    ionAmmo: 0,
    ionTarget: null as { x: number; z: number; delay: number; beamTimer: number } | null,
    // Plasma / Bazooka projectile (single in-flight)
    weaponProjectile: null as ProjectileData | null,
    // Banana grenades
    bananas: [] as BananaData[],
    bananaIdCounter: 0,
    // Melee
    meleeSwing: 0,
    // Burst fire state
    burstRemaining: 0,
    burstTimer: 0,
    // Reload & per-weapon ammo
    reloadTimer: 0,
    weaponAmmo: new Map<string, number>(),
    // ── Mutators: round time & lives ─────────────────────────────────────────
    roundTimer:      0 as number,
    roundTimerActive: false,
    playerLives:     3,
    p2Lives:         3,
    inSuddenDeath:   false,
    sdMargin:        0 as number,
    sdTimer:         0 as number,
    // ── Mutators: pickups ────────────────────────────────────────────────────
    pickups:          [] as PickupData[],
    pickupIdCounter:  0,
    // ── Mutators: chaos weapon ───────────────────────────────────────────────
    chaosWeaponId:   null as WeaponId | null,
    chaosAmmo:       0,
    chaosModifier:   'normal' as ChaosModifier,
    // ── Player 2 (local co-op) ───────────────────────────────────────────────
    player2: {
      position: new THREE.Vector2(2, 0),
      angle: 0,
      health: 100,
      armor: 0,
      shootCooldown: 0,
      invincibleUntil: 0,
      quadDamageTimer: 0,
      berserkerTimer: 0,
    } as PlayerData,
    player2Active: false,
    ammo2: 48,
    maxAmmo2: 48,
    grenadeCount2: 3,
    // Kill tracking
    hardlineProgress: 0,
    killStreak: 0,
    killComboCount: 0,
    killComboTimer: 0,
    // Particles & decals
    particles: makeParticlePool(),
    decals: makeDecalPool(),
  }
}

export const entityStore = makeEntityStore()

export function resetEntityStore() {
  const s = entityStore
  s.player.position.set(0, 0)
  s.player.angle = 0
  s.player.health = 100
  s.player.armor = 0
  s.player.shootCooldown = 0
  s.player.invincibleUntil = 0
  s.player.quadDamageTimer = 0
  s.player.berserkerTimer = 0
  s.enemies.clear()
  s.bullets.clear()
  s.enemyBullets.clear()
  s.mouseWorld.set(0, 0, 0)
  s.score = 0
  s.wave = 1
  s.waveBreakTimer = 0
  s.inWaveBreak = false
  s.focus = FOCUS_MAX
  s.isBulletTime = false
  s.ammo = 48
  s.maxAmmo = 48
  s.creditsEarned = 0
  s.maneuver = 'none'
  s.maneuverTimer = 0
  s.maneuverDx = 0
  s.maneuverDz = 0
  s.spinDir = 1
  s.diveCooldown = 0
  s.spinCooldown = 0
  s.spinFireTimer = 0
  s.gunKataCooldown = 0
  s.gunKataFireTimer = 0
  s.gunKataTargetQueue = []
  s.grenades = []
  s.grenadeCount = 3
  s.isAkimbo = false
  s.vernichterAmmo = 1
  s.vernichterProjectile = null
  s.laserAmmo = 0
  s.laserBeam = null
  s.ionAmmo = 0
  s.ionTarget = null
  s.weaponProjectile = null
  s.bananas = []
  s.meleeSwing = 0
  s.burstRemaining = 0
  s.burstTimer = 0
  s.reloadTimer = 0
  s.weaponAmmo.clear()
  s.roundTimer       = 0
  s.roundTimerActive = false
  s.playerLives      = 3
  s.p2Lives          = 3
  s.inSuddenDeath    = false
  s.sdMargin         = 0
  s.sdTimer          = 0
  s.pickups          = []
  s.pickupIdCounter  = 0
  s.chaosWeaponId    = null
  s.chaosAmmo        = 0
  s.chaosModifier    = 'normal'
  s.player2.position.set(2, 0)
  s.player2.angle = 0
  s.player2.health = 100
  s.player2.armor = 0
  s.player2.shootCooldown = 0
  s.player2.invincibleUntil = 0
  s.player2.quadDamageTimer = 0
  s.player2.berserkerTimer = 0
  s.player2Active = false
  s.ammo2 = 48
  s.maxAmmo2 = 48
  s.grenadeCount2 = 3
  s.hardlineProgress = 0
  s.killStreak = 0
  s.killComboCount = 0
  s.killComboTimer = 0
  for (const p of s.particles) p.active = false
  for (const d of s.decals) d.active = false
}

export function spawnParticles(
  x: number, z: number,
  type: ParticleType,
  count: number,
) {
  if (count <= 0) return
  const pool = entityStore.particles
  let spawned = 0
  for (let i = 0; i < pool.length && spawned < count; i++) {
    if (pool[i].active) continue
    const p = pool[i]
    p.active = true
    p.type = type
    p.x = x
    p.y = type === 'spark' ? 0.05 : 0.2
    p.z = z
    if (type === 'blood') {
      p.vx = (Math.random() - 0.5) * 4
      p.vy = Math.random() * 2 + 0.5
      p.vz = (Math.random() - 0.5) * 4
      p.life = 0.5 + Math.random() * 0.5
      p.maxLife = p.life
      p.scale = 0.06 + Math.random() * 0.06
    } else if (type === 'explosion') {
      const speed = 2 + Math.random() * 5
      const angle = Math.random() * Math.PI * 2
      const elev = Math.random() * 0.8
      p.vx = Math.cos(angle) * speed * Math.cos(elev)
      p.vy = Math.sin(elev) * speed + 1
      p.vz = Math.sin(angle) * speed * Math.cos(elev)
      p.life = 0.6 + Math.random() * 0.6
      p.maxLife = p.life
      p.scale = 0.1 + Math.random() * 0.1
    } else {
      // spark
      const speed = 3 + Math.random() * 4
      const angle = Math.random() * Math.PI * 2
      p.vx = Math.cos(angle) * speed
      p.vy = Math.random() * 1.5 + 0.3
      p.vz = Math.sin(angle) * speed
      p.life = 0.2 + Math.random() * 0.3
      p.maxLife = p.life
      p.scale = 0.03 + Math.random() * 0.03
    }
    spawned++
  }
}

export function spawnDecal(x: number, z: number, size: number) {
  const pool = entityStore.decals
  // Find inactive slot, or reuse oldest
  let idx = pool.findIndex((d) => !d.active)
  if (idx === -1) {
    // Reuse the oldest (lowest age ratio)
    let oldest = 0
    let minRatio = Infinity
    for (let i = 0; i < pool.length; i++) {
      const ratio = pool[i].age / pool[i].maxAge
      if (ratio < minRatio) { minRatio = ratio; oldest = i }
    }
    idx = oldest
  }
  const d = pool[idx]
  d.active = true
  d.x = x
  d.z = z
  d.rotY = Math.random() * Math.PI * 2
  d.size = size
  d.age = 0
  d.maxAge = 15 + Math.random() * 10
}
