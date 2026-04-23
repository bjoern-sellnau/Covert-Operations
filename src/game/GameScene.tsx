import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { entityStore, resetEntityStore } from './entityStore'
import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from './loadoutStore'
import { useInput } from './useInput'
import { spawnWave } from './spawnWave'
import {
  PLAYER_SPEED,
  PLAYER_RADIUS,
  BULLET_LIFETIME,
  BULLET_RADIUS,
  ARENA_HALF,
  ENEMY_CONFIGS,
  WEAPON_CONFIGS,
  AMMO_CONFIGS,
  INVINCIBLE_DURATION,
  WAVE_BREAK_DURATION,
  BULLET_TIME_SCALE,
  BULLET_TIME_PLAYER_REAL,
  FOCUS_MAX,
  FOCUS_DRAIN_RATE,
  FOCUS_REGEN_RATE,
  FOCUS_MIN_ACTIVATE,
} from './types'
import { Arena } from './Arena'
import { PlayerMesh } from './PlayerMesh'
import { EnemyMesh } from './EnemyMesh'
import { BulletMesh } from './BulletMesh'

const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const _raycaster = new THREE.Raycaster()
const _mouseTarget = new THREE.Vector3()
const _toMouse = new THREE.Vector2()
const _toPlayer = new THREE.Vector2()
const _diff = new THREE.Vector2()

const _btAmbientColor = new THREE.Color(0xaaccff)
const _normalAmbientColor = new THREE.Color(0x4488ff)
const _btDirColor = new THREE.Color(0x6688cc)
const _normalDirColor = new THREE.Color(0xffffff)

