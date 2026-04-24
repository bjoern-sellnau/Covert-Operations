import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { entityStore, resetEntityStore, spawnParticles, spawnDecal } from './entityStore'
import type { BananaData } from './entityStore'
import {
  WEAPON_SOUNDS,
  playExplosionSmall, playExplosionLarge,
  playFlakBounce, playBananaBounce, playRicochet,
  playHit,
} from './sounds'
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
  VERNICHTER_SPEED, VERNICHTER_RADIUS, VERNICHTER_DAMAGE,
} from './types'
import { Arena } from './Arena'
import { PlayerMesh } from './PlayerMesh'
import { EnemyMesh } from './EnemyMesh'
import { BulletMesh } from './BulletMesh'
import { ParticleSystem } from './ParticleSystem'
import { ScriptEngine, resetScriptRuntime } from './ScriptEngine'
import { FogOfWar } from './FogOfWar'

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
  const setPhase        = useGameStore((s) => s.setPhase)
  const updateHUD       = useGameStore((s) => s.updateHUD)
  const setBulletTime   = useGameStore((s) => s.setBulletTime)
  const setEnemyIds     = useGameStore((s) => s.setEnemyIds)
  const setBulletIds    = useGameStore((s) => s.setBulletIds)
  const setWaveMessage  = useGameStore((s) => s.setWaveMessage)
  const setFpsMode      = useGameStore((s) => s.setFpsMode)
  const isPlaytesting   = useGameStore((s) => s.isPlaytesting)
  const setPlaytesting  = useGameStore((s) => s.setPlaytesting)
  const setBigExplosion = useGameStore((s) => s.setBigExplosion)
  const phase           = useGameStore((s) => s.phase)
  const enemyIds        = useGameStore((s) => s.enemyIds)
  const bulletIds       = useGameStore((s) => s.bulletIds)
  const activePlayLevel = useEditorStore((s) => s.activePlayLevel)

  const playerGroupRef    = useRef<THREE.Group>(null)
  const ambientRef        = useRef<THREE.AmbientLight>(null)
  const dirLightRef       = useRef<THREE.DirectionalLight>(null)
  const grenadeMeshRefs      = useRef<(THREE.Mesh | null)[]>(Array(MAX_GRENADES).fill(null))
  const vernichterMeshRef    = useRef<THREE.Mesh>(null)
  const vernichterLightRef   = useRef<THREE.PointLight>(null)
  const weaponProjMeshRef    = useRef<THREE.Mesh>(null)
  const weaponProjLightRef   = useRef<THREE.PointLight>(null)
  const MAX_BANANAS = 6
  const bananaMeshRefs       = useRef<(THREE.Mesh | null)[]>(Array(MAX_BANANAS).fill(null))

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
  const rPrev     = useRef(false)

  useEffect(() => { phaseRef.current = phase }, [phase])

  // ── Initialize ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    resetEntityStore()
    resetScriptRuntime()
    useGameStore.getState().reset()

    const loadout = useLoadoutStore.getState()
    entityStore.ammo          = loadout.getMaxAmmo()
    entityStore.maxAmmo       = entityStore.ammo
    entityStore.creditsEarned = 0
    entityStore.isAkimbo      = loadout.isAkimbo &&
      (loadout.selectedWeapon === 'pistol' || loadout.selectedWeapon === 'smg')
    entityStore.grenadeCount  = 3
    entityStore.vernichterAmmo = loadout.vernichterStock

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
    const rDown     = keys.has('KeyR')
    const spaceJust = spaceDown && !spacePrev.current
    const qJust     = qDown     && !qPrev.current
    const eJust     = eDown     && !ePrev.current
    const gJust     = gDown     && !gPrev.current
    const rJust     = rDown     && !rPrev.current
    spacePrev.current = spaceDown
    qPrev.current     = qDown
    ePrev.current     = eDown
    gPrev.current     = gDown
    rPrev.current     = rDown

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
    const isEnergy    = loadout.selectedWeapon === 'blaster' || loadout.selectedWeapon === 'plasma'
    const isFlakWep   = loadout.selectedWeapon === 'flak'
    const bulletMaxBounces = weaponCfg.maxBounces ?? MAX_BOUNCES

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

    // Helper: splash explosion (plasma / bazooka / banana)
    const doSplash = (sx: number, sz: number, radius: number, dmg: number, isLarge: boolean) => {
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
          }
        }
      }
      _diff.set(sx - es.player.position.x, sz - es.player.position.y)
      if (_diff.length() < radius && now > es.player.invincibleUntil) {
        const falloff = 1 - _diff.length() / radius
        es.player.health -= Math.round(dmg * 0.5 * falloff)
        es.player.invincibleUntil = now + INVINCIBLE_DURATION
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
        WEAPON_SOUNDS[loadout.selectedWeapon]?.()
        es.ammo = Math.max(0, es.ammo - 1)
        setBulletIds(Array.from(es.bullets.keys()))
      }
    }

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
            maxBounces: bulletMaxBounces,
            isEnergy,
            isFlak: isFlakWep,
          })
        }
        es.ammo = Math.max(0, es.ammo - 2)
        WEAPON_SOUNDS[loadout.selectedWeapon]?.()
        setBulletIds(Array.from(es.bullets.keys()))
      }
    } else if (isShooting && es.player.shootCooldown <= 0 && es.ammo > 0 && es.maneuver !== 'spin' && es.burstRemaining === 0) {
      es.player.shootCooldown = weaponCfg.shootCooldown
      const baseAngle = Math.atan2(_toMouse.x, _toMouse.y)
      const offsets   = es.isAkimbo ? [-0.1, 0.1] : [0]
      const ammoCost  = es.isAkimbo ? 2 : 1

      if (es.ammo >= ammoCost) {
        WEAPON_SOUNDS[loadout.selectedWeapon]?.()

        if (weaponCfg.isProjectile) {
          // Plasma / Bazooka: single slow projectile
          es.weaponProjectile = {
            x:  es.player.position.x + _toMouse.x * (PLAYER_RADIUS + 0.4),
            z:  es.player.position.y + _toMouse.y * (PLAYER_RADIUS + 0.4),
            vx: _toMouse.x * (weaponCfg.projectileSpeed ?? 8),
            vz: _toMouse.y * (weaponCfg.projectileSpeed ?? 8),
          }
          es.ammo = Math.max(0, es.ammo - 1)
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

    // ── Declare removal/score accumulators ───────────────────────────────────
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

    // ── Update bananas ────────────────────────────────────────────────────────
    const bananaIdxToRemove: number[] = []
    for (let bi = 0; bi < es.bananas.length; bi++) {
      const bn  = es.bananas[bi]
      const wcf = WEAPON_CONFIGS['banana']
      bn.x     += bn.vx * rawDt
      bn.z     += bn.vz * rawDt
      bn.timer -= rawDt

      const half = ARENA_HALF - 0.25
      if (Math.abs(bn.x) > half) {
        if (bn.bounces < (wcf.maxBounces ?? 5)) {
          bn.vx = -bn.vx * 0.75; bn.x = Math.sign(bn.x) * half; bn.bounces++; playBananaBounce()
        } else { bn.timer = 0 }
      }
      if (Math.abs(bn.z) > half) {
        if (bn.bounces < (wcf.maxBounces ?? 5)) {
          bn.vz = -bn.vz * 0.75; bn.z = Math.sign(bn.z) * half; bn.bounces++; playBananaBounce()
        } else { bn.timer = 0 }
      }

      // Level collision bounce
      if (level && pointIntersectsLevel(bn.x, bn.z, 0.2, level)) {
        if (bn.bounces < (wcf.maxBounces ?? 5)) {
          bn.vx = -bn.vx * 0.75; bn.vz = -bn.vz * 0.75; bn.bounces++; playBananaBounce()
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

    // ── Vernichter fire (R) ───────────────────────────────────────────────────
    if (rJust && es.vernichterAmmo > 0 && !es.vernichterProjectile) {
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
      vp.x += vp.vx * rawDt
      vp.z += vp.vz * rawDt

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
      const oob = Math.abs(vp.x) > ARENA_HALF - 0.5 || Math.abs(vp.z) > ARENA_HALF - 0.5
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

    // ── Update weapon projectile (plasma / bazooka) ───────────────────────────
    if (es.weaponProjectile) {
      const wp  = es.weaponProjectile
      const wcf = WEAPON_CONFIGS[loadout.selectedWeapon]
      wp.x += wp.vx * rawDt
      wp.z += wp.vz * rawDt

      const projRadius  = wcf.projectileRadius ?? 2.5
      const projDamage  = wcf.projectileDamage ?? 30
      const isLargeProj = loadout.selectedWeapon === 'bazooka'

      if (weaponProjMeshRef.current) {
        const pulse = Math.sin(now * 14) * 0.1 + 1
        weaponProjMeshRef.current.position.set(wp.x, 0.35, wp.z)
        weaponProjMeshRef.current.scale.setScalar(pulse)
        weaponProjMeshRef.current.visible = true
        const mat = weaponProjMeshRef.current.material as THREE.MeshStandardMaterial
        mat.color.set(isLargeProj ? '#ff6600' : '#00ccff')
        mat.emissive.set(isLargeProj ? '#ff2200' : '#0066ff')
      }
      if (weaponProjLightRef.current) {
        weaponProjLightRef.current.position.set(wp.x, 1.2, wp.z)
        weaponProjLightRef.current.color.set(isLargeProj ? '#ff4400' : '#00aaff')
        weaponProjLightRef.current.visible = true
      }

      const oob = Math.abs(wp.x) > ARENA_HALF - 0.5 || Math.abs(wp.z) > ARENA_HALF - 0.5
      let hitSomething = oob
      if (!oob && level && pointIntersectsLevel(wp.x, wp.z, 0.25, level)) hitSomething = true
      if (!hitSomething) {
        for (const enemy of es.enemies.values()) {
          _diff.set(wp.x - enemy.position.x, wp.z - enemy.position.y)
          if (_diff.length() < ENEMY_CONFIGS[enemy.type].size + 0.4) { hitSomething = true; break }
        }
      }

      if (hitSomething) {
        es.weaponProjectile = null
        if (weaponProjMeshRef.current)  weaponProjMeshRef.current.visible  = false
        if (weaponProjLightRef.current) weaponProjLightRef.current.visible = false
        doSplash(wp.x, wp.z, projRadius, projDamage, isLargeProj)
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
        const half = ARENA_HALF - BULLET_RADIUS
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
          playHit()
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

      {/* Weapon projectile (plasma / bazooka) */}
      <mesh ref={weaponProjMeshRef} visible={false}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial
          color="#00ccff"
          emissive="#0066ff"
          emissiveIntensity={2}
          roughness={0.1}
          metalness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight ref={weaponProjLightRef} visible={false} color="#00aaff" intensity={5} distance={10} decay={2} />

      {/* Banana meshes */}
      {Array.from({ length: MAX_BANANAS }, (_, i) => (
        <mesh key={`banana-slot-${i}`} ref={(m) => { bananaMeshRefs.current[i] = m }} visible={false}>
          <sphereGeometry args={[0.18, 6, 6]} />
          <meshStandardMaterial
            color="#eecc00"
            emissive="#ffaa00"
            emissiveIntensity={0}
            roughness={0.5}
            metalness={0.1}
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
          metalness={0.3}
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

      <ParticleSystem />

      {/* Script system */}
      {activePlayLevel && <ScriptEngine level={activePlayLevel} />}
      {activePlayLevel?.fogOfWar && <FogOfWar />}

      <ambientLight ref={ambientRef} intensity={0.25} color="#4488ff" />
      <directionalLight ref={dirLightRef} position={[5, 15, 5]} intensity={1.2} color="#ffffff" castShadow />
      <pointLight position={[0, 8, 0]} intensity={0.6} color="#2244aa" distance={40} />
    </>
  )
}
