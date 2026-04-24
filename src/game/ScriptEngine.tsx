import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore, spawnParticles } from './entityStore'
import { useGameStore } from '../store/gameStore'
import { useEditorStore } from '../editor/editorStore'
import type { Level } from '../editor/editorStore'
import type { ScriptAction, DoorEntity, EmitterEntity, PortalEntity } from '../editor/scriptTypes'
import { ENEMY_CONFIGS } from './types'

// ── Runtime state (mutable, read by collision system) ────────────────────────

interface DoorRuntime {
  entity: DoorEntity
  isOpen: boolean
  animT: number   // 0 = fully closed, 1 = fully open
}

interface CameraAnim {
  nodeX: number; nodeZ: number; camY: number
  lookX: number; lookY: number; lookZ: number
  travelDuration: number; holdDuration: number
  phase: 'travel_out' | 'hold' | 'travel_back'
  t: number
  origPos: THREE.Vector3
  origTarget: THREE.Vector3
}

export const scriptRuntime = {
  doorRuntimes:   new Map<string, DoorRuntime>(),
  collectedKeys:  new Set<string>(),
  firedTriggers:  new Set<string>(),
  emitterTimers:  new Map<string, number>(),
  activeEmitters: new Set<string>(),
  cameraAnim:     null as CameraAnim | null,
  pendingActions: [] as ScriptAction[],
  level:          null as Level | null,
  initialized:    false,
}

export function resetScriptRuntime() {
  scriptRuntime.doorRuntimes.clear()
  scriptRuntime.collectedKeys.clear()
  scriptRuntime.firedTriggers.clear()
  scriptRuntime.emitterTimers.clear()
  scriptRuntime.activeEmitters.clear()
  scriptRuntime.cameraAnim = null
  scriptRuntime.pendingActions = []
  scriptRuntime.level = null
  scriptRuntime.initialized = false
}

function initFromLevel(level: Level) {
  resetScriptRuntime()
  scriptRuntime.level = level
  for (const entity of level.scriptEntities) {
    if (entity.type === 'door') {
      scriptRuntime.doorRuntimes.set(entity.id, {
        entity,
        isOpen: entity.startOpen,
        animT: entity.startOpen ? 1 : 0,
      })
    }
    if (entity.type === 'emitter') {
      scriptRuntime.emitterTimers.set(entity.id, 0)
      if (entity.startActive) scriptRuntime.activeEmitters.add(entity.id)
    }
  }
  scriptRuntime.initialized = true
}

/** Returns the current world-space half-extents for a closed door (for collision). */
export function getClosedDoorColliders(): Array<{ x: number; z: number; hw: number; hd: number; angle: number }> {
  const result: Array<{ x: number; z: number; hw: number; hd: number; angle: number }> = []
  for (const dr of scriptRuntime.doorRuntimes.values()) {
    if (dr.animT < 0.5) {
      result.push({ x: dr.entity.x, z: dr.entity.z, hw: dr.entity.w / 2, hd: 0.15, angle: dr.entity.angle })
    }
  }
  return result
}