export function GameScene() {
  const { camera } = useThree()
  const input = useInput()
  const setPhase = useGameStore((s) => s.setPhase)
  const updateHUD = useGameStore((s) => s.updateHUD)
  const setBulletTime = useGameStore((s) => s.setBulletTime)
  const setEnemyIds = useGameStore((s) => s.setEnemyIds)
  const setBulletIds = useGameStore((s) => s.setBulletIds)
  const setWaveMessage = useGameStore((s) => s.setWaveMessage)
  const phase = useGameStore((s) => s.phase)
  const enemyIds = useGameStore((s) => s.enemyIds)
  const bulletIds = useGameStore((s) => s.bulletIds)

  const playerGroupRef = useRef<THREE.Group>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const dirLightRef = useRef<THREE.DirectionalLight>(null)
  const hudTimer = useRef(0)
  const btTimer = useRef(0)
  const phaseRef = useRef(phase)

  useEffect(() => { phaseRef.current = phase }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return
    resetEntityStore()
    useGameStore.getState().reset()

    // Apply loadout to entity store
    const loadout = useLoadoutStore.getState()
    const maxAmmo = loadout.getMaxAmmo()
    entityStore.ammo = maxAmmo
    entityStore.maxAmmo = maxAmmo
    entityStore.creditsEarned = 0

    const ids = spawnWave(1)
    setEnemyIds(ids)
    setWaveMessage('Wave 1')
    setTimeout(() => setWaveMessage(''), 2000)
  }, [phase, setEnemyIds, setWaveMessage])

  useEffect(() => {
    camera.position.set(0, 22, 9)
    camera.lookAt(0, 0, -1)
  }, [camera])

  useFrame((state, delta) => {
    if (phaseRef.current !== 'playing') return

    const rawDt = Math.min(delta, 0.05)
    const es = entityStore
    const now = state.clock.elapsedTime
    const keys = input.current.keys

    // ── Bullet Time ──────────────────────────────────────────────────────────
    const wantBT = keys.has('ShiftLeft') || keys.has('ShiftRight')
    if (wantBT && es.focus >= FOCUS_MIN_ACTIVATE) {
      es.isBulletTime = true
      es.focus = Math.max(0, es.focus - FOCUS_DRAIN_RATE * delta)
      if (es.focus === 0) es.isBulletTime = false
    } else {
      es.isBulletTime = false
      es.focus = Math.min(FOCUS_MAX, es.focus + FOCUS_REGEN_RATE * delta)
    }

    const timeScale = es.isBulletTime ? BULLET_TIME_SCALE : 1.0
    const dt = rawDt * timeScale
    const playerDt = es.isBulletTime ? rawDt * BULLET_TIME_PLAYER_REAL : rawDt

    // ── Lighting ─────────────────────────────────────────────────────────────
    if (ambientRef.current) {
      ambientRef.current.color.lerp(es.isBulletTime ? _btAmbientColor : _normalAmbientColor, 0.07)
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, es.isBulletTime ? 0.7 : 0.25, 0.07)
    }
    if (dirLightRef.current) {
      dirLightRef.current.color.lerp(es.isBulletTime ? _btDirColor : _normalDirColor, 0.07)
      dirLightRef.current.intensity = THREE.MathUtils.lerp(dirLightRef.current.intensity, es.isBulletTime ? 0.5 : 1.2, 0.07)
    }

    // ── Mouse world position ─────────────────────────────────────────────────
    _raycaster.setFromCamera(state.pointer, camera)
    _raycaster.ray.intersectPlane(_groundPlane, _mouseTarget)
    es.mouseWorld.copy(_mouseTarget)

    // ── Player movement ──────────────────────────────────────────────────────
    let dx = 0, dz = 0
    if (keys.has('KeyW') || keys.has('ArrowUp')) dz -= 1
    if (keys.has('KeyS') || keys.has('ArrowDown')) dz += 1
    if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1
    if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1
    if (dx !== 0 || dz !== 0) { const len = Math.sqrt(dx * dx + dz * dz); dx /= len; dz /= len }

    const bound = ARENA_HALF - PLAYER_RADIUS - 0.5
    es.player.position.x = Math.max(-bound, Math.min(bound, es.player.position.x + dx * PLAYER_SPEED * playerDt))
    es.player.position.y = Math.max(-bound, Math.min(bound, es.player.position.y + dz * PLAYER_SPEED * playerDt))

    _toMouse.set(es.mouseWorld.x - es.player.position.x, es.mouseWorld.z - es.player.position.y)
    if (_toMouse.lengthSq() > 0.01) es.player.angle = Math.atan2(_toMouse.x, -_toMouse.y)

    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(es.player.position.x, 0, es.player.position.y)
      playerGroupRef.current.rotation.y = es.player.angle
    }

    // ── Shooting (fire rate uses real delta) ─────────────────────────────────
    es.player.shootCooldown -= delta
    const isShooting = input.current.mouseButtons.has(0) || keys.has('Space')
    const loadout = useLoadoutStore.getState()
    const weaponCfg = WEAPON_CONFIGS[loadout.selectedWeapon]
    const dmgBonus = AMMO_CONFIGS[loadout.selectedAmmo].damageBonus
    const finalDamage = weaponCfg.baseDamage + dmgBonus

    if (isShooting && es.player.shootCooldown <= 0 && _toMouse.lengthSq() > 0.01 && es.ammo > 0) {
      es.player.shootCooldown = weaponCfg.shootCooldown
      es.ammo = Math.max(0, es.ammo - 1)

      const baseAngle = Math.atan2(_toMouse.x, -_toMouse.y)

      for (let p = 0; p < weaponCfg.pellets; p++) {
        const pelletAngle = baseAngle + (Math.random() - 0.5) * 2 * weaponCfg.spread
        const bDir = new THREE.Vector2(Math.sin(pelletAngle), -Math.cos(pelletAngle))
        const bid = `bullet-${++es.bulletIdCounter}`
        es.bullets.set(bid, {
          id: bid,
          position: new THREE.Vector2(
            es.player.position.x + bDir.x * (PLAYER_RADIUS + 0.2),
            es.player.position.y + bDir.y * (PLAYER_RADIUS + 0.2),
          ),
          velocity: new THREE.Vector2(bDir.x * weaponCfg.bulletSpeed, bDir.y * weaponCfg.bulletSpeed),
          lifetime: BULLET_LIFETIME,
          damage: finalDamage,
        })
      }
      setBulletIds(Array.from(es.bullets.keys()))
    }

    // ── Update bullets ───────────────────────────────────────────────────────
    const bulletsToRemove: string[] = []
    for (const [id, bullet] of es.bullets) {
      bullet.position.x += bullet.velocity.x * dt
      bullet.position.y += bullet.velocity.y * dt
      bullet.lifetime -= dt
      if (bullet.lifetime <= 0 || Math.abs(bullet.position.x) > ARENA_HALF || Math.abs(bullet.position.y) > ARENA_HALF) {
        bulletsToRemove.push(id)
      }
    }

    // ── Update enemies ───────────────────────────────────────────────────────
    const enemiesToRemove: string[] = []
    let scoreGained = 0
    let creditsGained = 0
    const hitBullets = new Set<string>()

    for (const [eid, enemy] of es.enemies) {
      const cfg = ENEMY_CONFIGS[enemy.type]

      _toPlayer.set(es.player.position.x - enemy.position.x, es.player.position.y - enemy.position.y)
      const dist = _toPlayer.length()
      if (dist > 0.05) {
        _toPlayer.multiplyScalar(cfg.speed * dt / dist)
        enemy.position.x += _toPlayer.x
        enemy.position.y += _toPlayer.y
      }

      for (const [bid, bullet] of es.bullets) {
        if (hitBullets.has(bid)) continue
        _diff.set(bullet.position.x - enemy.position.x, bullet.position.y - enemy.position.y)
        if (_diff.length() < cfg.size + BULLET_RADIUS) {
          enemy.health -= bullet.damage
          enemy.hitTime = now
          hitBullets.add(bid)
          bulletsToRemove.push(bid)
          if (enemy.health <= 0) {
            enemiesToRemove.push(eid)
            scoreGained += cfg.scoreValue
            creditsGained += cfg.creditValue
          }
          break
        }
      }

      if (dist < cfg.size + PLAYER_RADIUS && now > es.player.invincibleUntil) {
        es.player.health -= cfg.damage
        es.player.invincibleUntil = now + INVINCIBLE_DURATION
        if (es.player.health < 0) es.player.health = 0
      }
    }

    // ── Apply removals ───────────────────────────────────────────────────────
    let changed = false
    for (const id of bulletsToRemove) { if (es.bullets.delete(id)) changed = true }
    if (changed) setBulletIds(Array.from(es.bullets.keys()))

    changed = false
    for (const id of enemiesToRemove) { if (es.enemies.delete(id)) changed = true }
    if (changed) setEnemyIds(Array.from(es.enemies.keys()))

    es.score += scoreGained
    es.creditsEarned += creditsGained

    // ── Wave management ──────────────────────────────────────────────────────
    if (es.enemies.size === 0 && !es.inWaveBreak) { es.inWaveBreak = true; es.waveBreakTimer = WAVE_BREAK_DURATION }
    if (es.inWaveBreak) {
      es.waveBreakTimer -= dt
      if (es.waveBreakTimer <= 0) {
        es.inWaveBreak = false
        es.wave++
        const ids = spawnWave(es.wave)
        setEnemyIds(ids)
        setWaveMessage(`Wave ${es.wave}`)
        setTimeout(() => setWaveMessage(''), 2000)
      }
    }

    // ── Game over ────────────────────────────────────────────────────────────
    if (es.player.health <= 0) {
      useLoadoutStore.getState().addCredits(es.creditsEarned)
      setPhase('gameover')
      useGameStore.getState().updateHUD(0, es.score, es.wave, es.ammo, es.maxAmmo, es.creditsEarned)
      return
    }

    // ── Throttled HUD updates ────────────────────────────────────────────────
    hudTimer.current += delta
    if (hudTimer.current >= 0.08) {
      hudTimer.current = 0
      updateHUD(Math.max(0, Math.ceil(es.player.health)), es.score, es.wave, es.ammo, es.maxAmmo, es.creditsEarned)
    }
    btTimer.current += delta
    if (btTimer.current >= 0.03) {
      btTimer.current = 0
      setBulletTime(Math.round(es.focus), es.isBulletTime)
    }
  })

  return (
    <>
      <Arena />
      <group ref={playerGroupRef}>
        <PlayerMesh />
      </group>
      {enemyIds.map((id) => <EnemyMesh key={id} id={id} />)}
      {bulletIds.map((id) => <BulletMesh key={id} id={id} />)}
      <ambientLight ref={ambientRef} intensity={0.25} color="#4488ff" />
      <directionalLight ref={dirLightRef} position={[5, 15, 5]} intensity={1.2} color="#ffffff" castShadow />
      <pointLight position={[0, 8, 0]} intensity={0.6} color="#2244aa" distance={40} />
    </>
  )
}
