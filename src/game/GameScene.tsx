import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { entityStore, resetEntityStore, spawnParticles, spawnDecal } from './entityStore'
import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from './loadoutStore'
import { useEditorStore } from '../editor/editorStore'
import { useSettingsStore, BLOOD_COUNTS, EXPL_COUNTS, SPARK_COUNTS } from '../store/settingsStore'
import { useInput } from './useInput'
import { spawnWave } from './spawnWave'
import { GameLevelObjects, resolveCircleVsLevel, pointIntersectsLevel } from './GameLevelObjects'
import type { Level } from '../editor/editorStore'
import {
  PLAYER_SPEED, PLAYER_RADIUS, BULLET_LIFETIME, BULLET_RADIUS,
  ARENA_HALF, ENEMY_CONFIGS, WEAPON_CONFIGS, AMMO_CONFIGS,
  INVINCIBLE_DURATION, WAVE_BREAK_DURATION,
  BULLET_TIME_SCALE, BULLET_TIME_PLAYER_REAL,
  FOCUS_MAX, FOCUS_DRAIN_RATE, FOCUS_REGEN_RATE, FOCUS_MIN_ACTIVATE,
  DIVE_SPEED, DIVE_DURATION, DIVE_COOLDOWN,
  SPIN_DURATION, SPIN_COOLDOWN, SPIN_FIRE_RATE,
  GRENADE_SPEED, GRENADE_FUSE, GRENADE_BOUNCE, GRENADE_RADIUS, GRENADE_DAMAGE,
  MAX_BOUNCES,
} from './types'
import { Arena } from './Arena'
import { PlayerMesh } from './PlayerMesh'
import { EnemyMesh } from './EnemyMesh'
import { BulletMesh } from './BulletMesh'
import { ParticleSystem } from './ParticleSystem'

const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const _raycaster   = new THREE.Raycaster()
const _mouseTarget = new THREE.Vector3()
const _toMouse     = new THREE.Vector2()
const _toPlayer    = new THREE.Vector2()
const _diff        = new THREE.Vector2()

const _btAmbientColor     = new THREE.Color(0xaaccff)
const _normalAmbientColor = new THREE.Color(0x4488ff)
const _btDirColor         = new THREE.Color(0x6688cc)
const _normalDirColor     = new THREE.Color(0xffffff)

const FPS_SENS   = 0.0025
const MAX_GRENADES = 6