function executePendingActions(
  camera: THREE.Camera,
  setWaveMessage: (m: string) => void,
  setEnemyIds: (ids: string[]) => void,
  currentEnemyIds: string[],
) {
  const actions = scriptRuntime.pendingActions.splice(0)
  for (const action of actions) {
    switch (action.type) {
      case 'open_door': {
        const dr = scriptRuntime.doorRuntimes.get(action.targetId)
        if (dr) dr.isOpen = true
        break
      }
      case 'close_door': {
        const dr = scriptRuntime.doorRuntimes.get(action.targetId)
        if (dr) dr.isOpen = false
        break
      }
      case 'show_message': {
        setWaveMessage(action.text)
        setTimeout(() => setWaveMessage(''), action.duration * 1000)
        break
      }
      case 'activate_emitter':
        scriptRuntime.activeEmitters.add(action.targetId)
        break
      case 'deactivate_emitter':
        scriptRuntime.activeEmitters.delete(action.targetId)
        break
      case 'camera_pan': {
        const level = scriptRuntime.level
        if (!level) break
        const node = level.scriptEntities.find((e) => e.id === action.targetId && e.type === 'camera_node')
        if (!node || node.type !== 'camera_node') break
        scriptRuntime.cameraAnim = {
          nodeX: node.x, nodeZ: node.z, camY: node.camY,
          lookX: node.lookX, lookY: node.lookY, lookZ: node.lookZ,
          travelDuration: node.travelDuration, holdDuration: node.holdDuration,
          phase: 'travel_out', t: 0,
          origPos: camera.position.clone(),
          origTarget: new THREE.Vector3(0, 0, 0), // default look target
        }
        break
      }
      case 'spawn_enemies': {
        const newIds: string[] = []
        for (let i = 0; i < action.count; i++) {
          const id = `enemy-${++entityStore.enemyIdCounter}`
          const angle = Math.random() * Math.PI * 2
          const dist = 18 + Math.random() * 4
          entityStore.enemies.set(id, {
            id,
            position: new THREE.Vector2(Math.cos(angle) * dist, Math.sin(angle) * dist),
            health: ENEMY_CONFIGS[action.enemyType].health,
            type: action.enemyType,
            hitTime: -999,
            lastDamageTime: -999,
            aiTimer: 0,
            aiState: Math.random() > 0.5 ? 0 : 1,
          })
          newIds.push(id)
        }
        setEnemyIds([...currentEnemyIds, ...newIds])
        break
      }
      case 'load_level': {
        const levels = useEditorStore.getState().levels
        const target = levels.find((l) => l.id === action.levelId)
        if (target) useEditorStore.getState().setActivePlayLevel(target)
        break
      }
    }
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function ScriptEngine({ level }: { level: Level }) {
  const { camera } = useThree()
  const setWaveMessage = useGameStore((s) => s.setWaveMessage)
  const setEnemyIds    = useGameStore((s) => s.setEnemyIds)
  const enemyIds       = useGameStore((s) => s.enemyIds)
  const enemyIdsRef    = useRef(enemyIds)
  useEffect(() => { enemyIdsRef.current = enemyIds }, [enemyIds])

  const levelRef = useRef(level)

  // Init / reinit when level changes
  useEffect(() => {
    levelRef.current = level
    initFromLevel(level)
  }, [level])

  const emitterAccum = useRef<Map<string, number>>(new Map())

  useFrame((_, delta) => {
    const lvl = levelRef.current
    if (!scriptRuntime.initialized || !lvl) return

    const player = entityStore.player
    const px = player.position.x
    const pz = player.position.y  // player uses Vector2, y = world Z

    // ── Tick door animations ───────────────────────────────────────────────
    for (const dr of scriptRuntime.doorRuntimes.values()) {
      const target = dr.isOpen ? 1 : 0
      if (Math.abs(dr.animT - target) > 0.001) {
        dr.animT += (target - dr.animT) * Math.min(1, delta * 4)
        if (Math.abs(dr.animT - target) < 0.001) dr.animT = target
      }
    }

    // ── Check trigger zones ────────────────────────────────────────────────
    for (const entity of lvl.scriptEntities) {
      if (entity.type !== 'trigger') continue
      if (entity.oneShot && scriptRuntime.firedTriggers.has(entity.id)) continue

      const hw = entity.w / 2
      const hd = entity.d / 2
      const inside = px >= entity.x - hw && px <= entity.x + hw &&
                     pz >= entity.z - hd && pz <= entity.z + hd

      if (inside) {
        scriptRuntime.firedTriggers.add(entity.id)
        for (const action of entity.actions) {
          scriptRuntime.pendingActions.push(action)
        }
      }
    }

    // ── Key pickups ────────────────────────────────────────────────────────
    for (const entity of lvl.scriptEntities) {
      if (entity.type !== 'key') continue
      if (scriptRuntime.collectedKeys.has(entity.id)) continue

      const dx = px - entity.x
      const dz = pz - entity.z
      if (Math.sqrt(dx * dx + dz * dz) < 1.2) {
        scriptRuntime.collectedKeys.add(entity.id)
        setWaveMessage(`${entity.label} aufgenommen!`)
        setTimeout(() => setWaveMessage(''), 2000)
      }
    }

    // ── Death zones ────────────────────────────────────────────────────────
    for (const entity of lvl.scriptEntities) {
      if (entity.type !== 'death_zone') continue

      const hw = entity.w / 2
      const hd = entity.d / 2
      const inside = px >= entity.x - hw && px <= entity.x + hw &&
                     pz >= entity.z - hd && pz <= entity.z + hd

      if (inside) {
        if (entity.instantKill) {
          player.health = 0
        } else {
          player.health = Math.max(0, player.health - entity.damagePerSec * delta)
        }
      }
    }

    // ── Particle emitters ──────────────────────────────────────────────────
    for (const entity of lvl.scriptEntities) {
      if (entity.type !== 'emitter') continue
      if (!scriptRuntime.activeEmitters.has(entity.id)) continue

      const e = entity as EmitterEntity
      let acc = emitterAccum.current.get(entity.id) ?? 0
      acc += delta
      const interval = 1 / e.rate
      while (acc >= interval) {
        acc -= interval
        const count = e.particleType === 'explosion' ? 3 : 1
        spawnParticles(e.x, e.z, e.particleType, count)
      }
      emitterAccum.current.set(entity.id, acc)
    }

    // ── Portal detection ───────────────────────────────────────────────────
    for (const entity of lvl.scriptEntities) {
      if (entity.type !== 'portal') continue
      const pe = entity as PortalEntity

      const hw = pe.w / 2
      const hd = pe.d / 2
      const inside = px >= pe.x - hw && px <= pe.x + hw &&
                     pz >= pe.z - hd && pz <= pe.z + hd

      if (inside && pe.targetLevelId) {
        const levels = useEditorStore.getState().levels
        const target = levels.find((l) => l.id === pe.targetLevelId)
        if (target) {
          useEditorStore.getState().setActivePlayLevel(target)
          initFromLevel(target)
          levelRef.current = target
        }
        break
      }
    }

    // ── Execute queued actions ─────────────────────────────────────────────
    if (scriptRuntime.pendingActions.length > 0) {
      executePendingActions(camera, setWaveMessage, setEnemyIds, enemyIdsRef.current)
    }

    // ── Camera animation ───────────────────────────────────────────────────
    const cam = scriptRuntime.cameraAnim
    if (cam) {
      cam.t += delta
      const progress = Math.min(1, cam.t / cam.travelDuration)
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress

      if (cam.phase === 'travel_out') {
        camera.position.lerpVectors(cam.origPos, new THREE.Vector3(cam.nodeX, cam.camY, cam.nodeZ), ease)
        camera.lookAt(cam.lookX, cam.lookY, cam.lookZ)
        if (progress >= 1) { cam.phase = 'hold'; cam.t = 0 }

      } else if (cam.phase === 'hold') {
        camera.position.set(cam.nodeX, cam.camY, cam.nodeZ)
        camera.lookAt(cam.lookX, cam.lookY, cam.lookZ)
        if (cam.t >= cam.holdDuration) { cam.phase = 'travel_back'; cam.t = 0 }

      } else if (cam.phase === 'travel_back') {
        camera.position.lerpVectors(new THREE.Vector3(cam.nodeX, cam.camY, cam.nodeZ), cam.origPos, ease)
        if (progress >= 1) { scriptRuntime.cameraAnim = null }
      }
    }
  })

  // ── Door mesh rendering ────────────────────────────────────────────────────
  return (
    <>
      {level.scriptEntities.filter((e) => e.type === 'door').map((entity) => {
        const dr = scriptRuntime.doorRuntimes.get(entity.id)
        const door = entity as DoorEntity

        const openAngle   = door.angle + Math.PI / 2
        const closedAngle = door.angle
        const currentAngle = closedAngle + (openAngle - closedAngle) * (dr?.animT ?? 0)

        // Pivot from one end of the door panel
        const pivotOffX = Math.cos(door.angle) * (door.w / 2)
        const pivotOffZ = Math.sin(door.angle) * (door.w / 2)

        return (
          <group key={entity.id} position={[door.x - pivotOffX, 0, door.z - pivotOffZ]}>
            <mesh
              position={[pivotOffX, 1.1, pivotOffZ]}
              rotation-y={currentAngle}
              scale={[door.w, 2.2, 0.18]}
            >
              <boxGeometry />
              <meshStandardMaterial color="#ff8800" emissive="#441100" emissiveIntensity={0.3} roughness={0.6} metalness={0.4} />
            </mesh>
          </group>
        )
      })}

      {/* Key collectibles */}
      {level.scriptEntities.filter((e) => e.type === 'key').map((entity) => {
        if (scriptRuntime.collectedKeys.has(entity.id)) return null
        const key = entity
        const color = 'color' in key ? (key as { color: string }).color : '#ffcc00'
        return (
          <mesh key={entity.id} position={[entity.x, 0.6, entity.z]}>
            <boxGeometry args={[0.3, 0.15, 0.5]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.3} metalness={0.8} />
          </mesh>
        )
      })}

      {/* Portal visuals */}
      {level.scriptEntities.filter((e) => e.type === 'portal').map((entity) => {
        const pe = entity as PortalEntity
        return (
          <mesh key={entity.id} position={[pe.x, 1.5, pe.z]} scale={[pe.w, 3, pe.d]}>
            <boxGeometry />
            <meshStandardMaterial color={pe.color} emissive={pe.color} emissiveIntensity={0.8}
              transparent opacity={0.5} roughness={0.1} />
          </mesh>
        )
      })}
    </>
  )
}
