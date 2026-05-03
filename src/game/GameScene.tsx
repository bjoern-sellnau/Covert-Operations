import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { entityStore, resetEntityStore, spawnParticles, spawnDecal } from './entityStore'
import type { BananaData, BulletData } from './entityStore'
import { useMutatorsStore } from '../store/mutatorsStore'
import { PickupSystem, spawnEnemyDrop } from './PickupSystem'
import type { CameraMode } from '../store/gameStore'
import {
  WEAPON_SOUNDS,
  playExplosionSmall, playExplosionLarge,
  playFlakBounce, playBananaBounce, playRicochet,
  playHit, playDeath, playKillMulti, playKillCombo, playEnemyFire,
} from './sounds'
import { useGameStore } from '../store/gameStore'
import { useNetStore } from '../net/netStore'
import { socket } from '../net/socket'
import type { NetGameState, NetPlayerInput } from '../net/netTypes'
import { mobileInput } from '../store/mobileStore'
import { useLoadoutStore } from './loadoutStore'
import { useEditorStore } from '../editor/editorStore'
import { useSettingsStore, BLOOD_COUNTS, EXPL_COUNTS, SPARK_COUNTS, DIFFICULTY_MULTS } from '../store/settingsStore'
import { hudData } from './hudData'
import { useInput } from './useInput'
import { spawnWave } from './spawnWave'
import { GameLevelObjects, resolveCircleVsLevel, pointIntersectsLevel } from './GameLevelObjects'
import type { Level } from '../editor/editorStore'
import {
  PLAYER_SPEED, PLAYER_RADIUS, BULLET_LIFETIME, BULLET_RADIUS,
  ARENA_HALF, ENEMY_CONFIGS, WEAPON_CONFIGS, AMMO_CONFIGS, EQUIPMENT_CONFIGS,
  INVINCIBLE_DURATION, WAVE_BREAK_DURATION,
  BULLET_TIME_SCALE, BULLET_TIME_PLAYER_REAL,
  FOCUS_MAX, FOCUS_REGEN_RATE, FOCUS_MIN_ACTIVATE,
  DIVE_SPEED, DIVE_DURATION, DIVE_COOLDOWN,
  SPIN_COOLDOWN, SPIN_FIRE_RATE,
  GRENADE_SPEED, GRENADE_FUSE, GRENADE_BOUNCE, GRENADE_RADIUS, GRENADE_DAMAGE,
  VERNICHTER_SPEED, VERNICHTER_RADIUS, VERNICHTER_DAMAGE,
  LASER_RANGE, LASER_WIDTH,
  ION_DELAY, ION_BEAM_DURATION, ION_RADIUS,
  WEAPON_SLOT_WEAPONS,
} from './types'
import type { EnemyType, WeaponId } from './types'
import { Arena } from './Arena'
import { PlayerMesh } from './PlayerMesh'
import { EnemyMesh } from './EnemyMesh'
import { BulletMesh } from './BulletMesh'
import { EnemyBulletMesh } from './EnemyBulletMesh'
import { ParticleSystem } from './ParticleSystem'
import { DemoRecorder } from './DemoRecorder'
import { ScriptEngine, resetScriptRuntime } from './ScriptEngine'
import { FogOfWar } from './FogOfWar'

const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const _raycaster   = new THREE.Raycaster()
const _mouseTarget = new THREE.Vector3()
const _toMouse     = new THREE.Vector2()
const _toPlayer    = new THREE.Vector2()
const _diff        = new THREE.Vector2()

const DEBUG_VIEW = new URLSearchParams(window.location.search).has('debugview')

const _btAmbientColor     = new THREE.Color(0xaaccff)
const _normalAmbientColor = new THREE.Color(0x4488ff)
const _btDirColor         = new THREE.Color(0x6688cc)
const _normalDirColor     = new THREE.Color(0xffffff)

const FPS_SENS   = 0.0025
const MAX_GRENADES = 6

const HARDLINE_WEAPONS: WeaponId[] = [
  'knife', 'pistol', 'smg', 'uzi', 'shotgun', 'rifle', 'mp5', 'm16', 'blaster', 'flak', 'plasma', 'bazooka', 'bfg',
]
const BOT_GAME_TYPES = new Set(['instakill', 'deathmatch', 'hardline_solo', 'hardline'])

const RANGE_TARGET_X = [-10, -5, 0, 5, 10]

// ── SuddenDeathOverlay — red edge zones that shrink the arena ────────────────
const _sdMat = new THREE.MeshStandardMaterial({
  color: '#cc1100', emissive: '#ff0000', emissiveIntensity: 0.6,
  transparent: true, opacity: 0.72, roughness: 0.5,
})

function SuddenDeathOverlay() {
  const nRef = useRef<THREE.Mesh>(null)
  const sRef = useRef<THREE.Mesh>(null)
  const eRef = useRef<THREE.Mesh>(null)
  const wRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const es = entityStore
    const show = es.inSuddenDeath && es.sdMargin > 0
    const m    = es.sdMargin
    if (!show) {
      ;[nRef, sRef, eRef, wRef].forEach(r => { if (r.current) r.current.visible = false })
      return
    }
    const ah = useEditorStore.getState().activePlayLevel?.arenaHalf ?? ARENA_HALF
    const ah2 = ah * 2
    if (nRef.current) { nRef.current.visible = true; nRef.current.scale.set(ah2, 0.12, m); nRef.current.position.set(0, 0.06, ah - m / 2) }
    if (sRef.current) { sRef.current.visible = true; sRef.current.scale.set(ah2, 0.12, m); sRef.current.position.set(0, 0.06, -ah + m / 2) }
    if (eRef.current) { eRef.current.visible = true; eRef.current.scale.set(m, 0.12, ah2 - m * 2); eRef.current.position.set(ah - m / 2, 0.06, 0) }
    if (wRef.current) { wRef.current.visible = true; wRef.current.scale.set(m, 0.12, ah2 - m * 2); wRef.current.position.set(-ah + m / 2, 0.06, 0) }
  })

  return (
    <>
      <mesh ref={nRef} material={_sdMat} visible={false}><boxGeometry args={[1, 1, 1]} /></mesh>
      <mesh ref={sRef} material={_sdMat} visible={false}><boxGeometry args={[1, 1, 1]} /></mesh>
      <mesh ref={eRef} material={_sdMat} visible={false}><boxGeometry args={[1, 1, 1]} /></mesh>
      <mesh ref={wRef} material={_sdMat} visible={false}><boxGeometry args={[1, 1, 1]} /></mesh>
    </>
  )
}

// ── DebugView — shown when ?debugview=true ────────────────────────────────────
const MAX_DBG_ENEMIES = 50
const MAX_DBG_BULLETS = 40

function DebugView() {
  const playerRef  = useRef<THREE.Mesh>(null)
  const enemyRefs  = useRef<(THREE.Mesh | null)[]>(new Array(MAX_DBG_ENEMIES).fill(null))
  const bulletRefs = useRef<(THREE.Mesh | null)[]>(new Array(MAX_DBG_BULLETS).fill(null))

  useFrame(() => {
    const es = entityStore
    if (playerRef.current) {
      playerRef.current.position.set(es.player.position.x, 0.06, es.player.position.y)
    }
    const enemyArr = Array.from(es.enemies.values())
    for (let i = 0; i < MAX_DBG_ENEMIES; i++) {
      const ring = enemyRefs.current[i]
      if (!ring) continue
      const e = enemyArr[i]
      ring.visible = !!e
      if (e) {
        ring.position.set(e.position.x, 0.06, e.position.y)
        ring.scale.setScalar(ENEMY_CONFIGS[e.type].size / 0.45)
      }
    }
    const bulletArr = Array.from(es.bullets.values())
    for (let i = 0; i < MAX_DBG_BULLETS; i++) {
      const ring = bulletRefs.current[i]
      if (!ring) continue
      const b = bulletArr[i]
      ring.visible = !!b
      if (b) ring.position.set(b.position.x, 0.06, b.position.y)
    }
  })

  return (
    <>
      <mesh ref={playerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PLAYER_RADIUS - 0.05, PLAYER_RADIUS, 32]} />
        <meshBasicMaterial color="#00ff44" transparent opacity={0.9} depthTest={false} />
      </mesh>
      {Array.from({ length: MAX_DBG_ENEMIES }, (_, i) => (
        <mesh key={i} ref={(m) => { enemyRefs.current[i] = m }}
              rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.40, 0.45, 24]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={0.9} depthTest={false} />
        </mesh>
      ))}
      {Array.from({ length: MAX_DBG_BULLETS }, (_, i) => (
        <mesh key={i} ref={(m) => { bulletRefs.current[i] = m }}
              rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[BULLET_RADIUS - 0.03, BULLET_RADIUS, 12]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.9} depthTest={false} />
        </mesh>
      ))}
    </>
  )
}