export function GameScene() {
  const { camera, gl } = useThree()
  const input          = useInput()
  const setPhase       = useGameStore((s) => s.setPhase)
  const updateHUD      = useGameStore((s) => s.updateHUD)
  const setBulletTime  = useGameStore((s) => s.setBulletTime)
  const setEnemyIds    = useGameStore((s) => s.setEnemyIds)
  const setBulletIds   = useGameStore((s) => s.setBulletIds)
  const setWaveMessage = useGameStore((s) => s.setWaveMessage)
  const setFpsMode     = useGameStore((s) => s.setFpsMode)
  const isPlaytesting  = useGameStore((s) => s.isPlaytesting)
  const setPlaytesting = useGameStore((s) => s.setPlaytesting)
  const phase          = useGameStore((s) => s.phase)
  const enemyIds       = useGameStore((s) => s.enemyIds)
  const bulletIds      = useGameStore((s) => s.bulletIds)

  const playerGroupRef  = useRef<THREE.Group>(null)
  const ambientRef      = useRef<THREE.AmbientLight>(null)
  const dirLightRef     = useRef<THREE.DirectionalLight>(null)
  const grenadeMeshRefs = useRef<(THREE.Mesh | null)[]>(Array(MAX_GRENADES).fill(null))

  const hudTimer   = useRef(0)
  const btTimer    = useRef(0)
  const phaseRef   = useRef(phase)
  const fpsModeRef = useRef(false)
  const activeLevelRef = useRef<Level | null>(null)

  // Edge-detection refs
  const spacePrev = useRef(false)
  const qPrev     = useRef(false)
  const ePrev     = useRef(false)
  const gPrev     = useRef(false)

  useEffect(() => { phaseRef.current = phase }, [phase])

  // ── Initialize ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    resetEntityStore()
    useGameStore.getState().reset()

    const loadout = useLoadoutStore.getState()
    entityStore.ammo          = loadout.getMaxAmmo()
    entityStore.maxAmmo       = entityStore.ammo
    entityStore.creditsEarned = 0
    entityStore.isAkimbo      = loadout.isAkimbo &&
      (loadout.selectedWeapon === 'pistol' || loadout.selectedWeapon === 'smg')
    entityStore.grenadeCount  = 3

    activeLevelRef.current = useEditorStore.getState().activePlayLevel

    const ids = spawnWave(1)
    setEnemyIds(ids)
    setWaveMessage('Wave 1')
    setTimeout(() => setWaveMessage(''), 2000)
  }, [phase, setEnemyIds, setWaveMessage])

  // ── Camera default ────────────────────────────────────────────────────────
  useEffect(() => {
    camera.position.set(0, 22, 9)
    camera.lookAt(0, 0, -1)
  }, [camera])

  // ── FPS toggle (F key) ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && phaseRef.current === 'playing') {
        fpsModeRef.current = !fpsModeRef.current
        setFpsMode(fpsModeRef.current)
        if (fpsModeRef.current) gl.domElement.requestPointerLock()
        else {
          document.exitPointerLock()
          camera.position.set(0, 22, 9)
          camera.lookAt(0, 0, -1)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [camera, gl.domElement, setFpsMode])

  // ── FPS pointer lock ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!fpsModeRef.current || !document.pointerLockElement) return
      entityStore.player.angle += e.movementX * FPS_SENS
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  // ── Main game loop ────────────────────────────────────────────────────────
  useFrame((state, delta) => {
    if (phaseRef.current !== 'playing') return

    const rawDt = Math.min(delta, 0.05)
    const es    = entityStore
    const now   = state.clock.elapsedTime
    const keys  = input.current.keys
    const level = activeLevelRef.current
    const bloodIntensity = useSettingsStore.getState().bloodIntensity

    // ── Edge detection ────────────────────────────────────────────────────────
    const spaceDown = keys.has('Space')
    const qDown     = keys.has('KeyQ')
    const eDown     = keys.has('KeyE')
    const gDown     = keys.has('KeyG')
    const spaceJust = spaceDown && !spacePrev.current
    const qJust     = qDown     && !qPrev.current
    const eJust     = eDown     && !ePrev.current
    const gJust     = gDown     && !gPrev.current
    spacePrev.current = spaceDown
    qPrev.current     = qDown
    ePrev.current     = eDown
    gPrev.current     = gDown

    // ── Bullet time ───────────────────────────────────────────────────────────
    const wantBT     = keys.has('ShiftLeft') || keys.has('ShiftRight')
    const maneuverBT = es.maneuver !== 'none'

    if (maneuverBT) {
      es.isBulletTime = true
      // No focus drain during maneuver
    } else if (wantBT && es.focus >= FOCUS_MIN_ACTIVATE) {
      es.isBulletTime = true
      es.focus = Math.max(0, es.focus - FOCUS_DRAIN_RATE * delta)
      if (es.focus === 0) es.isBulletTime = false
    } else {
      es.isBulletTime = false
      es.focus = Math.min(FOCUS_MAX, es.focus + FOCUS_REGEN_RATE * delta)
    }

    const timeScale = es.isBulletTime ? BULLET_TIME_SCALE : 1.0
    const dt        = rawDt * timeScale
    const playerDt  = es.isBulletTime ? rawDt * BULLET_TIME_PLAYER_REAL : rawDt

    // ── Lighting ──────────────────────────────────────────────────────────────
    if (ambientRef.current) {
      ambientRef.current.color.lerp(es.isBulletTime ? _btAmbientColor : _normalAmbientColor, 0.07)
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, es.isBulletTime ? 0.7 : 0.25, 0.07)
    }
    if (dirLightRef.current) {
      dirLightRef.current.color.lerp(es.isBulletTime ? _btDirColor : _normalDirColor, 0.07)
      dirLightRef.current.intensity = THREE.MathUtils.lerp(dirLightRef.current.intensity, es.isBulletTime ? 0.5 : 1.2, 0.07)
    }

    // ── Aim direction ─────────────────────────────────────────────────────────
    if (!fpsModeRef.current && es.maneuver !== 'spin') {
      _raycaster.setFromCamera(state.pointer, camera)
      _raycaster.ray.intersectPlane(_groundPlane, _mouseTarget)
      es.mouseWorld.copy(_mouseTarget)
      _toMouse.set(es.mouseWorld.x - es.player.position.x, es.mouseWorld.z - es.player.position.y)
      if (_toMouse.lengthSq() > 0.01) es.player.angle = Math.atan2(_toMouse.x, -_toMouse.y)
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
      const dlen = Math.sqrt(ddx * ddx + ddz * ddz)
      es.maneuverDx    = ddx / dlen
      es.maneuverDz    = ddz / dlen
      es.maneuver      = 'dive'
      es.maneuverTimer = DIVE_DURATION
    }

    // ── Trigger: Ballett-Spin (Q/E, only when akimbo) ─────────────────────────
    if ((qJust || eJust) && es.maneuver === 'none' && es.spinCooldown <= 0 && es.isAkimbo) {
      es.spinDir       = qJust ? -1 : 1
      es.maneuver      = 'spin'
      es.maneuverTimer = SPIN_DURATION
      es.spinFireTimer = 0
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
      const spinRate = (Math.PI * 2 * 1.5) / SPIN_DURATION
      es.player.angle += es.spinDir * spinRate * rawDt
      _toMouse.set(Math.sin(es.player.angle), -Math.cos(es.player.angle))
      es.maneuverTimer -= rawDt
      if (es.maneuverTimer <= 0) {
        es.maneuver     = 'none'
        es.spinCooldown = SPIN_COOLDOWN
      }
    } else {
      if (keys.has('KeyW') || keys.has('ArrowUp'))    dz -= 1
      if (keys.has('KeyS') || keys.has('ArrowDown'))  dz += 1
      if (keys.has('KeyA') || keys.has('ArrowLeft'))  dx -= 1
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1

      if (fpsModeRef.current && (dx !== 0 || dz !== 0)) {
        const fwdX = Math.sin(es.player.angle), fwdZ = -Math.cos(es.player.angle)
        const rtX  = Math.cos(es.player.angle), rtZ  =  Math.sin(es.player.angle)
        const mx   = fwdX * (-dz) + rtX * dx
        const mz   = fwdZ * (-dz) + rtZ * dx
        const len  = Math.sqrt(mx * mx + mz * mz)
        dx = len > 0 ? mx / len : 0
        dz = len > 0 ? mz / len : 0
      } else if (dx !== 0 || dz !== 0) {
        const len = Math.sqrt(dx * dx + dz * dz)
        dx /= len; dz /= len
      }
    }

    const moveSpeed = es.maneuver === 'dive' ? DIVE_SPEED : PLAYER_SPEED
    const bound     = ARENA_HALF - PLAYER_RADIUS - 0.5
    let nx = Math.max(-bound, Math.min(bound, es.player.position.x + dx * moveSpeed * playerDt))
    let nz = Math.max(-bound, Math.min(bound, es.player.position.y + dz * moveSpeed * playerDt))
    if (level) { const r = resolveCircleVsLevel(nx, nz, PLAYER_RADIUS, level); nx = r.x; nz = r.z }
    es.player.position.x = nx
    es.player.position.y = nz

    // ── Camera ────────────────────────────────────────────────────────────────
    if (fpsModeRef.current) {
      camera.position.set(es.player.position.x, 0.7, es.player.position.y)
      camera.lookAt(
        es.player.position.x + Math.sin(es.player.angle) * 10,
        0.7,
        es.player.position.y - Math.cos(es.player.angle) * 10,
      )
    } else if (Math.abs(camera.position.y - 22) > 0.5) {
      camera.position.set(0, 22, 9)
      camera.lookAt(0, 0, -1)
    }

    // ── Player mesh ───────────────────────────────────────────────────────────
    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(es.player.position.x, 0, es.player.position.y)
      playerGroupRef.current.rotation.y = es.player.angle
      playerGroupRef.current.visible    = !fpsModeRef.current
    }

    // ── Shooting ──────────────────────────────────────────────────────────────
    es.player.shootCooldown -= delta
    const loadout     = useLoadoutStore.getState()
    const weaponCfg   = WEAPON_CONFIGS[loadout.selectedWeapon]
    const finalDamage = weaponCfg.baseDamage + AMMO_CONFIGS[loadout.selectedAmmo].damageBonus
    const isShooting  = input.current.mouseButtons.has(0)

    // Spin auto-fire (fires both barrels)
    if (es.maneuver === 'spin' && es.ammo >= 2) {
      es.spinFireTimer -= rawDt
      if (es.spinFireTimer <= 0) {
        es.spinFireTimer = SPIN_FIRE_RATE
        for (const offset of [-0.12, 0.12]) {
          const ang  = Math.atan2(_toMouse.x, _toMouse.y) + offset
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
          })
        }
        es.ammo = Math.max(0, es.ammo - 2)
        setBulletIds(Array.from(es.bullets.keys()))
      }
    } else if (isShooting && es.player.shootCooldown <= 0 && es.ammo > 0 && es.maneuver !== 'spin') {
      es.player.shootCooldown = weaponCfg.shootCooldown
      const baseAngle = Math.atan2(_toMouse.x, _toMouse.y)
      const offsets   = es.isAkimbo ? [-0.1, 0.1] : [0]
      const ammoCost  = es.isAkimbo ? 2 : 1

      if (es.ammo >= ammoCost) {
        es.ammo = Math.max(0, es.ammo - ammoCost)
        for (const lateralOff of offsets) {
          for (let p = 0; p < weaponCfg.pellets; p++) {
            const ang  = baseAngle + (Math.random() - 0.5) * 2 * weaponCfg.spread + lateralOff
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
            })
          }
        }
        setBulletIds(Array.from(es.bullets.keys()))
      }
    }

    // ── Declare removal/score accumulators early (used by grenades + bullets) ─
    const enemiesToRemove: string[] = []
    let scoreGained = 0, creditsGained = 0

    // ── Grenade throw (G) ─────────────────────────────────────────────────────
    if (gJust && es.grenadeCount > 0) {
      es.grenadeCount--
      es.grenades.push({
        id:      `grenade-${++es.grenadeIdCounter}`,
        x:       es.player.position.x + _toMouse.x * (PLAYER_RADIUS + 0.3),
        z:       es.player.position.y + _toMouse.y * (PLAYER_RADIUS + 0.3),
        vx:      _toMouse.x * GRENADE_SPEED,
        vz:      _toMouse.y * GRENADE_SPEED,
        timer:   GRENADE_FUSE,
        bounces: 0,
      })
    }

    // ── Update grenades ───────────────────────────────────────────────────────
    const grenadeIdxToRemove: number[] = []
    for (let gi = 0; gi < es.grenades.length; gi++) {
      const g   = es.grenades[gi]
      g.x      += g.vx * rawDt
      g.z      += g.vz * rawDt
      g.timer  -= rawDt

      const half = ARENA_HALF - 0.25
      if (Math.abs(g.x) > half) {
        if (g.bounces < GRENADE_BOUNCE) { g.vx = -g.vx * 0.7; g.x = Math.sign(g.x) * half; g.bounces++ }
        else g.timer = 0
      }
      if (Math.abs(g.z) > half) {
        if (g.bounces < GRENADE_BOUNCE) { g.vz = -g.vz * 0.7; g.z = Math.sign(g.z) * half; g.bounces++ }
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

        spawnParticles(g.x, g.z, 'explosion', EXPL_COUNTS[bloodIntensity])

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
            }
            explodedEnemies.add(eid)
          }
        }

        // Damage player
        _diff.set(g.x - es.player.position.x, g.z - es.player.position.y)
        if (_diff.length() < GRENADE_RADIUS && now > es.player.invincibleUntil) {
          const falloff = 1 - _diff.length() / GRENADE_RADIUS
          es.player.health -= Math.round(30 * falloff)
          es.player.invincibleUntil = now + INVINCIBLE_DURATION
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

    // ── Update bullets (with ricochets) ───────────────────────────────────────
    const bulletsToRemove: string[] = []
    for (const [id, bullet] of es.bullets) {
      bullet.position.x += bullet.velocity.x * dt
      bullet.position.y += bullet.velocity.y * dt
      bullet.lifetime   -= dt

      let remove = bullet.lifetime <= 0
      if (!remove) {
        const half = ARENA_HALF - BULLET_RADIUS
        if (Math.abs(bullet.position.x) > half) {
          if (bullet.bounces < MAX_BOUNCES) {
            bullet.velocity.x  = -bullet.velocity.x * 0.85
            bullet.damage      = Math.max(1, Math.round(bullet.damage * 0.7))
            bullet.position.x  = Math.sign(bullet.position.x) * half
            bullet.bounces++
            spawnParticles(bullet.position.x, bullet.position.y, 'spark', SPARK_COUNTS[bloodIntensity])
          } else { remove = true }
        }
        if (!remove && Math.abs(bullet.position.y) > half) {
          if (bullet.bounces < MAX_BOUNCES) {
            bullet.velocity.y  = -bullet.velocity.y * 0.85
            bullet.damage      = Math.max(1, Math.round(bullet.damage * 0.7))
            bullet.position.y  = Math.sign(bullet.position.y) * half
            bullet.bounces++
            spawnParticles(bullet.position.x, bullet.position.y, 'spark', SPARK_COUNTS[bloodIntensity])
          } else { remove = true }
        }
        if (!remove && level && pointIntersectsLevel(bullet.position.x, bullet.position.y, BULLET_RADIUS, level)) {
          remove = true
        }
      }
      if (remove) bulletsToRemove.push(id)
    }

    // ── Update enemies ────────────────────────────────────────────────────────
    const hitBullets = new Set<string>()

    for (const [eid, enemy] of es.enemies) {
      if (enemiesToRemove.includes(eid)) continue
      const cfg = ENEMY_CONFIGS[enemy.type]
      _toPlayer.set(es.player.position.x - enemy.position.x, es.player.position.y - enemy.position.y)
      const dist = _toPlayer.length()

      if (dist > 0.05) {
        _toPlayer.multiplyScalar(cfg.speed * dt / dist)
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
          spawnParticles(enemy.position.x, enemy.position.y, 'blood', BLOOD_COUNTS[bloodIntensity])
          if (bloodIntensity > 0) {
            spawnDecal(enemy.position.x, enemy.position.y, 0.4 + Math.random() * 0.5)
          }
          if (enemy.health <= 0 && !enemiesToRemove.includes(eid)) {
            enemiesToRemove.push(eid)
            scoreGained   += cfg.scoreValue
            creditsGained += cfg.creditValue
            spawnParticles(enemy.position.x, enemy.position.y, 'blood', BLOOD_COUNTS[bloodIntensity])
            spawnDecal(enemy.position.x, enemy.position.y, 0.6 + Math.random() * 0.6)
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

    // ── Apply removals ────────────────────────────────────────────────────────
    let changed = false
    for (const id of bulletsToRemove) { if (es.bullets.delete(id)) changed = true }
    if (changed) setBulletIds(Array.from(es.bullets.keys()))
    changed = false
    for (const id of enemiesToRemove) { if (es.enemies.delete(id)) changed = true }
    if (changed) setEnemyIds(Array.from(es.enemies.keys()))

    es.score         += scoreGained
    es.creditsEarned += creditsGained

    // ── Wave management ───────────────────────────────────────────────────────
    if (es.enemies.size === 0 && !es.inWaveBreak) { es.inWaveBreak = true; es.waveBreakTimer = WAVE_BREAK_DURATION }
    if (es.inWaveBreak) {
      es.waveBreakTimer -= dt
      if (es.waveBreakTimer <= 0) {
        es.inWaveBreak = false; es.wave++
        const ids = spawnWave(es.wave)
        setEnemyIds(ids)
        setWaveMessage(`Wave ${es.wave}`)
        setTimeout(() => setWaveMessage(''), 2000)
      }
    }

    // ── Game over ─────────────────────────────────────────────────────────────
    if (es.player.health <= 0) {
      if (fpsModeRef.current) { document.exitPointerLock(); fpsModeRef.current = false; setFpsMode(false) }
      useLoadoutStore.getState().addCredits(es.creditsEarned)
      setPhase('gameover')
      useGameStore.getState().updateHUD(0, es.score, es.wave, es.ammo, es.maxAmmo, es.creditsEarned)
      if (isPlaytesting) setTimeout(() => { setPlaytesting(false); setPhase('editor') }, 3000)
      return
    }

    // ── Throttled HUD ─────────────────────────────────────────────────────────
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
      {activeLevelRef.current && <GameLevelObjects level={activeLevelRef.current} />}
      <group ref={playerGroupRef}>
        <PlayerMesh />
      </group>
      {enemyIds.map((id) => <EnemyMesh key={id} id={id} />)}
      {bulletIds.map((id) => <BulletMesh key={id} id={id} />)}

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
            metalness={0.7}
          />
        </mesh>
      ))}

      <ParticleSystem />

      <ambientLight ref={ambientRef} intensity={0.25} color="#4488ff" />
      <directionalLight ref={dirLightRef} position={[5, 15, 5]} intensity={1.2} color="#ffffff" castShadow />
      <pointLight position={[0, 8, 0]} intensity={0.6} color="#2244aa" distance={40} />
    </>
  )
}