function ShootingRangeLayout() {
  const isLowQuality = useSettingsStore((s) => s.graphicsQuality === 'low')
  return (
    <>
      {/* Backdrop wall */}
      <mesh position={[0, 0.6, -16.5]}>
        <boxGeometry args={[38, 2.5, 0.4]} />
        <meshStandardMaterial color="#1a2530" roughness={0.9} />
      </mesh>

      {/* Overhead strip lights */}
      {[-8, 0, 8].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.8, -8]}>
            <boxGeometry args={[0.15, 0.12, 20]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
          </mesh>
          <pointLight position={[x, 1.6, -8]} color="#ffe8c0" intensity={2.5} distance={18} decay={2} />
        </group>
      ))}

      {/* Lane dividers (low barriers) */}
      {[-7.5, -2.5, 2.5, 7.5].map((x) => (
        <mesh key={x} position={[x, 0.18, -8]}>
          <boxGeometry args={[0.12, 0.36, 19]} />
          <meshStandardMaterial color="#2a3a45" roughness={0.8} />
        </mesh>
      ))}

      {/* Shooting bench */}
      <mesh position={[0, -0.08, 9]}>
        <boxGeometry args={[38, 0.18, 4]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>

      {/* Distance markers on floor */}
      {[5, 9, 13].map((z) => (
        <mesh key={z} position={[0, -0.49, -z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[38, 0.08]} />
          <meshBasicMaterial color="#ffffff" opacity={0.15} transparent />
        </mesh>
      ))}

      {/* Targets */}
      {RANGE_TARGET_X.map((x) => (
        <group key={x} position={[x, 0, -14]}>
          {/* Stand pole */}
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.3, 6]} />
            <meshStandardMaterial color="#555" metalness={isLowQuality ? 0 : 0.8} roughness={0.3} />
          </mesh>
          {/* Base */}
          <mesh position={[0, -0.06, 0]} castShadow>
            <boxGeometry args={[0.7, 0.1, 0.45]} />
            <meshStandardMaterial color="#444" roughness={0.7} />
          </mesh>
          {/* Target ring 3 (outer red) */}
          <mesh position={[0, 0.95, 0.01]}>
            <circleGeometry args={[0.42, 14]} />
            <meshStandardMaterial color="#aa1111" emissive="#440000" emissiveIntensity={0.3} side={2} />
          </mesh>
          {/* Target ring 2 (white) */}
          <mesh position={[0, 0.95, 0.02]}>
            <circleGeometry args={[0.28, 14]} />
            <meshStandardMaterial color="#eeeeee" side={2} />
          </mesh>
          {/* Target ring 1 (inner red bull) */}
          <mesh position={[0, 0.95, 0.03]}>
            <circleGeometry args={[0.13, 14]} />
            <meshStandardMaterial color="#dd1111" emissive="#880000" emissiveIntensity={0.6} side={2} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function _spawnBotEnemy(types: EnemyType[], hpMult: number, instakill: boolean, arenaHalf: number): string {
  const type = types[Math.floor(Math.random() * types.length)]
  const side = Math.floor(Math.random() * 4)
  const edge = arenaHalf - 1.5
  const off  = (Math.random() * 2 - 1) * (arenaHalf - 2)
  const pos  = side === 0 ? new THREE.Vector2(-edge, off)
             : side === 1 ? new THREE.Vector2(edge, off)
             : side === 2 ? new THREE.Vector2(off, -edge)
             :              new THREE.Vector2(off, edge)
  const id = `enemy-${++entityStore.enemyIdCounter}`
  entityStore.enemies.set(id, {
    id,
    position: pos,
    health: instakill ? 0.001 : Math.ceil(ENEMY_CONFIGS[type].health * hpMult),
    type,
    hitTime: -999,
    lastDamageTime: -999,
    aiTimer: 0,
    aiState: Math.random() > 0.5 ? 0 : 1,
    shootCooldown: Math.random() / ENEMY_CONFIGS[type].shootRate,
  })
  return id
}

// Projects enemy world positions to screen space each frame so the HUD overlay
// can render off-screen direction markers without touching the game loop.
function EnemyProjector() {
  const { camera, gl } = useThree()
  const _v = new THREE.Vector3()
  useFrame(() => {
    const W = gl.domElement.clientWidth  || window.innerWidth
    const H = gl.domElement.clientHeight || window.innerHeight
    const markers = hudData.enemyMarkers
    markers.length = 0
    for (const [id, e] of entityStore.enemies) {
      _v.set(e.position.x, 0.5, e.position.y).project(camera)
      const sx = (_v.x + 1) / 2
      const sy = (1 - _v.y) / 2
      const inView = _v.z <= 1 && sx >= 0.03 && sx <= 0.97 && sy >= 0.03 && sy <= 0.97
      markers.push({ id, screenX: sx, screenY: sy, inView, angle: Math.atan2(sy - 0.5, sx - 0.5) })
    }
    void H  // H available for future use
    void W
  })
  return null
}

export function GameScene() {
  const { camera, gl } = useThree()
  const input          = useInput()
  const setPhase        = useGameStore((s) => s.setPhase)
  const updateHUD       = useGameStore((s) => s.updateHUD)
  const updateP2HUD     = useGameStore((s) => s.updateP2HUD)
  const setBulletTime   = useGameStore((s) => s.setBulletTime)
  const setEnemyIds     = useGameStore((s) => s.setEnemyIds)
  const setBulletIds        = useGameStore((s) => s.setBulletIds)
  const setEnemyBulletIds   = useGameStore((s) => s.setEnemyBulletIds)
  const enemyBulletIds      = useGameStore((s) => s.enemyBulletIds)
  const setWaveMessage     = useGameStore((s) => s.setWaveMessage)
  const setCameraMode      = useGameStore((s) => s.setCameraMode)
  const updateMutatorHUD   = useGameStore((s) => s.updateMutatorHUD)
  const isPlaytesting      = useGameStore((s) => s.isPlaytesting)
  const setPlaytesting  = useGameStore((s) => s.setPlaytesting)
  const setBigExplosion = useGameStore((s) => s.setBigExplosion)
  const phase           = useGameStore((s) => s.phase)
  const gameModeLive    = useGameStore((s) => s.gameMode)
  const enemyIds        = useGameStore((s) => s.enemyIds)
  const bulletIds       = useGameStore((s) => s.bulletIds)
  const activePlayLevel = useEditorStore((s) => s.activePlayLevel)
  const charScale        = useSettingsStore((s) => s.charScale)
  const graphicsQuality  = useSettingsStore((s) => s.graphicsQuality)
  const isLowQuality     = graphicsQuality === 'low'

  const arenaHalfRef      = useRef(ARENA_HALF)
  const playerGroupRef    = useRef<THREE.Group>(null)
  const player2GroupRef   = useRef<THREE.Group>(null)
  const ambientRef        = useRef<THREE.AmbientLight>(null)
  const dirLightRef       = useRef<THREE.DirectionalLight>(null)
  const grenadeMeshRefs      = useRef<(THREE.Mesh | null)[]>(Array(MAX_GRENADES).fill(null))
  const vernichterMeshRef    = useRef<THREE.Mesh>(null)
  const vernichterLightRef   = useRef<THREE.PointLight>(null)
  const laserBeamMeshRef     = useRef<THREE.Mesh>(null)
  const ionReticleMeshRef    = useRef<THREE.Mesh>(null)
  const ionBeamMeshRefs      = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)]
  const weaponProjMeshRef    = useRef<THREE.Mesh>(null)
  const weaponProjLightRef   = useRef<THREE.PointLight>(null)
  const fpsWeaponRef         = useRef<THREE.Group>(null)
  const MAX_BANANAS = 6
  const bananaMeshRefs       = useRef<(THREE.Mesh | null)[]>(Array(MAX_BANANAS).fill(null))

  const hudTimer      = useRef(0)
  const btTimer       = useRef(0)
  const hudMutTimer   = useRef(0)
  const phaseRef      = useRef(phase)
  const cameraModeRef = useRef<CameraMode>('topdown')
  const activeLevelRef = useRef<Level | null>(null)

  // ── Net refs ──────────────────────────────────────────────────────────────
  const netStateRef      = useRef<NetGameState | null>(null)   // guest: last received host state
  const netGuestInputRef = useRef<NetPlayerInput | null>(null) // host: last received guest input
  const netBroadcastTimer = useRef(0)
  const netSeqRef         = useRef(0)

  // Prevent double-triggering of game over (race between useFrame and phaseRef update)
  const gameOverFiredRef = useRef(false)
  useEffect(() => { if (phase === 'playing') gameOverFiredRef.current = false }, [phase])

  // Edge-detection refs — P1
  const spacePrev  = useRef(false)
  const qPrev      = useRef(false)
  const ePrev      = useRef(false)
  const gPrev      = useRef(false)
  const rPrev      = useRef(false)
  const digitPrev  = useRef<Set<number>>(new Set())
  const firePrev   = useRef(false)
  // Edge-detection refs — P2
  const p2GrenPrev   = useRef(false)
  const p2GpShootPrev = useRef(false)
  const p2GpGrenPrev  = useRef(false)
  const hudP2Timer    = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])

  // Exit pointer lock whenever we leave the playing phase (game over, menu, etc.)
  useEffect(() => {
    if (phase !== 'playing' && cameraModeRef.current === 'fps') {
      document.exitPointerLock()
      cameraModeRef.current = 'topdown'
      setCameraMode('topdown')
    }
  }, [phase, setCameraMode])

  // ── Initialize ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    resetEntityStore()
    const playerHpMult = DIFFICULTY_MULTS[useSettingsStore.getState().difficulty][3]
    entityStore.player.health = Math.round(100 * playerHpMult)
    resetScriptRuntime()
    useGameStore.getState().reset()

    const loadout  = useLoadoutStore.getState()
    const gameMode = useGameStore.getState().gameMode
    const isRange  = gameMode === 'shooting_range'

    // Per-weapon ammo pools
    for (const w of loadout.ownedWeapons) {
      entityStore.weaponAmmo.set(w, isRange ? 9999 : loadout.getMaxAmmoFor(w))
    }
    entityStore.ammo           = isRange ? 9999 : loadout.getMaxAmmo()
    entityStore.maxAmmo        = entityStore.ammo
    entityStore.creditsEarned  = 0
    entityStore.isAkimbo       = loadout.isAkimbo &&
      (loadout.selectedWeapon === 'pistol' || loadout.selectedWeapon === 'smg')
    entityStore.grenadeCount   = isRange ? 99 : 3  // P2 only
    entityStore.vernichterAmmo = loadout.vernichterStock
    entityStore.laserAmmo      = loadout.laserStock
    entityStore.ionAmmo        = loadout.ionStock
    // Override special weapon ammo pools (getMaxAmmoFor returns 0 for these)
    entityStore.weaponAmmo.set('vernichter', loadout.vernichterStock)
    entityStore.weaponAmmo.set('deathlas',   loadout.laserStock)
    entityStore.weaponAmmo.set('ioncan',     loadout.ionStock)
    entityStore.weaponAmmo.set('grenade',    isRange ? 99 : 3)
    entityStore.ammo2          = isRange ? 9999 : loadout.getMaxAmmo()
    entityStore.maxAmmo2       = entityStore.ammo2
    entityStore.grenadeCount2  = isRange ? 99 : 3

    activeLevelRef.current = useEditorStore.getState().activePlayLevel

    // Mutator initialization
    const mutators = useMutatorsStore.getState()
    if (mutators.gameType === 'roundtime' && !isRange) {
      entityStore.roundTimer       = mutators.roundTimeSec
      entityStore.roundTimerActive = true
      entityStore.playerLives      = mutators.lives === 0 ? 999 : mutators.lives
      entityStore.p2Lives          = mutators.lives === 0 ? 999 : mutators.lives
    }
    // Armor from Palantir Suit
    const maxArmor = loadout.ownedEquipment.reduce((m, e) => Math.max(m, EQUIPMENT_CONFIGS[e]?.maxArmor ?? 0), 0)
    entityStore.player.armor = maxArmor
    // BT start charge mode
    if (mutators.btChargeModes.includes('start')) entityStore.focus = FOCUS_MAX

    const diffMult = DIFFICULTY_MULTS[useSettingsStore.getState().difficulty][0]
    if (BOT_GAME_TYPES.has(mutators.gameType) && !isRange) {
      const botTypes = (mutators.botEnemyTypes.length > 0 ? mutators.botEnemyTypes : ['basic']) as EnemyType[]
      const isInstakill = mutators.gameType === 'instakill'
      const ids: string[] = []
      for (let i = 0; i < mutators.botCount; i++) ids.push(_spawnBotEnemy(botTypes, diffMult, isInstakill, arenaHalfRef.current))
      setEnemyIds(ids)
      const modeMsg = (mutators.gameType === 'hardline_solo' || mutators.gameType === 'hardline')
        ? 'HARDLINE — MESSER' : 'DEATHMATCH'
      setWaveMessage(modeMsg)
      setTimeout(() => setWaveMessage(''), 2500)
      if (mutators.gameType === 'hardline_solo' || mutators.gameType === 'hardline') {
        entityStore.ammo = 999
        entityStore.maxAmmo = 999
      }
    } else {
      const ids = spawnWave(1, diffMult)
      if (mutators.gameType === 'instakill_wave') {
        for (const e of entityStore.enemies.values()) e.health = 0.001
      }
      setEnemyIds(ids)
      setWaveMessage(isRange ? 'SCHIESSTAND — Unbegrenzte Munition' : 'Wave 1')
      setTimeout(() => setWaveMessage(''), 2500)
    }
  }, [phase, setEnemyIds, setWaveMessage])

  // ── Camera default ────────────────────────────────────────────────────────
  useEffect(() => {
    camera.position.set(0, 22, 9)
    camera.lookAt(0, 0, -1)
  }, [camera])

  // ── Camera mode cycle (F key: topdown → iso → fps) ───────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && phaseRef.current === 'playing') {
        const next: CameraMode = cameraModeRef.current === 'topdown' ? 'iso'
          : cameraModeRef.current === 'iso' ? 'fps' : 'topdown'
        cameraModeRef.current = next
        setCameraMode(next)
        if (next === 'fps') gl.domElement.requestPointerLock()
        else {
          document.exitPointerLock()
          if (next === 'topdown') { camera.position.set(0, 22, 9); camera.lookAt(0, 0, -1) }
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [camera, gl.domElement, setCameraMode])

  // ── FPS pointer lock ──────────────────────────────────────────────────────
  useEffect(() => {
    let lastX = -1
    const handler = (e: MouseEvent) => {
      if (cameraModeRef.current !== 'fps') return
      if (document.pointerLockElement) {
        entityStore.player.angle += e.movementX * FPS_SENS
      } else {
        // Fallback for iPad/Safari where pointer lock is unavailable
        if (lastX >= 0) entityStore.player.angle += (e.clientX - lastX) * FPS_SENS
        lastX = e.clientX
      }
    }
    const resetLastX = () => { lastX = -1 }
    window.addEventListener('mousemove', handler)
    window.addEventListener('mousedown', resetLastX)
    return () => {
      window.removeEventListener('mousemove', handler)
      window.removeEventListener('mousedown', resetLastX)
    }
  }, [])

  // ── Mousewheel: cycle weapon slots ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (phaseRef.current !== 'playing') return
      e.preventDefault()
      const dir = e.deltaY > 0 ? 1 : -1
      const loadoutNow = useLoadoutStore.getState()
      const slotOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
      const occupied  = slotOrder.filter(s => (WEAPON_SLOT_WEAPONS[s] ?? []).some(w => loadoutNow.ownedWeapons.includes(w)))
      if (occupied.length < 2) return
      const cur  = occupied.indexOf(loadoutNow.activeSlot)
      const next = occupied[(cur + dir + occupied.length) % occupied.length]
      const prev = loadoutNow.selectedWeapon
      const weapon = loadoutNow.switchToSlot(next)
      if (weapon && weapon !== prev) {
        const es = entityStore
        if (!WEAPON_CONFIGS[prev].isVernichter && !WEAPON_CONFIGS[prev].isLaser && !WEAPON_CONFIGS[prev].isIon)
          es.weaponAmmo.set(prev, es.ammo)
        if (WEAPON_CONFIGS[weapon].isVernichter)     { es.ammo = es.vernichterAmmo; es.maxAmmo = 5 }
        else if (WEAPON_CONFIGS[weapon].isLaser)     { es.ammo = es.laserAmmo;      es.maxAmmo = 3 }
        else if (WEAPON_CONFIGS[weapon].isIon)       { es.ammo = es.ionAmmo;        es.maxAmmo = 3 }
        else {
          const nm = loadoutNow.getMaxAmmoFor(weapon)
          es.ammo = es.weaponAmmo.get(weapon) ?? nm
          es.maxAmmo = nm
        }
        es.reloadTimer = 0
      }
    }
    window.addEventListener('wheel', handler, { passive: false })
    return () => window.removeEventListener('wheel', handler)
  }, [])

  // ── Net mode: socket listeners active during gameplay ─────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    const role = useNetStore.getState().role
    if (role === 'offline') return

    if (role === 'host') {
      // Receive guest player state
      const onInput = (inp: NetPlayerInput & { playerId: string }) => {
        netGuestInputRef.current = inp
      }
      socket.on('player_input', onInput)
      return () => { socket.off('player_input', onInput) }
    }

    if (role === 'guest') {
      // Receive authoritative game state from host
      const onState = (ns: NetGameState) => { netStateRef.current = ns }
      const onOver  = (_score: number, _wave: number) => {
        useGameStore.getState().setPhase('gameover')
      }
      const onLeft = () => {
        // Host disconnected — end game
        useGameStore.getState().setPhase('gameover')
      }
      socket.on('game_state',  onState)
      socket.on('game_over',   onOver)
      socket.on('player_left', onLeft)
      return () => {
        socket.off('game_state',  onState)
        socket.off('game_over',   onOver)
        socket.off('player_left', onLeft)
      }
    }
  }, [phase])

  // ── Main game loop ────────────────────────────────────────────────────────
  useFrame((state, delta) => {
    if (phaseRef.current !== 'playing') return

    const rawDt  = Math.min(delta, 0.05)
    const es     = entityStore
    const now    = state.clock.elapsedTime
    const keys   = input.current.keys
    const level  = activeLevelRef.current
    arenaHalfRef.current = level?.arenaHalf ?? ARENA_HALF
    const arenaHalf = arenaHalfRef.current
    const grav   = activeLevelRef.current?.gravity ?? 'normal'
    // Moon: grenades bounce more, travel further; heavy: wider blasts
    const bounceDamp  = grav === 'moon' ? 0.9 : 0.7
    const extraBounce = grav === 'moon' ? 2 : 0
    const bloodIntensity = useSettingsStore.getState().bloodIntensity
    const netRole        = useNetStore.getState().role
    const mobileControls = useSettingsStore.getState().mobileControls
    const [diffHpMult, diffDmgMult, diffSpeedMult, diffPlayerHpMult] = DIFFICULTY_MULTS[useSettingsStore.getState().difficulty]

    // Consume one-shot mobile flags at the top of the frame
    mobileInput.grenadeJust = false  // grenade now fired via slot 7 weapon
    const mobileDiveJust = mobileInput.diveJust;       mobileInput.diveJust       = false
    const mobileWpnPrev  = mobileInput.weaponPrevJust; mobileInput.weaponPrevJust = false
    const mobileWpnNext  = mobileInput.weaponNextJust; mobileInput.weaponNextJust = false
    const mobileCamJust  = mobileInput.cameraModeJust; mobileInput.cameraModeJust = false

    // ── Kill combo timer ──────────────────────────────────────────────────────
    if (es.killComboTimer > 0) {
      es.killComboTimer = Math.max(0, es.killComboTimer - rawDt)
      if (es.killComboTimer === 0) es.killComboCount = 0
    }

    // ── Mutators: round timer & sudden death ──────────────────────────────────
    const mutators = useMutatorsStore.getState()
    const isBotMode = BOT_GAME_TYPES.has(mutators.gameType)
    if (es.roundTimerActive && es.roundTimer > 0) {
      es.roundTimer = Math.max(0, es.roundTimer - rawDt)
      if (es.roundTimer <= 0) {
        if (mutators.suddenDeath) {
          es.inSuddenDeath = true
          es.sdTimer       = mutators.suddenDeathSec
          setWaveMessage('⚠ SUDDEN DEATH')
          setTimeout(() => setWaveMessage(''), 2000)
        } else {
          // Round over — trigger game over
          useLoadoutStore.getState().addCredits(es.creditsEarned)
          setPhase('gameover')
          return
        }
      }
    }
    if (es.inSuddenDeath) {
      es.sdMargin = Math.min(arenaHalf - 1,
        es.sdMargin + (arenaHalf / mutators.suddenDeathSec) * rawDt)
      es.sdTimer  = Math.max(0, es.sdTimer - rawDt)
      // Damage players in danger zone
      const inZone = (x: number, z: number) =>
        Math.abs(x) > arenaHalf - es.sdMargin || Math.abs(z) > arenaHalf - es.sdMargin
      if (inZone(es.player.position.x, es.player.position.y))
        es.player.health -= 18 * rawDt
      if (es.sdTimer <= 0) { setPhase('gameover'); return }
    }

    // ── Net: apply host→guest game state ──────────────────────────────────────
    if (netRole === 'guest' && netStateRef.current) {
      const ns = netStateRef.current
      netStateRef.current = null
      // Host player → P2 slot so both players are visible on guest's screen
      const hostSnap = ns.players.find((p) => p.id === 'host')
      if (hostSnap) {
        es.player2Active      = true
        es.player2.position.x = hostSnap.x
        es.player2.position.y = hostSnap.z
        es.player2.angle      = hostSnap.a
        es.player2.health     = hostSnap.h
        es.ammo2              = hostSnap.ammo
      }
      // Sync enemies from host (authoritative)
      const incomingIds = new Set(ns.enemies.map((e) => e.id))
      for (const eid of es.enemies.keys()) {
        if (!incomingIds.has(eid)) es.enemies.delete(eid)
      }
      for (const snap of ns.enemies) {
        const existing = es.enemies.get(snap.id)
        if (existing) {
          existing.position.x = snap.x
          existing.position.y = snap.z
          existing.health     = snap.h
        } else {
          const cfg = ENEMY_CONFIGS[snap.type as EnemyType]
          if (cfg) {
            es.enemies.set(snap.id, {
              id: snap.id, type: snap.type as EnemyType,
              position: new THREE.Vector2(snap.x, snap.z),
              health: snap.h, hitTime: -10, lastDamageTime: -10,
              aiTimer: 0, aiState: 0, shootCooldown: Math.random() / cfg.shootRate,
            })
          }
        }
      }
      setEnemyIds(Array.from(es.enemies.keys()))
      es.score = ns.score
      es.wave  = ns.wave
    }

    // ── Net: apply guest→host player input ────────────────────────────────────
    if (netRole === 'host' && netGuestInputRef.current) {
      const inp = netGuestInputRef.current
      netGuestInputRef.current = null
      if (!es.player2Active) {
        es.player2Active = true
        es.player2.position.set(inp.x, inp.z)
        es.player2.health = 100
        es.ammo2          = es.maxAmmo2
        es.grenadeCount2  = 3
      }
      if (es.player2.health > 0) {
        es.player2.position.x = inp.x
        es.player2.position.y = inp.z
        es.player2.angle      = inp.a
        // Health remains authoritative on host (enemy contact damage applied locally)
      }
    }

    // ── Edge detection ────────────────────────────────────────────────────────
    const spaceDown = keys.has('Space')
    const qDown     = keys.has('KeyQ')
    const eDown     = keys.has('KeyE')
    const rDown     = keys.has('KeyR')
    const spaceJust = (spaceDown && !spacePrev.current) || mobileDiveJust
    const qJust     = qDown && !qPrev.current
    const eJust     = eDown && !ePrev.current
    const rJust     = rDown && !rPrev.current
    spacePrev.current = spaceDown
    qPrev.current     = qDown
    ePrev.current     = eDown
    gPrev.current     = keys.has('KeyG')
    rPrev.current     = rDown

    // ── Number keys 1-0: slot-based weapon switching (with cycling) ──────────
    {
      const loadoutNow = useLoadoutStore.getState()
      const slotOrder  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
      for (const slot of slotOrder) {
        const keyCode = slot === 0 ? 'Digit0' : `Digit${slot}`
        const isDown  = keys.has(keyCode)
        const wasDown = digitPrev.current.has(slot)
        if (isDown && !wasDown) {
          const prevWeapon = loadoutNow.selectedWeapon
          const weapon     = loadoutNow.switchToSlot(slot)
          if (weapon && weapon !== prevWeapon) {
            const prevCfg = WEAPON_CONFIGS[prevWeapon]
            if (!prevCfg.isVernichter && !prevCfg.isLaser && !prevCfg.isIon)
              es.weaponAmmo.set(prevWeapon, es.ammo)
            const wcfg = WEAPON_CONFIGS[weapon]
            if (wcfg.isVernichter)     { es.ammo = es.vernichterAmmo; es.maxAmmo = 5 }
            else if (wcfg.isLaser)     { es.ammo = es.laserAmmo;      es.maxAmmo = 3 }
            else if (wcfg.isIon)       { es.ammo = es.ionAmmo;        es.maxAmmo = 3 }
            else {
              const nm = loadoutNow.getMaxAmmoFor(weapon)
              es.ammo    = es.weaponAmmo.get(weapon) ?? nm
              es.maxAmmo = nm
            }
            es.reloadTimer = 0
          }
          break
        }
      }
      // Update digit edge-detection set
      const next = new Set<number>()
      for (const slot of slotOrder) {
        if (keys.has(slot === 0 ? 'Digit0' : `Digit${slot}`)) next.add(slot)
      }
      digitPrev.current = next
    }

    // ── Mobile: prev/next slot ────────────────────────────────────────────────
    if (mobileWpnPrev || mobileWpnNext) {
      const loadoutNow = useLoadoutStore.getState()
      const slotOrder  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
      const occupied   = slotOrder.filter(s => (WEAPON_SLOT_WEAPONS[s] ?? []).some(w => loadoutNow.ownedWeapons.includes(w)))
      if (occupied.length > 1) {
        const dir     = mobileWpnNext ? 1 : occupied.length - 1
        const cur     = occupied.indexOf(loadoutNow.activeSlot)
        const next    = occupied[(cur + dir) % occupied.length]
        const prevWeapon = loadoutNow.selectedWeapon
        const weapon     = loadoutNow.switchToSlot(next)
        if (weapon && weapon !== prevWeapon) {
          const prevCfg = WEAPON_CONFIGS[prevWeapon]
          if (!prevCfg.isVernichter && !prevCfg.isLaser && !prevCfg.isIon)
            es.weaponAmmo.set(prevWeapon, es.ammo)
          const wcfg = WEAPON_CONFIGS[weapon]
          if (wcfg.isVernichter)     { es.ammo = es.vernichterAmmo; es.maxAmmo = 5 }
          else if (wcfg.isLaser)     { es.ammo = es.laserAmmo;      es.maxAmmo = 3 }
          else if (wcfg.isIon)       { es.ammo = es.ionAmmo;        es.maxAmmo = 3 }
          else {
            const nm = loadoutNow.getMaxAmmoFor(weapon)
            es.ammo    = es.weaponAmmo.get(weapon) ?? nm
            es.maxAmmo = nm
          }
          es.reloadTimer = 0
        }
      }
    }

    // ── Mobile: camera mode cycle (topdown → iso → fps) ─────────────────────
    if (mobileCamJust) {
      const next: CameraMode = cameraModeRef.current === 'topdown' ? 'iso'
        : cameraModeRef.current === 'iso' ? 'fps' : 'topdown'
      cameraModeRef.current = next
      setCameraMode(next)
      if (next === 'topdown') { camera.position.set(0, 22, 9); camera.lookAt(0, 0, -1) }
    }

    // ── Melee swing timer ────────────────────────────────────────────────────
    if (es.meleeSwing > 0) es.meleeSwing = Math.max(0, es.meleeSwing - rawDt)

    // ── R: reload ─────────────────────────────────────────────────────────────
    const gameMode2 = useGameStore.getState().gameMode
    if (rJust && es.reloadTimer <= 0 && es.ammo < es.maxAmmo && gameMode2 !== 'shooting_range'
      && !WEAPON_CONFIGS[useLoadoutStore.getState().selectedWeapon].isMelee) {
      es.reloadTimer = WEAPON_CONFIGS[useLoadoutStore.getState().selectedWeapon].reloadTime
    }
    if (es.reloadTimer > 0) {
      es.reloadTimer -= rawDt
      if (es.reloadTimer <= 0) {
        es.reloadTimer = 0
        es.ammo = es.maxAmmo
        es.weaponAmmo.set(useLoadoutStore.getState().selectedWeapon, es.ammo)
      }
    }

    // ── Bullet time ───────────────────────────────────────────────────────────
    const btMuts     = useMutatorsStore.getState()
    const wantBT     = keys.has('ShiftLeft') || keys.has('ShiftRight') || mobileInput.btDown
    const maneuverBT = es.maneuver !== 'none'
    const btDrain    = 100 / Math.max(1, btMuts.btDuration)
    const btRegen    = btMuts.btChargeModes.includes('time') ? FOCUS_REGEN_RATE : 0

    if (maneuverBT) {
      es.isBulletTime = true
    } else if (wantBT && es.focus >= FOCUS_MIN_ACTIVATE) {
      es.isBulletTime = true
      es.focus = Math.max(0, es.focus - btDrain * delta)
      if (es.focus === 0) es.isBulletTime = false
    } else {
      es.isBulletTime = false
      es.focus = Math.min(FOCUS_MAX, es.focus + btRegen * delta)
    }

    // ── Power-up timers ───────────────────────────────────────────────────────
    if (es.player.quadDamageTimer > 0) es.player.quadDamageTimer = Math.max(0, es.player.quadDamageTimer - rawDt)
    if (es.player.berserkerTimer  > 0) es.player.berserkerTimer  = Math.max(0, es.player.berserkerTimer  - rawDt)

    const timeScale = es.isBulletTime ? BULLET_TIME_SCALE : 1.0
    const dt        = rawDt * timeScale
    const playerDt  = es.isBulletTime ? rawDt * BULLET_TIME_PLAYER_REAL : rawDt

    // ── Lighting ──────────────────────────────────────────────────────────────
    if (ambientRef.current) {
      ambientRef.current.color.lerp(es.isBulletTime ? _btAmbientColor : _normalAmbientColor, 0.07)
      // Low quality uses higher ambient intensity to compensate for absent directional light
      const targetIntensity = isLowQuality
        ? (es.isBulletTime ? 1.4 : 1.6)
        : (es.isBulletTime ? 0.7 : 0.25)
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, targetIntensity, 0.07)
    }
    if (dirLightRef.current) {
      dirLightRef.current.color.lerp(es.isBulletTime ? _btDirColor : _normalDirColor, 0.07)
      dirLightRef.current.intensity = THREE.MathUtils.lerp(dirLightRef.current.intensity, es.isBulletTime ? 0.5 : 1.2, 0.07)
    }

    // ── Aim direction ─────────────────────────────────────────────────────────
    if ((cameraModeRef.current !== 'fps' || mobileControls) && es.maneuver !== 'spin' && es.maneuver !== 'gunkata') {
      if (mobileControls) {
        // Auto-aim at nearest enemy
        let nearDist = Infinity
        for (const enemy of es.enemies.values()) {
          const d = Math.hypot(enemy.position.x - es.player.position.x, enemy.position.y - es.player.position.y)
          if (d < nearDist) {
            nearDist = d
            es.player.angle = Math.atan2(
              enemy.position.x - es.player.position.x,
              -(enemy.position.y - es.player.position.y),
            )
          }
        }
      } else {
        _raycaster.setFromCamera(state.pointer, camera)
        _raycaster.ray.intersectPlane(_groundPlane, _mouseTarget)
        es.mouseWorld.copy(_mouseTarget)
        _toMouse.set(es.mouseWorld.x - es.player.position.x, es.mouseWorld.z - es.player.position.y)
        if (_toMouse.lengthSq() > 0.01) es.player.angle = Math.atan2(_toMouse.x, -_toMouse.y)
      }
    }
    _toMouse.set(Math.sin(es.player.angle), -Math.cos(es.player.angle))

    // ── Cooldowns ─────────────────────────────────────────────────────────────
    if (es.diveCooldown > 0) es.diveCooldown -= rawDt
    if (es.spinCooldown > 0) es.spinCooldown -= rawDt

    // ── Trigger: Hechtsprung (Space + WASD) ───────────────────────────────────
    if (spaceJust && es.maneuver === 'none' && es.diveCooldown <= 0) {
      let ddx = 0, ddz = 0
      if (keys.has('KeyW') || keys.has('ArrowUp'))    ddz -= 1
      if (keys.has('KeyS') || keys.has('ArrowDown'))  ddz += 1
      if (keys.has('KeyA') || keys.has('ArrowLeft'))  ddx -= 1
      if (keys.has('KeyD') || keys.has('ArrowRight')) ddx += 1
      if (ddx === 0 && ddz === 0) { ddx = _toMouse.x; ddz = _toMouse.y }
      // FPS mode: transform screen-space WASD into camera-relative world direction
      if (cameraModeRef.current === 'fps' && (ddx !== 0 || ddz !== 0)) {
        const fwdX = Math.sin(es.player.angle), fwdZ = -Math.cos(es.player.angle)
        const rtX  = Math.cos(es.player.angle), rtZ  =  Math.sin(es.player.angle)
        const mx = fwdX * (-ddz) + rtX * ddx
        const mz = fwdZ * (-ddz) + rtZ * ddx
        ddx = mx; ddz = mz
      }
      const dlen = Math.sqrt(ddx * ddx + ddz * ddz)
      es.maneuverDx    = ddx / dlen
      es.maneuverDz    = ddz / dlen
      es.maneuver      = 'dive'
      es.maneuverTimer = DIVE_DURATION
    }

    // ── Trigger: Ballett-Spin (Q/E, only when akimbo) ─────────────────────────
    const balletDuration    = mutators.balletDuration
    const balletBulletCount = mutators.balletBulletCount
    const balletSpeedMult   = mutators.balletSpeed
    if ((qJust || eJust) && es.maneuver === 'none' && es.spinCooldown <= 0 && es.isAkimbo) {
      es.spinDir       = qJust ? -1 : 1
      es.maneuver      = 'spin'
      es.maneuverTimer = balletDuration
      es.spinFireTimer = 0
    }

    // ── Trigger: Gun Kata (G key) ──────────────────────────────────────────────
    const gJust = keys.has('KeyG') && !gPrev.current
    if (gJust && es.maneuver === 'none' && es.gunKataCooldown <= 0 && mutators.gunKataEnabled) {
      es.maneuver      = 'gunkata'
      es.maneuverTimer = mutators.gunKataDuration
      es.gunKataFireTimer = 0
      // Pre-sort enemies by distance for targeting
      const sorted = [...es.enemies.values()].sort((a, b) => {
        const da = Math.hypot(a.position.x - es.player.position.x, a.position.y - es.player.position.y)
        const db = Math.hypot(b.position.x - es.player.position.x, b.position.y - es.player.position.y)
        return da - db
      })
      es.gunKataTargetQueue = sorted.slice(0, mutators.gunKataTargets).map(e => e.id)
    }

    // ── Player movement ───────────────────────────────────────────────────────
    let dx = 0, dz = 0

    if (es.maneuver === 'dive') {
      dx = es.maneuverDx
      dz = es.maneuverDz
      es.maneuverTimer -= rawDt
      if (es.maneuverTimer <= 0) {
        es.maneuver     = 'none'
        es.diveCooldown = DIVE_COOLDOWN
      }
    } else if (es.maneuver === 'spin') {
      // No WASD movement during spin, just rotate
      const spinRate = (Math.PI * 2 * 1.5) / balletDuration * balletSpeedMult
      es.player.angle += es.spinDir * spinRate * rawDt
      _toMouse.set(Math.sin(es.player.angle), -Math.cos(es.player.angle))
      es.maneuverTimer -= rawDt
      if (es.maneuverTimer <= 0) {
        es.maneuver     = 'none'
        es.spinCooldown = SPIN_COOLDOWN
      }
    } else if (es.maneuver === 'gunkata') {
      // Gun Kata: player can still move but auto-aims + fires at queued targets
      if (keys.has('KeyW') || keys.has('ArrowUp'))    dz -= 1
      if (keys.has('KeyS') || keys.has('ArrowDown'))  dz += 1
      if (keys.has('KeyA') || keys.has('ArrowLeft'))  dx -= 1
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1
      if (mobileControls) { dx += mobileInput.dx; dz += mobileInput.dz }
      es.maneuverTimer -= rawDt
      if (es.maneuverTimer <= 0) {
        es.maneuver      = 'none'
        es.gunKataCooldown = mutators.gunKataDuration * 2
        es.gunKataTargetQueue = []
      }
    } else {
      if (keys.has('KeyW') || keys.has('ArrowUp'))    dz -= 1
      if (keys.has('KeyS') || keys.has('ArrowDown'))  dz += 1
      if (keys.has('KeyA') || keys.has('ArrowLeft'))  dx -= 1
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1
      if (mobileControls) { dx += mobileInput.dx; dz += mobileInput.dz }

      if (cameraModeRef.current === 'fps' && (dx !== 0 || dz !== 0)) {
        const fwdX = Math.sin(es.player.angle), fwdZ = -Math.cos(es.player.angle)
        const rtX  = Math.cos(es.player.angle), rtZ  =  Math.sin(es.player.angle)
        const mx   = fwdX * (-dz) + rtX * dx
        const mz   = fwdZ * (-dz) + rtZ * dx
        const len  = Math.sqrt(mx * mx + mz * mz)
        dx = len > 0 ? mx / len : 0
        dz = len > 0 ? mz / len : 0
      } else if (cameraModeRef.current === 'iso' && (dx !== 0 || dz !== 0)) {
        // Transform WASD through ISO camera's ground-projected axes
        // Camera offset ~(+15, 20, -8) → forward=(-15/17, 8/17), right=(8/17, 15/17)
        const ISO_FX = -15 / 17, ISO_FZ = 8 / 17
        const ISO_RX = 8 / 17,   ISO_RZ = 15 / 17
        const mx  = ISO_FX * (-dz) + ISO_RX * dx
        const mz  = ISO_FZ * (-dz) + ISO_RZ * dx
        const len = Math.sqrt(mx * mx + mz * mz)
        dx = len > 0 ? mx / len : 0
        dz = len > 0 ? mz / len : 0
      } else if (dx !== 0 || dz !== 0) {
        const len = Math.sqrt(dx * dx + dz * dz)
        dx /= len; dz /= len
      }
    }

    const moveSpeed = es.maneuver === 'dive' ? DIVE_SPEED : PLAYER_SPEED
    const bound     = arenaHalf - PLAYER_RADIUS - 0.5
    let nx = Math.max(-bound, Math.min(bound, es.player.position.x + dx * moveSpeed * playerDt))
    let nz = Math.max(-bound, Math.min(bound, es.player.position.y + dz * moveSpeed * playerDt))
    if (level) { const r = resolveCircleVsLevel(nx, nz, PLAYER_RADIUS, level); nx = r.x; nz = r.z }
    es.player.position.x = nx
    es.player.position.y = nz

    // ── Camera ────────────────────────────────────────────────────────────────
    const camMode = cameraModeRef.current
    if (camMode === 'fps') {
      camera.position.set(es.player.position.x, 0.7, es.player.position.y)
      camera.lookAt(
        es.player.position.x + Math.sin(es.player.angle) * 10,
        0.7,
        es.player.position.y - Math.cos(es.player.angle) * 10,
      )
    } else if (camMode === 'iso') {
      // Max Payne-style isometric: player-following diagonal view
      const tx = es.player.position.x * 0.5 + 15
      const tz = es.player.position.y * 0.5 - 8
      camera.position.lerp(new THREE.Vector3(tx, 20, tz), 0.08)
      camera.lookAt(es.player.position.x, 0, es.player.position.y)
    } else {
      // topdown — always follow player with smooth lerp
      const px = es.player.position.x
      const pz = es.player.position.y
      camera.position.lerp(new THREE.Vector3(px, 22, pz + 9), 0.1)
      camera.lookAt(px, 0, pz - 1)
    }

    // ── FPS weapon arm ────────────────────────────────────────────────────────
    if (fpsWeaponRef.current) {
      const showFPS = camMode === 'fps' && useSettingsStore.getState().showFPSWeapon
      if (showFPS) {
        const angle  = es.player.angle
        const fwdX   = Math.sin(angle)
        const fwdZ   = -Math.cos(angle)
        const rX     = Math.cos(angle)
        const rZ     = Math.sin(angle)
        fpsWeaponRef.current.position.set(
          es.player.position.x + fwdX * 0.32 + rX * 0.18,
          0.52,
          es.player.position.y + fwdZ * 0.32 + rZ * 0.18,
        )
        fpsWeaponRef.current.rotation.y = -angle
        fpsWeaponRef.current.visible = true
      } else {
        fpsWeaponRef.current.visible = false
      }
    }

    // ── Player mesh ───────────────────────────────────────────────────────────
    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(es.player.position.x, 0, es.player.position.y)
      playerGroupRef.current.rotation.y = -es.player.angle
      playerGroupRef.current.visible    = cameraModeRef.current !== 'fps'
    }

    // ── Weapon config (used by both P1 and P2 shooting) ──────────────────────
    const loadout          = useLoadoutStore.getState()
    const isHardlineMode   = mutators.gameType === 'hardline_solo' || mutators.gameType === 'hardline'
    const activeWeaponId   = isHardlineMode
      ? HARDLINE_WEAPONS[Math.min(es.hardlineProgress, HARDLINE_WEAPONS.length - 1)]
      : loadout.selectedWeapon
    const weaponCfg        = WEAPON_CONFIGS[activeWeaponId]
    const quadActive       = es.player.quadDamageTimer > 0
    const quadMult         = quadActive ? 4 : 1
    const finalDamage      = (weaponCfg.baseDamage + AMMO_CONFIGS[loadout.selectedAmmo].damageBonus) * quadMult
    const isEnergy         = activeWeaponId === 'blaster' || activeWeaponId === 'plasma'
    const isFlakWep        = activeWeaponId === 'flak'
    es.isAkimbo            = loadout.isAkimbo && (activeWeaponId === 'pistol' || activeWeaponId === 'smg')
    const shootMuts        = useMutatorsStore.getState()
    const mutBounceCount   = shootMuts.bulletBounce
      ? (shootMuts.bulletBounceCount === 0 ? 999 : shootMuts.bulletBounceCount)
      : 0
    // Weapon-native bounces (e.g. Flak: 3, Banana: 5) apply regardless of mutator;
    // mutator can add more bounces on top, but never removes native ones.
    const nativeBounces    = weaponCfg.maxBounces ?? 0
    const bulletMaxBounces = mutBounceCount === 999 ? 999 : Math.max(nativeBounces, mutBounceCount)

    // ── Player 2 — local co-op (skipped in net mode; P2 driven by network) ───
    if (netRole !== 'offline') {
      // Show P2 mesh at position set by net receive block above
      if (es.player2Active && player2GroupRef.current) {
        player2GroupRef.current.position.set(es.player2.position.x, 0, es.player2.position.y)
        player2GroupRef.current.rotation.y = -es.player2.angle
        player2GroupRef.current.visible    = true
      }
    }
    if (netRole === 'offline') {
      // Read gamepad for P2 (any connected gamepad)
      const gamepads = navigator.getGamepads()
      const gp = gamepads[0] ?? gamepads[1] ?? null

      const p2ArrowUp    = keys.has('ArrowUp')
      const p2ArrowDown  = keys.has('ArrowDown')
      const p2ArrowLeft  = keys.has('ArrowLeft')
      const p2ArrowRight = keys.has('ArrowRight')
      const p2ShootKey   = keys.has('ControlRight') || keys.has('NumpadEnter')
      const p2GrenKey    = keys.has('ShiftRight')   || keys.has('Numpad0')

      const gpLX  = gp ? (Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0) : 0
      const gpLY  = gp ? (Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0) : 0
      const gpRX  = gp ? (Math.abs(gp.axes[2]) > 0.15 ? gp.axes[2] : 0) : 0
      const gpRY  = gp ? (Math.abs(gp.axes[3]) > 0.15 ? gp.axes[3] : 0) : 0
      const gpShoot = gp ? (gp.buttons[7]?.pressed || gp.buttons[5]?.pressed) : false
      const gpGren  = gp ? (gp.buttons[4]?.pressed || gp.buttons[6]?.pressed) : false

      const p2Moving = p2ArrowUp || p2ArrowDown || p2ArrowLeft || p2ArrowRight
        || Math.abs(gpLX) > 0.15 || Math.abs(gpLY) > 0.15

      // Activate P2 on first input
      if ((p2Moving || p2ShootKey || gp) && !es.player2Active) {
        es.player2Active = true
        es.player2.position.set(es.player.position.x + 1.5, es.player.position.y + 1.5)
      }

      if (es.player2Active && es.player2.health > 0) {
        const p2 = es.player2

        // Movement
        let p2dx = 0, p2dz = 0
        if (p2ArrowUp)    p2dz -= 1
        if (p2ArrowDown)  p2dz += 1
        if (p2ArrowLeft)  p2dx -= 1
        if (p2ArrowRight) p2dx += 1
        if (Math.abs(gpLX) > 0.15) p2dx += gpLX
        if (Math.abs(gpLY) > 0.15) p2dz += gpLY
        if (p2dx !== 0 || p2dz !== 0) {
          const plen = Math.sqrt(p2dx * p2dx + p2dz * p2dz)
          p2dx /= plen; p2dz /= plen
          let p2x = Math.max(-arenaHalf + PLAYER_RADIUS + 0.5, Math.min(arenaHalf - PLAYER_RADIUS - 0.5, p2.position.x + p2dx * PLAYER_SPEED * playerDt))
          let p2z = Math.max(-arenaHalf + PLAYER_RADIUS + 0.5, Math.min(arenaHalf - PLAYER_RADIUS - 0.5, p2.position.y + p2dz * PLAYER_SPEED * playerDt))
          if (level) { const r = resolveCircleVsLevel(p2x, p2z, PLAYER_RADIUS, level); p2x = r.x; p2z = r.z }
          p2.position.x = p2x
          p2.position.y = p2z
          // Face movement direction
          p2.angle = Math.atan2(p2dx, -p2dz)
        }

        // Gamepad right-stick aim override
        if (Math.abs(gpRX) > 0.15 || Math.abs(gpRY) > 0.15) {
          p2.angle = Math.atan2(gpRX, -gpRY)
        } else if (!p2Moving) {
          // Auto-aim at nearest enemy when stationary
          let nearDist = Infinity
          for (const enemy of es.enemies.values()) {
            const d = Math.hypot(enemy.position.x - p2.position.x, enemy.position.y - p2.position.y)
            if (d < nearDist) {
              nearDist = d
              p2.angle = Math.atan2(enemy.position.x - p2.position.x, -(enemy.position.y - p2.position.y))
            }
          }
        }

        const p2ToMouse = new THREE.Vector2(Math.sin(p2.angle), -Math.cos(p2.angle))

        // Shooting
        p2.shootCooldown -= delta
        const p2ShootNow = p2ShootKey || gpShoot
        const p2ShootJust = gpShoot && !p2GpShootPrev.current
        p2GpShootPrev.current = gpShoot
        if ((p2ShootNow && !gpShoot) || p2ShootJust) {
          if (p2.shootCooldown <= 0 && es.ammo2 > 0) {
            p2.shootCooldown = weaponCfg.shootCooldown
            for (let pp = 0; pp < weaponCfg.pellets; pp++) {
              const ang = Math.atan2(p2ToMouse.x, p2ToMouse.y) + (Math.random() - 0.5) * 2 * weaponCfg.spread
              const bDir = new THREE.Vector2(Math.sin(ang), Math.cos(ang))
              const bid = `bullet-${++es.bulletIdCounter}`
              es.bullets.set(bid, {
                id: bid,
                position: new THREE.Vector2(
                  p2.position.x + bDir.x * (PLAYER_RADIUS + 0.2),
                  p2.position.y + bDir.y * (PLAYER_RADIUS + 0.2),
                ),
                velocity: new THREE.Vector2(bDir.x * weaponCfg.bulletSpeed, bDir.y * weaponCfg.bulletSpeed),
                lifetime: BULLET_LIFETIME,
                damage: finalDamage,
                bounces: 0,
                maxBounces: bulletMaxBounces,
                isEnergy,
                isFlak: isFlakWep,
              })
            }
            es.ammo2 = Math.max(0, es.ammo2 - 1)
            WEAPON_SOUNDS[loadout.selectedWeapon]?.()
            setBulletIds(Array.from(es.bullets.keys()))
          }
        }

        // Grenade
        const p2GrenNow = p2GrenKey
        const p2GrenGpNow = gpGren && !p2GpGrenPrev.current
        p2GpGrenPrev.current = gpGren
        const p2GrenJust = (p2GrenNow && !p2GrenPrev.current) || p2GrenGpNow
        p2GrenPrev.current = p2GrenNow
        if (p2GrenJust && es.grenadeCount2 > 0) {
          es.grenadeCount2--
          es.grenades.push({
            id:      `grenade-${++es.grenadeIdCounter}`,
            x:       p2.position.x + p2ToMouse.x * (PLAYER_RADIUS + 0.3),
            z:       p2.position.y + p2ToMouse.y * (PLAYER_RADIUS + 0.3),
            vx:      p2ToMouse.x * GRENADE_SPEED,
            vz:      p2ToMouse.y * GRENADE_SPEED,
            timer:   GRENADE_FUSE,
            bounces: 0,
          })
        }

        // P2 mesh position
        if (player2GroupRef.current) {
          player2GroupRef.current.position.set(p2.position.x, 0, p2.position.y)
          player2GroupRef.current.rotation.y = -p2.angle
          player2GroupRef.current.visible = true
        }
      } else if (player2GroupRef.current) {
        player2GroupRef.current.visible = !es.player2Active
      }
    }

    // ── Shooting ──────────────────────────────────────────────────────────────
    es.player.shootCooldown -= delta
    // In chaos mode: block shooting unless a chaos weapon is held
    const chaosModeActive = mutators.chaosMode && useGameStore.getState().gameMode !== 'shooting_range'
    const canShootChaos   = !chaosModeActive || (es.chaosWeaponId !== null && es.chaosAmmo > 0)
    const rawFire    = input.current.mouseButtons.has(0) || (mobileControls && mobileInput.fire)
    const isShooting = rawFire && es.reloadTimer <= 0 && (canShootChaos || weaponCfg.isMelee)
    const fireJust   = rawFire && !firePrev.current
    firePrev.current = rawFire

    // Helper: spawn one regular bullet
    const spawnBullet = (angle: number, lateralOff = 0) => {
      for (let p = 0; p < weaponCfg.pellets; p++) {
        const ang  = angle + (Math.random() - 0.5) * 2 * weaponCfg.spread + lateralOff
        const bDir = new THREE.Vector2(Math.sin(ang), Math.cos(ang))
        const bid  = `bullet-${++es.bulletIdCounter}`
        es.bullets.set(bid, {
          id: bid,
          position: new THREE.Vector2(
            es.player.position.x + bDir.x * (PLAYER_RADIUS + 0.2),
            es.player.position.y + bDir.y * (PLAYER_RADIUS + 0.2),
          ),
          velocity: new THREE.Vector2(bDir.x * weaponCfg.bulletSpeed, bDir.y * weaponCfg.bulletSpeed),
          lifetime: BULLET_LIFETIME,
          damage:   finalDamage,
          bounces:  0,
          maxBounces: bulletMaxBounces,
          isEnergy,
          isFlak: isFlakWep,
        })
      }
    }

    // Helper: splash explosion (plasma / bazooka / banana / bfg)
    const doSplash = (sx: number, sz: number, radius: number, dmg: number, isLarge: boolean, skipPlayer = false) => {
      if (isLarge) playExplosionLarge()
      else         playExplosionSmall()
      spawnParticles(sx, sz, 'explosion', EXPL_COUNTS[bloodIntensity])
      spawnParticles(sx, sz, 'spark', SPARK_COUNTS[bloodIntensity])
      spawnDecal(sx, sz, radius * 0.7)
      for (const [eid, enemy] of es.enemies) {
        if (enemiesToRemove.includes(eid)) continue
        _diff.set(sx - enemy.position.x, sz - enemy.position.y)
        const dist = _diff.length()
        if (dist < radius) {
          const falloff = 1 - dist / radius
          enemy.health -= Math.round(dmg * falloff)
          enemy.hitTime = now
          spawnParticles(enemy.position.x, enemy.position.y, 'blood', BLOOD_COUNTS[bloodIntensity])
          if (enemy.health <= 0 && !enemiesToRemove.includes(eid)) {
            enemiesToRemove.push(eid)
            scoreGained   += ENEMY_CONFIGS[enemy.type].scoreValue
            creditsGained += ENEMY_CONFIGS[enemy.type].creditValue
            playDeath(0.45)
          }
        }
      }
      if (!skipPlayer && !useMutatorsStore.getState().godMode && es.player.berserkerTimer <= 0) {
        _diff.set(sx - es.player.position.x, sz - es.player.position.y)
        if (_diff.length() < radius && now > es.player.invincibleUntil) {
          const falloff = 1 - _diff.length() / radius
          const splashDmg = Math.round(dmg * 0.5 * falloff)
          if (es.player.armor > 0) {
            const absorbed = Math.min(es.player.armor, splashDmg)
            es.player.armor = Math.max(0, es.player.armor - absorbed)
            const remain = splashDmg - absorbed
            if (remain > 0) es.player.health -= remain
          } else {
            es.player.health -= splashDmg
          }
          es.player.invincibleUntil = now + INVINCIBLE_DURATION
        }
      }
    }

    // ── Burst fire continuation ───────────────────────────────────────────────
    if (es.burstRemaining > 0) {
      es.burstTimer -= rawDt
      if (es.burstTimer <= 0 && es.ammo > 0) {
        es.burstRemaining--
        es.burstTimer = weaponCfg.burstDelay ?? 0.05
        const bAngle = Math.atan2(_toMouse.x, _toMouse.y)
        spawnBullet(bAngle)
        WEAPON_SOUNDS[activeWeaponId]?.()
        es.ammo = Math.max(0, es.ammo - 1)
        setBulletIds(Array.from(es.bullets.keys()))
      }
    }

    // Spin auto-fire (configurable bullet count + speed)
    if (es.maneuver === 'spin' && es.ammo >= balletBulletCount) {
      es.spinFireTimer -= rawDt
      if (es.spinFireTimer <= 0) {
        es.spinFireTimer = SPIN_FIRE_RATE / balletSpeedMult
        const baseAng = Math.atan2(_toMouse.x, _toMouse.y)
        const spread  = balletBulletCount > 1 ? 0.24 / (balletBulletCount - 1) : 0
        const startOff = balletBulletCount > 1 ? -0.12 : 0
        for (let bi = 0; bi < balletBulletCount; bi++) {
          const ang  = baseAng + startOff + bi * spread
          const bDir = new THREE.Vector2(Math.sin(ang), Math.cos(ang))
          const bid  = `bullet-${++es.bulletIdCounter}`
          es.bullets.set(bid, {
            id: bid,
            position: new THREE.Vector2(
              es.player.position.x + bDir.x * (PLAYER_RADIUS + 0.2),
              es.player.position.y + bDir.y * (PLAYER_RADIUS + 0.2),
            ),
            velocity: new THREE.Vector2(bDir.x * weaponCfg.bulletSpeed * balletSpeedMult, bDir.y * weaponCfg.bulletSpeed * balletSpeedMult),
            lifetime: BULLET_LIFETIME,
            damage:   finalDamage,
            bounces:  0,
            maxBounces: bulletMaxBounces,
            isEnergy,
            isFlak: isFlakWep,
          })
        }
        es.ammo = Math.max(0, es.ammo - balletBulletCount)
        WEAPON_SOUNDS[activeWeaponId]?.()
        setBulletIds(Array.from(es.bullets.keys()))
      }
    }

    // Gun Kata auto-fire (targets queued enemies in slowmo)
    if (es.maneuver === 'gunkata' && es.ammo > 0) {
      es.isBulletTime = true  // activate slowmo during Gun Kata
      es.gunKataFireTimer -= rawDt
      if (es.gunKataFireTimer <= 0 && es.gunKataTargetQueue.length > 0) {
        es.gunKataFireTimer = mutators.gunKataDuration / (mutators.gunKataTargets * 2)
        const targetId = es.gunKataTargetQueue.shift()!
        const target   = es.enemies.get(targetId)
        if (target) {
          const dx2 = target.position.x - es.player.position.x
          const dz2 = target.position.y - es.player.position.y
          const len2 = Math.hypot(dx2, dz2)
          if (len2 > 0.01) {
            const bDir = new THREE.Vector2(dx2 / len2, dz2 / len2)
            // Auto-aim: update player facing toward target
            es.player.angle = Math.atan2(bDir.x, -bDir.y)
            const spd = weaponCfg.bulletSpeed * mutators.gunKataSpeed
            const bid = `bullet-${++es.bulletIdCounter}`
            es.bullets.set(bid, {
              id: bid,
              position: new THREE.Vector2(
                es.player.position.x + bDir.x * (PLAYER_RADIUS + 0.2),
                es.player.position.y + bDir.y * (PLAYER_RADIUS + 0.2),
              ),
              velocity: new THREE.Vector2(bDir.x * spd, bDir.y * spd),
              lifetime: BULLET_LIFETIME,
              damage:   finalDamage * 1.5,  // Gun Kata bonus damage
              bounces:  0,
              maxBounces: bulletMaxBounces,
              isEnergy,
              isFlak: false,
            })
            es.ammo = Math.max(0, es.ammo - 1)
            WEAPON_SOUNDS[activeWeaponId]?.()
            setBulletIds(Array.from(es.bullets.keys()))
            // Re-queue this target for another hit if queue is running short
            es.gunKataTargetQueue.push(targetId)
          }
        }
      }
      if (es.gunKataTargetQueue.length === 0 || es.ammo === 0) {
        es.isBulletTime = false
      }
    } else if (es.maneuver !== 'gunkata') {
      // Cooldown ticks outside of gunkata
      if (es.gunKataCooldown > 0) es.gunKataCooldown -= rawDt
    }

    if (isShooting && es.player.shootCooldown <= 0 && es.ammo > 0 && es.maneuver !== 'spin' && es.maneuver !== 'gunkata' && es.burstRemaining === 0
        && !weaponCfg.isVernichter && !weaponCfg.isLaser && !weaponCfg.isIon) {
      es.player.shootCooldown = weaponCfg.shootCooldown
      const baseAngle = Math.atan2(_toMouse.x, _toMouse.y)
      const offsets   = es.isAkimbo ? [-0.1, 0.1] : [0]
      const ammoCost  = es.isAkimbo ? 2 : 1

      if (es.ammo >= ammoCost) {
        WEAPON_SOUNDS[activeWeaponId]?.()

        if (weaponCfg.isGrenade) {
          // Grenade weapon: throw into grenades pool
          const ang  = baseAngle + (Math.random() - 0.5) * 2 * weaponCfg.spread
          const bDir = new THREE.Vector2(Math.sin(ang), Math.cos(ang))
          es.grenades.push({
            id:      `grenade-${++es.grenadeIdCounter}`,
            x:       es.player.position.x + bDir.x * (PLAYER_RADIUS + 0.3),
            z:       es.player.position.y + bDir.y * (PLAYER_RADIUS + 0.3),
            vx:      bDir.x * (weaponCfg.bulletSpeed ?? GRENADE_SPEED),
            vz:      bDir.y * (weaponCfg.bulletSpeed ?? GRENADE_SPEED),
            timer:   GRENADE_FUSE,
            bounces: 0,
          })
          es.ammo = Math.max(0, es.ammo - 1)
        } else if (weaponCfg.isProjectile) {
          // Plasma / Bazooka: single slow projectile — don't overwrite an in-flight one
          if (es.weaponProjectile === null) {
            es.weaponProjectile = {
              x:  es.player.position.x + _toMouse.x * (PLAYER_RADIUS + 0.4),
              z:  es.player.position.y + _toMouse.y * (PLAYER_RADIUS + 0.4),
              vx: _toMouse.x * (weaponCfg.projectileSpeed ?? 8),
              vz: _toMouse.y * (weaponCfg.projectileSpeed ?? 8),
            }
            es.ammo = Math.max(0, es.ammo - 1)
          }
        } else if (weaponCfg.isBanana) {
          // Banana grenade
          const ang = baseAngle + (Math.random() - 0.5) * 2 * weaponCfg.spread
          const bDir = new THREE.Vector2(Math.sin(ang), Math.cos(ang))
          es.bananas.push({
            id:      `banana-${++es.bananaIdCounter}`,
            x:       es.player.position.x + bDir.x * (PLAYER_RADIUS + 0.3),
            z:       es.player.position.y + bDir.y * (PLAYER_RADIUS + 0.3),
            vx:      bDir.x * (weaponCfg.bulletSpeed ?? 10),
            vz:      bDir.y * (weaponCfg.bulletSpeed ?? 10),
            timer:   3.0,
            bounces: 0,
          } as BananaData)
          es.ammo = Math.max(0, es.ammo - 1)
        } else if (weaponCfg.burstCount && weaponCfg.burstCount > 1) {
          // Burst fire: fire first round, queue rest
          es.ammo = Math.max(0, es.ammo - ammoCost)
          for (const lateralOff of offsets) spawnBullet(baseAngle, lateralOff)
          es.burstRemaining = weaponCfg.burstCount - 1
          es.burstTimer     = weaponCfg.burstDelay ?? 0.05
          setBulletIds(Array.from(es.bullets.keys()))
        } else {
          // Standard bullet(s)
          es.ammo = Math.max(0, es.ammo - ammoCost)
          for (const lateralOff of offsets) spawnBullet(baseAngle, lateralOff)
          setBulletIds(Array.from(es.bullets.keys()))
        }
      }
    }

    // ── Chaos weapon: decrement ammo & handle modifiers ──────────────────────
    if (chaosModeActive && es.chaosWeaponId && isShooting && es.player.shootCooldown <= 0) {
      if (es.chaosModifier === 'jammed' && Math.random() < 0.15) {
        setWaveMessage('⚠ LADEHEMMUNG'); setTimeout(() => setWaveMessage(''), 900)
      } else {
        es.chaosAmmo = Math.max(0, es.chaosAmmo - 1)
        if (es.chaosAmmo <= 0) {
          if (es.chaosModifier === 'explosive') {
            spawnParticles(es.player.position.x, es.player.position.y, 'explosion', 24)
            es.player.health -= 30
            setWaveMessage('💥 WAFFE EXPLODIERT'); setTimeout(() => setWaveMessage(''), 1200)
          }
          es.chaosWeaponId = null
        }
      }
    }

    // ── Melee attack (fire button, when melee weapon equipped) ───────────────
    const isMeleeWeapon = weaponCfg.isMelee
    if (isMeleeWeapon && isShooting && es.player.shootCooldown <= 0 && es.ammo > 0) {
      es.player.shootCooldown = weaponCfg.shootCooldown
      es.meleeSwing = weaponCfg.shootCooldown * 0.7

      const maxDur  = loadout.getMaxAmmoFor(loadout.selectedWeapon)
      const durPct  = weaponCfg.stackable ? es.ammo / maxDur : 1
      const dmg     = Math.round(weaponCfg.baseDamage * Math.max(0.4, durPct))
      const range   = weaponCfg.meleeRange ?? 1.8
      const halfArc = (weaponCfg.meleeArc ?? Math.PI * 0.6) / 2

      let hitCount = 0
      for (const [, enemy] of es.enemies) {
        const dx   = enemy.position.x - es.player.position.x
        const dz   = enemy.position.y - es.player.position.y
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist > range) continue
        let diff = Math.atan2(dx, -dz) - es.player.angle
        while (diff > Math.PI) diff -= 2 * Math.PI
        while (diff < -Math.PI) diff += 2 * Math.PI
        if (Math.abs(diff) > halfArc) continue
        enemy.health -= dmg
        enemy.hitTime = now
        spawnParticles(enemy.position.x, enemy.position.y, 'blood', BLOOD_COUNTS[bloodIntensity])
        hitCount++
      }

      WEAPON_SOUNDS[loadout.selectedWeapon]?.()

      // Decrement durability (not for stick with 9999 base)
      if (weaponCfg.stackable) {
        es.ammo = Math.max(0, es.ammo - 1)
        es.weaponAmmo.set(loadout.selectedWeapon, es.ammo)
        if (es.ammo <= 0) {
          const next = loadout.ownedWeapons.find(w => !WEAPON_CONFIGS[w].isMelee) ?? 'pistol'
          loadout.selectWeapon(next)
          es.ammo    = es.weaponAmmo.get(next) ?? loadout.getMaxAmmoFor(next)
          es.maxAmmo = loadout.getMaxAmmoFor(next)
          setWaveMessage('KAPUTT! ✗')
          setTimeout(() => setWaveMessage(''), 1400)
        }
      }
      void hitCount
    }

    // ── Declare removal/score accumulators ───────────────────────────────────
    const enemiesToRemove: string[] = []
    let scoreGained = 0, creditsGained = 0

    // ── Update grenades ───────────────────────────────────────────────────────
    const grenadeIdxToRemove: number[] = []
    for (let gi = 0; gi < es.grenades.length; gi++) {
      const g   = es.grenades[gi]
      g.x      += g.vx * rawDt
      g.z      += g.vz * rawDt
      g.timer  -= rawDt

      const half = arenaHalf - 0.25
      const maxGB = GRENADE_BOUNCE + extraBounce
      if (Math.abs(g.x) > half) {
        if (g.bounces < maxGB) { g.vx = -g.vx * bounceDamp; g.x = Math.sign(g.x) * half; g.bounces++ }
        else g.timer = 0
      }
      if (Math.abs(g.z) > half) {
        if (g.bounces < maxGB) { g.vz = -g.vz * bounceDamp; g.z = Math.sign(g.z) * half; g.bounces++ }
        else g.timer = 0
      }

      // Update mesh
      const mesh = grenadeMeshRefs.current[gi % MAX_GRENADES]
      if (mesh) {
        mesh.position.set(g.x, 0.2, g.z)
        mesh.visible = true
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = (1 - Math.min(1, g.timer / GRENADE_FUSE)) * 3
      }

      if (g.timer <= 0) {
        grenadeIdxToRemove.push(gi)
        if (mesh) mesh.visible = false

        playExplosionSmall()
        spawnParticles(g.x, g.z, 'explosion', EXPL_COUNTS[bloodIntensity])
        spawnParticles(g.x, g.z, 'spark', SPARK_COUNTS[bloodIntensity])
        spawnDecal(g.x, g.z, 1.2)

        // Damage enemies
        const explodedEnemies = new Set<string>()
        for (const [eid, enemy] of es.enemies) {
          if (explodedEnemies.has(eid)) continue
          _diff.set(g.x - enemy.position.x, g.z - enemy.position.y)
          const dist = _diff.length()
          if (dist < GRENADE_RADIUS) {
            const falloff = 1 - dist / GRENADE_RADIUS
            enemy.health -= Math.round(GRENADE_DAMAGE * falloff)
            enemy.hitTime = now
            spawnParticles(enemy.position.x, enemy.position.y, 'blood', BLOOD_COUNTS[bloodIntensity])
            if (enemy.health <= 0 && !enemiesToRemove.includes(eid)) {
              enemiesToRemove.push(eid)
              scoreGained   += ENEMY_CONFIGS[enemy.type].scoreValue
              creditsGained += ENEMY_CONFIGS[enemy.type].creditValue
              playDeath(0.4)
            }
            explodedEnemies.add(eid)
          }
        }

        // Damage player
        if (!useMutatorsStore.getState().godMode && es.player.berserkerTimer <= 0) {
          _diff.set(g.x - es.player.position.x, g.z - es.player.position.y)
          if (_diff.length() < GRENADE_RADIUS && now > es.player.invincibleUntil) {
            const falloff  = 1 - _diff.length() / GRENADE_RADIUS
            const grenDmg  = Math.round(30 * falloff)
            if (es.player.armor > 0) {
              const absorbed = Math.min(es.player.armor, grenDmg)
              es.player.armor = Math.max(0, es.player.armor - absorbed)
              const remain = grenDmg - absorbed
              if (remain > 0) es.player.health -= remain
            } else {
              es.player.health -= grenDmg
            }
            es.player.invincibleUntil = now + INVINCIBLE_DURATION
          }
        }
      }
    }
    // Remove exploded (reverse order to keep indices valid)
    for (let i = grenadeIdxToRemove.length - 1; i >= 0; i--) {
      es.grenades.splice(grenadeIdxToRemove[i], 1)
    }
    for (let mi = es.grenades.length; mi < MAX_GRENADES; mi++) {
      const mesh = grenadeMeshRefs.current[mi]
      if (mesh) mesh.visible = false
    }

    // ── Update bananas ────────────────────────────────────────────────────────
    const bananaIdxToRemove: number[] = []
    for (let bi = 0; bi < es.bananas.length; bi++) {
      const bn  = es.bananas[bi]
      const wcf = WEAPON_CONFIGS['banana']
      bn.x     += bn.vx * rawDt
      bn.z     += bn.vz * rawDt
      bn.timer -= rawDt

      const half   = ARENA_HALF - 0.25
      const maxBnB = (wcf.maxBounces ?? 5) + extraBounce
      if (Math.abs(bn.x) > half) {
        if (bn.bounces < maxBnB) {
          bn.vx = -bn.vx * bounceDamp; bn.x = Math.sign(bn.x) * half; bn.bounces++; playBananaBounce()
        } else { bn.timer = 0 }
      }
      if (Math.abs(bn.z) > half) {
        if (bn.bounces < maxBnB) {
          bn.vz = -bn.vz * bounceDamp; bn.z = Math.sign(bn.z) * half; bn.bounces++; playBananaBounce()
        } else { bn.timer = 0 }
      }

      // Level collision bounce
      if (level && pointIntersectsLevel(bn.x, bn.z, 0.2, level)) {
        if (bn.bounces < maxBnB) {
          bn.vx = -bn.vx * bounceDamp; bn.vz = -bn.vz * bounceDamp; bn.bounces++; playBananaBounce()
        } else { bn.timer = 0 }
      }

      const mesh = bananaMeshRefs.current[bi % MAX_BANANAS]
      if (mesh) {
        mesh.position.set(bn.x, 0.25, bn.z)
        mesh.visible = true
        mesh.rotation.y += rawDt * 4
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = (1 - Math.min(1, bn.timer / 3.0)) * 2.5
      }

      if (bn.timer <= 0) {
        bananaIdxToRemove.push(bi)
        if (mesh) mesh.visible = false
        doSplash(bn.x, bn.z, wcf.projectileRadius ?? 3.5, wcf.projectileDamage ?? 55, true)
      }
    }
    for (let i = bananaIdxToRemove.length - 1; i >= 0; i--) es.bananas.splice(bananaIdxToRemove[i], 1)
    for (let mi = es.bananas.length; mi < MAX_BANANAS; mi++) {
      const mesh = bananaMeshRefs.current[mi]; if (mesh) mesh.visible = false
    }

    // ── Vernichter fire (slot 0) ──────────────────────────────────────────────
    if (fireJust && weaponCfg.isVernichter && es.vernichterAmmo > 0 && !es.vernichterProjectile) {
      es.vernichterAmmo--
      es.vernichterProjectile = {
        x:  es.player.position.x + _toMouse.x * (PLAYER_RADIUS + 0.6),
        z:  es.player.position.y + _toMouse.y * (PLAYER_RADIUS + 0.6),
        vx: _toMouse.x * VERNICHTER_SPEED,
        vz: _toMouse.y * VERNICHTER_SPEED,
      }
    }

    // ── Update Vernichter projectile ──────────────────────────────────────────
    if (es.vernichterProjectile) {
      const vp = es.vernichterProjectile
      vp.x += vp.vx * dt
      vp.z += vp.vz * dt

      // Pulsing glow mesh
      if (vernichterMeshRef.current) {
        const pulse = Math.sin(now * 12) * 0.15 + 1
        vernichterMeshRef.current.position.set(vp.x, 0.4, vp.z)
        vernichterMeshRef.current.scale.setScalar(pulse)
        vernichterMeshRef.current.visible = true
        const mat = vernichterMeshRef.current.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 1.5 + Math.sin(now * 20) * 0.5
      }
      if (vernichterLightRef.current) {
        vernichterLightRef.current.position.set(vp.x, 1.5, vp.z)
        vernichterLightRef.current.visible = true
      }

      // Hit wall → explode
      const oob = Math.abs(vp.x) > arenaHalf - 0.5 || Math.abs(vp.z) > arenaHalf - 0.5
      // Hit enemy → explode
      let hitEnemy = false
      for (const enemy of es.enemies.values()) {
        _diff.set(vp.x - enemy.position.x, vp.z - enemy.position.y)
        if (_diff.length() < ENEMY_CONFIGS[enemy.type].size + 0.6) { hitEnemy = true; break }
      }

      if (oob || hitEnemy) {
        // EXPLOSION
        es.vernichterProjectile = null
        if (vernichterMeshRef.current)  vernichterMeshRef.current.visible  = false
        if (vernichterLightRef.current) vernichterLightRef.current.visible = false

        // Massive particles — ignore blood intensity, always maximum
        spawnParticles(vp.x, vp.z, 'explosion', 80)
        spawnParticles(vp.x, vp.z, 'explosion', 60)
        spawnParticles(vp.x, vp.z, 'spark', 40)
        spawnDecal(vp.x, vp.z, 3.5)
        spawnDecal(vp.x + 1, vp.z + 1, 2)
        spawnDecal(vp.x - 1, vp.z - 0.5, 1.5)

        // Kill all enemies in radius
        for (const [eid, enemy] of es.enemies) {
          if (enemiesToRemove.includes(eid)) continue
          _diff.set(vp.x - enemy.position.x, vp.z - enemy.position.y)
          const dist = _diff.length()
          if (dist < VERNICHTER_RADIUS) {
            const falloff = 1 - dist / VERNICHTER_RADIUS
            enemy.health -= Math.round(VERNICHTER_DAMAGE * falloff)
            spawnParticles(enemy.position.x, enemy.position.y, 'blood', 20)
            spawnParticles(enemy.position.x, enemy.position.y, 'explosion', 10)
            if (enemy.health <= 0 && !enemiesToRemove.includes(eid)) {
              enemiesToRemove.push(eid)
              scoreGained   += ENEMY_CONFIGS[enemy.type].scoreValue * 3
              creditsGained += ENEMY_CONFIGS[enemy.type].creditValue
              playDeath(0.5)
            }
          }
        }

        // Screen flash
        setBigExplosion(true)
        setTimeout(() => setBigExplosion(false), 400)
      }
    } else {
      // Hide when inactive
      if (vernichterMeshRef.current)  vernichterMeshRef.current.visible  = false
      if (vernichterLightRef.current) vernichterLightRef.current.visible = false
    }

    // ── Death Laser (slot 0) ──────────────────────────────────────────────────
    if (fireJust && weaponCfg.isLaser && es.laserAmmo > 0 && !es.laserBeam) {
      es.laserAmmo--
      const px = es.player.position.x, pz = es.player.position.y
      const dx = _toMouse.x, dz = _toMouse.y
      // Raycast: find beam endpoint (wall or far end)
      const maxT = LASER_RANGE
      let endT = maxT
      if (Math.abs(dx) > 0.001) {
        const tX = dx > 0 ? (arenaHalf - px) / dx : (-arenaHalf - px) / dx
        if (tX > 0 && tX < endT) endT = tX
      }
      if (Math.abs(dz) > 0.001) {
        const tZ = dz > 0 ? (arenaHalf - pz) / dz : (-arenaHalf - pz) / dz
        if (tZ > 0 && tZ < endT) endT = tZ
      }
      const x1 = px + dx * endT, z1 = pz + dz * endT
      es.laserBeam = { x0: px, z0: pz, x1, z1, timer: 0.55 }

      // Kill all enemies within LASER_WIDTH of the ray
      for (const [eid, enemy] of es.enemies) {
        if (enemiesToRemove.includes(eid)) continue
        // Point-to-line distance: project enemy onto ray
        const ex = enemy.position.x - px, ez = enemy.position.y - pz
        const t  = Math.max(0, Math.min(endT, ex * dx + ez * dz))
        const cx = px + dx * t - enemy.position.x
        const cz = pz + dz * t - enemy.position.y
        if (Math.sqrt(cx*cx + cz*cz) < LASER_WIDTH + ENEMY_CONFIGS[enemy.type].size) {
          enemy.health = 0
          enemiesToRemove.push(eid)
          scoreGained   += ENEMY_CONFIGS[enemy.type].scoreValue
          creditsGained += ENEMY_CONFIGS[enemy.type].creditValue
          spawnParticles(enemy.position.x, enemy.position.y, 'explosion', 25)
          spawnParticles(enemy.position.x, enemy.position.y, 'spark', 12)
          spawnDecal(enemy.position.x, enemy.position.y, 1.2)
          playDeath(0.5)
        }
      }
    }

    // Update laser beam timer and mesh
    if (es.laserBeam) {
      es.laserBeam.timer -= rawDt
      if (es.laserBeam.timer <= 0) {
        es.laserBeam = null
        if (laserBeamMeshRef.current) laserBeamMeshRef.current.visible = false
      } else if (laserBeamMeshRef.current) {
        const lb = es.laserBeam
        const midX = (lb.x0 + lb.x1) * 0.5
        const midZ = (lb.z0 + lb.z1) * 0.5
        const len  = Math.hypot(lb.x1 - lb.x0, lb.z1 - lb.z0)
        const ang  = Math.atan2(lb.x1 - lb.x0, lb.z1 - lb.z0)
        const fade = lb.timer / 0.55
        laserBeamMeshRef.current.position.set(midX, 0.5, midZ)
        laserBeamMeshRef.current.rotation.y = ang
        laserBeamMeshRef.current.scale.set(0.18 * fade, 1.5, len)
        laserBeamMeshRef.current.visible = true
        const mat = laserBeamMeshRef.current.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 6 * fade
        mat.opacity = 0.9 * fade
      }
    } else if (laserBeamMeshRef.current) {
      laserBeamMeshRef.current.visible = false
    }

    // ── Ion Cannon (I) ───────────────────────────────────────────────────────
    if (fireJust && weaponCfg.isIon && es.ionAmmo > 0 && !es.ionTarget) {
      es.ionAmmo--
      es.ionTarget = { x: es.mouseWorld.x, z: es.mouseWorld.z, delay: ION_DELAY, beamTimer: 0 }
    }

    if (es.ionTarget) {
      const ion = es.ionTarget
      if (ion.delay > 0) {
        // Countdown — show reticle
        ion.delay -= rawDt
        if (ionReticleMeshRef.current) {
          const pulse = Math.sin(now * 12) * 0.1 + 1
          ionReticleMeshRef.current.position.set(ion.x, 0.05, ion.z)
          ionReticleMeshRef.current.scale.set(pulse, 1, pulse)
          ionReticleMeshRef.current.visible = true
        }
        ionBeamMeshRefs.forEach((r) => { if (r.current) r.current.visible = false })
      } else if (ion.beamTimer === 0) {
        // Impact frame: deal damage
        ion.beamTimer = ION_BEAM_DURATION
        if (ionReticleMeshRef.current) ionReticleMeshRef.current.visible = false
        spawnParticles(ion.x, ion.z, 'explosion', 80)
        spawnParticles(ion.x, ion.z, 'explosion', 60)
        spawnParticles(ion.x, ion.z, 'spark', 40)
        spawnDecal(ion.x, ion.z, 3.5)
        doSplash(ion.x, ion.z, ION_RADIUS, 999, true, true)
      } else {
        // Beam visible phase
        ion.beamTimer -= rawDt
        if (ionReticleMeshRef.current) ionReticleMeshRef.current.visible = false
        const beamFade = Math.max(0, ion.beamTimer / ION_BEAM_DURATION)
        const offsets = [[-1,  -1], [1, -1], [-1, 1], [1, 1]] as const
        ionBeamMeshRefs.forEach((r, idx) => {
          if (!r.current) return
          const [ox, oz] = offsets[idx]
          const bx = ion.x + ox * ION_RADIUS * 0.6
          const bz = ion.z + oz * ION_RADIUS * 0.6
          r.current.position.set(bx, 15 * (1 - beamFade), bz)
          r.current.scale.set(0.4 * beamFade, 30, 0.4 * beamFade)
          r.current.visible = true
          const mat = r.current.material as THREE.MeshStandardMaterial
          mat.emissiveIntensity = 8 * beamFade
          mat.opacity = beamFade
        })
        if (ion.beamTimer <= 0) {
          es.ionTarget = null
          ionBeamMeshRefs.forEach((r) => { if (r.current) r.current.visible = false })
        }
      }
    } else {
      if (ionReticleMeshRef.current) ionReticleMeshRef.current.visible = false
      ionBeamMeshRefs.forEach((r) => { if (r.current) r.current.visible = false })
    }

    // ── Update weapon projectile (plasma / bazooka) ───────────────────────────
    if (es.weaponProjectile) {
      const wp  = es.weaponProjectile
      const wcf = WEAPON_CONFIGS[loadout.selectedWeapon]
      wp.x += wp.vx * dt
      wp.z += wp.vz * dt

      const projRadius  = wcf.projectileRadius ?? 2.5
      const projDamage  = wcf.projectileDamage ?? 30
      const isBfgProj   = loadout.selectedWeapon === 'bfg'
      const isLargeProj = loadout.selectedWeapon === 'bazooka'

      if (weaponProjMeshRef.current) {
        const pulse = Math.sin(now * (isBfgProj ? 6 : 14)) * (isBfgProj ? 0.2 : 0.1) + 1
        weaponProjMeshRef.current.position.set(wp.x, 0.5, wp.z)
        weaponProjMeshRef.current.scale.setScalar(pulse * (isBfgProj ? 3.5 : 1))
        weaponProjMeshRef.current.visible = true
        const mat = weaponProjMeshRef.current.material as THREE.MeshStandardMaterial
        mat.color.set(isBfgProj ? '#00ff44' : isLargeProj ? '#ff6600' : '#00ccff')
        mat.emissive.set(isBfgProj ? '#00cc22' : isLargeProj ? '#ff2200' : '#0066ff')
        mat.emissiveIntensity = isBfgProj ? 3 : 2
      }
      if (weaponProjLightRef.current) {
        weaponProjLightRef.current.position.set(wp.x, 1.5, wp.z)
        weaponProjLightRef.current.color.set(isBfgProj ? '#00ff44' : isLargeProj ? '#ff4400' : '#00aaff')
        weaponProjLightRef.current.intensity = isBfgProj ? 16 : 5
        weaponProjLightRef.current.distance  = isBfgProj ? 20 : 10
        weaponProjLightRef.current.visible = true
      }

      const oob = Math.abs(wp.x) > arenaHalf - 0.5 || Math.abs(wp.z) > arenaHalf - 0.5
      let hitSomething = oob
      if (!oob && level && pointIntersectsLevel(wp.x, wp.z, isBfgProj ? 1.0 : 0.25, level)) hitSomething = true
      if (!hitSomething) {
        for (const enemy of es.enemies.values()) {
          _diff.set(wp.x - enemy.position.x, wp.z - enemy.position.y)
          if (_diff.length() < ENEMY_CONFIGS[enemy.type].size + (isBfgProj ? 1.5 : 0.4)) { hitSomething = true; break }
        }
      }

      if (hitSomething) {
        es.weaponProjectile = null
        if (weaponProjMeshRef.current)  weaponProjMeshRef.current.visible  = false
        if (weaponProjLightRef.current) weaponProjLightRef.current.visible = false
        if (isBfgProj) {
          // Extra BFG explosion particles
          spawnParticles(wp.x, wp.z, 'explosion', 80)
          spawnParticles(wp.x, wp.z, 'explosion', 60)
          spawnParticles(wp.x, wp.z, 'spark', SPARK_COUNTS[bloodIntensity] * 3)
        }
        doSplash(wp.x, wp.z, projRadius, projDamage, isLargeProj || isBfgProj, isBfgProj)
      }
    } else {
      if (weaponProjMeshRef.current)  weaponProjMeshRef.current.visible  = false
      if (weaponProjLightRef.current) weaponProjLightRef.current.visible = false
    }

    // ── Update bullets (with ricochets) ───────────────────────────────────────
    const bulletsToRemove: string[] = []
    for (const [id, bullet] of es.bullets) {
      bullet.position.x += bullet.velocity.x * dt
      bullet.position.y += bullet.velocity.y * dt
      bullet.lifetime   -= dt

      let remove = bullet.lifetime <= 0
      if (!remove) {
        const half = arenaHalf - BULLET_RADIUS
        if (Math.abs(bullet.position.x) > half) {
          if (bullet.bounces < bullet.maxBounces) {
            bullet.velocity.x  = -bullet.velocity.x * 0.85
            bullet.damage      = Math.max(1, Math.round(bullet.damage * 0.7))
            bullet.position.x  = Math.sign(bullet.position.x) * half
            bullet.bounces++
            spawnParticles(bullet.position.x, bullet.position.y, 'spark', SPARK_COUNTS[bloodIntensity])
            if (bullet.isFlak) playFlakBounce(); else playRicochet()
          } else { remove = true }
        }
        if (!remove && Math.abs(bullet.position.y) > half) {
          if (bullet.bounces < bullet.maxBounces) {
            bullet.velocity.y  = -bullet.velocity.y * 0.85
            bullet.damage      = Math.max(1, Math.round(bullet.damage * 0.7))
            bullet.position.y  = Math.sign(bullet.position.y) * half
            bullet.bounces++
            spawnParticles(bullet.position.x, bullet.position.y, 'spark', SPARK_COUNTS[bloodIntensity])
            if (bullet.isFlak) playFlakBounce(); else playRicochet()
          } else { remove = true }
        }
        if (!remove && level && pointIntersectsLevel(bullet.position.x, bullet.position.y, BULLET_RADIUS, level)) {
          remove = true
        }
      }
      if (remove) bulletsToRemove.push(id)
    }

    // ── Update enemies ────────────────────────────────────────────────────────
    const hitBullets      = new Set<string>()
    const pendingShrapnel: BulletData[] = []

    for (const [eid, enemy] of es.enemies) {
      if (enemiesToRemove.includes(eid)) continue
      const cfg = ENEMY_CONFIGS[enemy.type]

      // Target nearest active player
      const p2Live = es.player2Active && es.player2.health > 0
      let targetX = es.player.position.x, targetY = es.player.position.y
      if (p2Live) {
        const d1 = Math.hypot(es.player.position.x - enemy.position.x, es.player.position.y - enemy.position.y)
        const d2 = Math.hypot(es.player2.position.x - enemy.position.x, es.player2.position.y - enemy.position.y)
        if (d2 < d1) { targetX = es.player2.position.x; targetY = es.player2.position.y }
      }
      _toPlayer.set(targetX - enemy.position.x, targetY - enemy.position.y)
      const dist = _toPlayer.length()
      // Save aim direction before _toPlayer gets overwritten by movement delta
      const aimX = dist > 0.05 ? _toPlayer.x / dist : 0
      const aimY = dist > 0.05 ? _toPlayer.y / dist : 0

      if (dist > 0.05) {
        let mx = _toPlayer.x / dist
        let mz = _toPlayer.y / dist

        if (enemy.type === 'berserker') {
          // Erratic zigzag charge — always rushes regardless of shoot range
          enemy.aiTimer += rawDt
          if (enemy.aiTimer > 0.4) { enemy.aiTimer = 0; enemy.aiState = 1 - enemy.aiState }
          const jitter = (enemy.aiState === 0 ? 1 : -1) * 0.55
          mx = mx + (-mz) * jitter
          mz = mz + mx * jitter
          const mlen = Math.sqrt(mx * mx + mz * mz)
          mx /= mlen; mz /= mlen
        } else if (enemy.type === 'flanker') {
          // Strafe sideways while closing in
          enemy.aiTimer += rawDt
          if (enemy.aiTimer > 1.5) { enemy.aiTimer = 0; enemy.aiState ^= 1 }
          const side = enemy.aiState === 0 ? 1 : -1
          const px = (-mz) * side
          const pz = mx * side
          mx = mx * 0.6 + px * 0.4
          mz = mz * 0.6 + pz * 0.4
          const mlen = Math.sqrt(mx * mx + mz * mz)
          mx /= mlen; mz /= mlen
        }

        // Non-berserker enemies slow to 30% when within shooting range
        const speedMult = (enemy.type !== 'berserker' && dist < cfg.shootRange) ? 0.3 : 1.0
        _toPlayer.x = mx * cfg.speed * speedMult * diffSpeedMult * dt
        _toPlayer.y = mz * cfg.speed * speedMult * diffSpeedMult * dt
        let ex = enemy.position.x + _toPlayer.x
        let ez = enemy.position.y + _toPlayer.y
        if (level) { const r = resolveCircleVsLevel(ex, ez, cfg.size, level); ex = r.x; ez = r.z }
        enemy.position.x = ex
        enemy.position.y = ez
      }

      for (const [bid, bullet] of es.bullets) {
        if (hitBullets.has(bid)) continue
        _diff.set(bullet.position.x - enemy.position.x, bullet.position.y - enemy.position.y)
        if (_diff.length() < cfg.size + BULLET_RADIUS) {
          enemy.health  -= bullet.damage
          enemy.hitTime  = now
          hitBullets.add(bid)
          bulletsToRemove.push(bid)
          playHit()
          spawnParticles(enemy.position.x, enemy.position.y, 'blood', BLOOD_COUNTS[bloodIntensity])
          if (bloodIntensity > 0) {
            spawnDecal(enemy.position.x, enemy.position.y, 0.4 + Math.random() * 0.5)
          }
          if (bullet.isFlak) {
            spawnParticles(enemy.position.x, enemy.position.y, 'explosion', Math.ceil(EXPL_COUNTS[bloodIntensity] * 0.4))
            spawnParticles(enemy.position.x, enemy.position.y, 'spark', SPARK_COUNTS[bloodIntensity])
            const shrapnelDmg = Math.max(1, Math.ceil(bullet.damage * 0.3))
            for (let si = 0; si < 4; si++) {
              const sa  = Math.random() * Math.PI * 2
              const spd = 8 + Math.random() * 6
              const sbid = `bullet-${++es.bulletIdCounter}`
              pendingShrapnel.push({
                id: sbid, position: new THREE.Vector2(enemy.position.x, enemy.position.y),
                velocity: new THREE.Vector2(Math.sin(sa) * spd, Math.cos(sa) * spd),
                lifetime: 0.35, damage: shrapnelDmg, bounces: 0, maxBounces: 0,
                isEnergy: true, isFlak: false,
              })
            }
          }
          if (enemy.health <= 0 && !enemiesToRemove.includes(eid)) {
            enemiesToRemove.push(eid)
            scoreGained   += cfg.scoreValue
            creditsGained += cfg.creditValue
            spawnParticles(enemy.position.x, enemy.position.y, 'blood', BLOOD_COUNTS[bloodIntensity])
            spawnDecal(enemy.position.x, enemy.position.y, 0.6 + Math.random() * 0.6)
            if (bullet.isFlak || bullet.damage >= 40) {
              spawnParticles(enemy.position.x, enemy.position.y, 'explosion', EXPL_COUNTS[bloodIntensity])
              spawnParticles(enemy.position.x, enemy.position.y, 'spark', Math.ceil(SPARK_COUNTS[bloodIntensity] * 0.5))
            }
            playDeath(0.5)
          }
          break
        }
      }

      // Enemy shoots at target player
      enemy.shootCooldown -= rawDt
      if (enemy.shootCooldown <= 0 && dist >= cfg.size + 0.3 && dist < cfg.shootRange) {
        enemy.shootCooldown = 1 / cfg.shootRate
        const ebId = `eb-${++es.enemyBulletIdCounter}`
        es.enemyBullets.set(ebId, {
          id: ebId,
          position: new THREE.Vector2(
            enemy.position.x + aimX * (cfg.size + 0.25),
            enemy.position.y + aimY * (cfg.size + 0.25),
          ),
          velocity: new THREE.Vector2(aimX * cfg.bulletSpeed, aimY * cfg.bulletSpeed),
          lifetime: 3.5,
          damage: Math.round(cfg.damage * diffDmgMult),
        })
        setEnemyBulletIds(Array.from(es.enemyBullets.keys()))
        playEnemyFire()
      }
    }

    // Commit flak shrapnel bullets spawned during enemy collision
    if (pendingShrapnel.length > 0) {
      for (const sb of pendingShrapnel) es.bullets.set(sb.id, sb)
      setBulletIds(Array.from(es.bullets.keys()))
    }

    // ── Enemy bullet movement & player collision ──────────────────────────────
    const ebToRemove: string[] = []
    for (const [ebId, eb] of es.enemyBullets) {
      eb.position.x += eb.velocity.x * rawDt
      eb.position.y += eb.velocity.y * rawDt
      eb.lifetime -= rawDt
      if (eb.lifetime <= 0 || Math.abs(eb.position.x) > arenaHalf + 2 || Math.abs(eb.position.y) > arenaHalf + 2) {
        ebToRemove.push(ebId); continue
      }
      if (Math.hypot(es.player.position.x - eb.position.x, es.player.position.y - eb.position.y) < PLAYER_RADIUS + 0.1 && now > es.player.invincibleUntil) {
        if (!useMutatorsStore.getState().godMode && es.player.berserkerTimer <= 0) {
          const dmg = eb.damage
          if (es.player.armor > 0) {
            const absorbed = Math.min(es.player.armor, dmg)
            es.player.armor = Math.max(0, es.player.armor - absorbed)
            const remain = dmg - absorbed
            if (remain > 0) es.player.health = Math.max(0, es.player.health - remain)
          } else {
            es.player.health = Math.max(0, es.player.health - dmg)
          }
          playHit(0.9)
        }
        es.player.invincibleUntil = now + INVINCIBLE_DURATION
        ebToRemove.push(ebId); continue
      }
      if (es.player2Active && es.player2.health > 0 && now > es.player2.invincibleUntil) {
        if (Math.hypot(es.player2.position.x - eb.position.x, es.player2.position.y - eb.position.y) < PLAYER_RADIUS + 0.1) {
          es.player2.health = Math.max(0, es.player2.health - eb.damage)
          es.player2.invincibleUntil = now + INVINCIBLE_DURATION
          ebToRemove.push(ebId); continue
        }
      }
    }
    if (ebToRemove.length > 0) {
      for (const id of ebToRemove) es.enemyBullets.delete(id)
      setEnemyBulletIds(Array.from(es.enemyBullets.keys()))
    }

    // ── Apply removals + enemy drops ──────────────────────────────────────────
    let changed = false
    for (const id of bulletsToRemove) { if (es.bullets.delete(id)) changed = true }
    if (changed) setBulletIds(Array.from(es.bullets.keys()))
    changed = false
    for (const id of enemiesToRemove) {
      const dying = es.enemies.get(id)
      if (dying && mutators.enemyDrops.length > 0) {
        const kind = mutators.enemyDrops[Math.floor(Math.random() * mutators.enemyDrops.length)]
        spawnEnemyDrop(dying.position.x, dying.position.y, [kind])
      }
      if (es.enemies.delete(id)) changed = true
    }
    if (changed) setEnemyIds(Array.from(es.enemies.keys()))

    // BT charge via kills
    if (enemiesToRemove.length > 0 && useMutatorsStore.getState().btChargeModes.includes('kills')) {
      es.focus = Math.min(FOCUS_MAX, es.focus + enemiesToRemove.length * 8)
    }

    // ── Kill multipliers & hardline progression ────────────────────────────────
    if (enemiesToRemove.length > 0) {
      es.killStreak      += enemiesToRemove.length
      es.killComboCount  += enemiesToRemove.length
      es.killComboTimer   = 3.5

      if (mutators.killMultipliers) {
        const comboMsg = es.killComboCount >= 5 ? '★ MONSTER KILL'
          : es.killComboCount === 4 ? '★ ULTRA KILL'
          : es.killComboCount === 3 ? '★ MULTI KILL'
          : es.killComboCount === 2 ? '★ DOUBLE KILL'
          : null
        const streakTier = es.killStreak === 25 ? 4
          : es.killStreak === 20 ? 3
          : es.killStreak === 15 ? 2
          : es.killStreak === 10 ? 1
          : es.killStreak === 5  ? 0
          : -1
        const streakMsg = streakTier === 4 ? '⚡ GODLIKE'
          : streakTier === 3 ? '⚡ UNSTOPPABLE'
          : streakTier === 2 ? '⚡ DOMINATING'
          : streakTier === 1 ? '⚡ RAMPAGE'
          : streakTier === 0 ? '⚡ KILLING SPREE'
          : null
        if (streakMsg) { playKillMulti(streakTier); setWaveMessage(streakMsg); setTimeout(() => setWaveMessage(''), 1800) }
        else if (comboMsg) {
          const comboTier = es.killComboCount >= 5 ? 3 : es.killComboCount === 4 ? 2 : es.killComboCount === 3 ? 1 : 0
          playKillCombo(comboTier); setWaveMessage(comboMsg); setTimeout(() => setWaveMessage(''), 1800)
        }
      }

      if (isHardlineMode) {
        es.hardlineProgress += enemiesToRemove.length
        const newWeapon = HARDLINE_WEAPONS[Math.min(es.hardlineProgress, HARDLINE_WEAPONS.length - 1)]
        const prevWeapon = HARDLINE_WEAPONS[Math.min(es.hardlineProgress - enemiesToRemove.length, HARDLINE_WEAPONS.length - 1)]
        if (newWeapon !== prevWeapon) {
          const wName = WEAPON_CONFIGS[newWeapon].shortName
          setWaveMessage(`► ${wName}`)
          setTimeout(() => setWaveMessage(''), 1500)
          es.ammo = 999
          es.maxAmmo = 999
        }
      }
    }

    es.score         += scoreGained
    es.creditsEarned += creditsGained

    // ── Wave management ───────────────────────────────────────────────────────
    if (isBotMode) {
      if (enemiesToRemove.length > 0 && es.enemies.size < mutators.botCount) {
        const botTypes = (mutators.botEnemyTypes.length > 0 ? mutators.botEnemyTypes : ['basic']) as EnemyType[]
        const isInstakill = mutators.gameType === 'instakill'
        const deficit = mutators.botCount - es.enemies.size
        for (let i = 0; i < deficit; i++) _spawnBotEnemy(botTypes, diffHpMult, isInstakill, arenaHalf)
        setEnemyIds(Array.from(es.enemies.keys()))
      }
    } else {
      if (es.enemies.size === 0 && !es.inWaveBreak) { es.inWaveBreak = true; es.waveBreakTimer = WAVE_BREAK_DURATION }
      if (es.inWaveBreak) {
        es.waveBreakTimer -= dt
        if (es.waveBreakTimer <= 0) {
          es.inWaveBreak = false; es.wave++
          const ids = spawnWave(es.wave, diffHpMult)
          if (mutators.gameType === 'instakill_wave') {
            for (const e of entityStore.enemies.values()) e.health = 0.001
          }
          setEnemyIds(ids)
          setWaveMessage(`Wave ${es.wave}`)
          setTimeout(() => setWaveMessage(''), 2000)
        }
      }
    }

    // ── Game over / respawn ───────────────────────────────────────────────────
    const p1Dead  = es.player.health <= 0
    const p2Dead  = !es.player2Active || es.player2.health <= 0
    const isRange = useGameStore.getState().gameMode === 'shooting_range'

    const maxPlayerHp = Math.round(100 * diffPlayerHpMult)
    if (p1Dead && (isRange || isBotMode)) {
      es.player.health = maxPlayerHp
      if (isBotMode) {
        es.player.position.set(0, 0)
        es.player.invincibleUntil = now + 2.2
        es.killStreak = 0
      }
    } else if (p1Dead && mutators.gameType === 'roundtime' && es.playerLives > 0) {
      // Lives-based respawn
      es.playerLives--
      es.player.health = maxPlayerHp
      es.player.position.set(0, 0)
      es.player.invincibleUntil = now + 2.2
    } else if (p1Dead && p2Dead && !isRange && !isBotMode && !gameOverFiredRef.current) {
      gameOverFiredRef.current = true
      useLoadoutStore.getState().addCredits(es.creditsEarned)
      useGameStore.getState().updateHUD(0, es.score, es.wave, es.ammo, es.maxAmmo, es.creditsEarned, Math.round(es.player.armor))
      if (cameraModeRef.current === 'fps') {
        document.exitPointerLock()
        cameraModeRef.current = 'topdown'
        setCameraMode('topdown')
        // Delay until pointer lock is fully released so gameover screen is interactive
        const pt = isPlaytesting
        setTimeout(() => {
          setPhase('gameover')
          if (pt) setTimeout(() => { setPlaytesting(false); setPhase('editor') }, 3000)
        }, 80)
      } else {
        setPhase('gameover')
        if (isPlaytesting) setTimeout(() => { setPlaytesting(false); setPhase('editor') }, 3000)
      }
      return
    }

    // ── Net: broadcast at 20 Hz ──────────────────────────────────────────────
    netBroadcastTimer.current -= rawDt
    if (netBroadcastTimer.current <= 0) {
      netBroadcastTimer.current = 0.05
      if (netRole === 'host') {
        const snap: NetGameState = {
          seq:     ++netSeqRef.current,
          players: [
            { id: 'host', x: es.player.position.x, z: es.player.position.y, a: es.player.angle,
              h: Math.ceil(Math.max(0, es.player.health)), ammo: es.ammo },
            ...(es.player2Active && es.player2.health > 0
              ? [{ id: 'guest', x: es.player2.position.x, z: es.player2.position.y,
                   a: es.player2.angle, h: Math.ceil(Math.max(0, es.player2.health)), ammo: es.ammo2 }]
              : []),
          ],
          enemies: Array.from(es.enemies.values()).map((e) => ({
            id: e.id, x: e.position.x, z: e.position.y, h: e.health, type: e.type,
          })),
          wave:        es.wave,
          score:       es.score,
          inBreak:     es.inWaveBreak,
          waveMsg:     '',
          p1GrenCount: es.grenadeCount,
        }
        socket.emit('host_state', snap)
        // Emit game_over when host's game ends
        if (es.player.health <= 0 && (!es.player2Active || es.player2.health <= 0)) {
          socket.emit('game_over', es.score, es.wave)
        }
      } else if (netRole === 'guest') {
        const inp: NetPlayerInput = {
          seq:      ++netSeqRef.current,
          x:        es.player.position.x,
          z:        es.player.position.y,
          a:        es.player.angle,
          h:        Math.ceil(Math.max(0, es.player.health)),
          ammo:     es.ammo,
          grenCount: es.grenadeCount,
        }
        socket.emit('player_input', inp)
      }
    }

    // ── Throttled HUD ─────────────────────────────────────────────────────────
    hudTimer.current += delta
    if (hudTimer.current >= 0.08) {
      hudTimer.current = 0
      updateHUD(Math.max(0, Math.ceil(es.player.health)), es.score, es.wave, es.ammo, es.maxAmmo, es.creditsEarned, Math.round(es.player.armor))
    }
    hudP2Timer.current += delta
    if (hudP2Timer.current >= 0.1) {
      hudP2Timer.current = 0
      updateP2HUD(es.player2Active, Math.max(0, Math.ceil(es.player2.health)), es.ammo2, es.maxAmmo2)
    }
    btTimer.current += delta
    if (btTimer.current >= 0.03) {
      btTimer.current = 0
      setBulletTime(Math.round(es.focus), es.isBulletTime)
    }
    hudMutTimer.current += delta
    if (hudMutTimer.current >= 0.25) {
      hudMutTimer.current = 0
      updateMutatorHUD(
        Math.ceil(es.roundTimer),
        es.playerLives,
        es.p2Lives,
        es.inSuddenDeath,
        chaosModeActive && es.chaosWeaponId !== null,
      )
    }
  })

  return (
    <>
      <group scale={charScale}>
        <Arena arenaHalf={arenaHalfRef.current} />
      </group>
      {gameModeLive === 'shooting_range' && <ShootingRangeLayout />}
      {activeLevelRef.current && <GameLevelObjects level={activeLevelRef.current} />}
      <group ref={playerGroupRef} scale={charScale}>
        <PlayerMesh />
      </group>
      <group ref={player2GroupRef} visible={false} scale={charScale}>
        <PlayerMesh player2 />
      </group>
      {enemyIds.map((id) => <EnemyMesh key={id} id={id} />)}

      {/* FPS weapon arm — positioned each frame in useFrame */}
      <group ref={fpsWeaponRef} visible={false}>
        <mesh position={[0, -0.04, 0.1]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.09, 0.09, 0.26]} />
          <meshStandardMaterial color="#1a3a6e" roughness={0.55} metalness={isLowQuality ? 0 : 0.2} />
        </mesh>
        <mesh position={[0, -0.01, -0.1]}>
          <boxGeometry args={[0.11, 0.08, 0.42]} />
          <meshStandardMaterial color="#1a1a1a" emissive="#111111" emissiveIntensity={0.2} roughness={0.2} metalness={isLowQuality ? 0 : 0.9} />
        </mesh>
      </group>
      {bulletIds.map((id) => <BulletMesh key={id} id={id} />)}
      {enemyBulletIds.map((id) => <EnemyBulletMesh key={id} id={id} />)}

      {/* Pre-allocated grenade meshes */}
      {Array.from({ length: MAX_GRENADES }, (_, i) => (
        <mesh
          key={`grenade-slot-${i}`}
          ref={(m) => { grenadeMeshRefs.current[i] = m }}
          visible={false}
        >
          <sphereGeometry args={[0.2, 6, 6]} />
          <meshStandardMaterial
            color="#446644"
            emissive="#ff2200"
            emissiveIntensity={0}
            roughness={0.4}
            metalness={isLowQuality ? 0 : 0.7}
          />
        </mesh>
      ))}

      {/* Weapon projectile (plasma / bazooka) */}
      <mesh ref={weaponProjMeshRef} visible={false}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial
          color="#00ccff"
          emissive="#0066ff"
          emissiveIntensity={2}
          roughness={0.1}
          metalness={isLowQuality ? 0 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      {!isLowQuality && <pointLight ref={weaponProjLightRef} visible={false} color="#00aaff" intensity={5} distance={10} decay={2} />}

      {/* Banana meshes */}
      {Array.from({ length: MAX_BANANAS }, (_, i) => (
        <mesh key={`banana-slot-${i}`} ref={(m) => { bananaMeshRefs.current[i] = m }} visible={false}>
          <sphereGeometry args={[0.18, 6, 6]} />
          <meshStandardMaterial
            color="#eecc00"
            emissive="#ffaa00"
            emissiveIntensity={0}
            roughness={0.5}
            metalness={isLowQuality ? 0 : 0.1}
          />
        </mesh>
      ))}

      {/* Vernichter projectile */}
      <mesh ref={vernichterMeshRef} visible={false}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial
          color="#ff6600"
          emissive="#ff2200"
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={isLowQuality ? 0 : 0.3}
          transparent
          opacity={0.92}
        />
      </mesh>
      <pointLight
        ref={vernichterLightRef}
        visible={false}
        color="#ff4400"
        intensity={8}
        distance={12}
        decay={2}
      />

      {/* Ion Cannon reticle */}
      <mesh ref={ionReticleMeshRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.2, 32]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={4} transparent opacity={0.8} />
      </mesh>

      {/* Ion Cannon beams (4 pillars) */}
      {ionBeamMeshRefs.map((ref, i) => (
        <mesh key={i} ref={ref} visible={false}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={8} transparent opacity={0.9} />
        </mesh>
      ))}

      {/* Death Laser beam */}
      <mesh ref={laserBeamMeshRef} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ff2200"
          emissive="#ff4400"
          emissiveIntensity={6}
          roughness={0}
          metalness={0}
          transparent
          opacity={0.9}
        />
      </mesh>

      <ParticleSystem />
      <PickupSystem />
      <SuddenDeathOverlay />
      {DEBUG_VIEW && <DebugView />}

      {/* Script system */}
      {activePlayLevel && <ScriptEngine level={activePlayLevel} />}
      {activePlayLevel?.fogOfWar && <FogOfWar arenaHalf={activePlayLevel.arenaHalf ?? ARENA_HALF} />}

      <ambientLight ref={ambientRef} intensity={isLowQuality ? 1.6 : 0.25} color="#4488ff" />
      {!isLowQuality && <directionalLight ref={dirLightRef} position={[5, 15, 5]} intensity={1.2} color="#ffffff" castShadow />}
      {graphicsQuality === 'high' && <pointLight position={[0, 8, 0]} intensity={0.6} color="#2244aa" distance={40} />}
      <EnemyProjector />
      <DemoRecorder />
    </>
  )
}
