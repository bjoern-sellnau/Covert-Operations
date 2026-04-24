import { useRef } from 'react'
import * as THREE from 'three'
import type { Level, LevelObject } from '../editor/editorStore'
import { OBJECT_TYPE_CFGS } from '../editor/editorStore'
import { getClosedDoorColliders } from './ScriptEngine'

// ── Shared geometry ──────────────────────────────────────────────────────────
const _boxGeo = new THREE.BoxGeometry(1, 1, 1)
const _cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16)

function GameLevelObject({ obj }: { obj: LevelObject }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const cfg = OBJECT_TYPE_CFGS[obj.type]
  if (cfg.isSpawn) return null  // spawns are editor-only markers

  return (
    <mesh
      ref={meshRef}
      position={[obj.x, cfg.height / 2, obj.z]}
      rotation-y={obj.rotY}
      scale={[obj.sx, cfg.height, obj.sz]}
      geometry={cfg.isCylinder ? _cylGeo : _boxGeo}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={cfg.color}
        emissive={cfg.emissive}
        emissiveIntensity={0.35}
        roughness={0.65}
        metalness={0.3}
      />
    </mesh>
  )
}

export function GameLevelObjects({ level }: { level: Level }) {
  return (
    <>
      {level.objects.map((obj) => (
        <GameLevelObject key={obj.id} obj={obj} />
      ))}
    </>
  )
}

// ── Collision helpers (used by GameScene) ────────────────────────────────────

function circleAABB(
  cx: number, cz: number, cr: number,
  ox: number, oz: number, hw: number, hd: number,
): { pen: boolean; nx: number; nz: number; depth: number } {
  const nearX = Math.max(ox - hw, Math.min(cx, ox + hw))
  const nearZ = Math.max(oz - hd, Math.min(cz, oz + hd))
  const dx = cx - nearX
  const dz = cz - nearZ
  const dist = Math.sqrt(dx * dx + dz * dz)
  if (dist < cr) {
    const depth = cr - dist
    const nx = dist > 0.0001 ? dx / dist : 1
    const nz = dist > 0.0001 ? dz / dist : 0
    return { pen: true, nx, nz, depth }
  }
  return { pen: false, nx: 0, nz: 0, depth: 0 }
}

function circleCircle(
  cx: number, cz: number, cr: number,
  ox: number, oz: number, or_: number,
): { pen: boolean; nx: number; nz: number; depth: number } {
  const dx = cx - ox
  const dz = cz - oz
  const dist = Math.sqrt(dx * dx + dz * dz)
  const minDist = cr + or_
  if (dist < minDist) {
    const depth = minDist - dist
    const nx = dist > 0.0001 ? dx / dist : 1
    const nz = dist > 0.0001 ? dz / dist : 0
    return { pen: true, nx, nz, depth }
  }
  return { pen: false, nx: 0, nz: 0, depth: 0 }
}

/** Push a circle out of all level objects + closed script doors. Returns the new position. */
export function resolveCircleVsLevel(
  cx: number, cz: number, radius: number,
  level: Level,
): { x: number; z: number } {
  let rx = cx, rz = cz
  for (const obj of level.objects) {
    const cfg = OBJECT_TYPE_CFGS[obj.type]
    if (cfg.isSpawn) continue

    let res: { pen: boolean; nx: number; nz: number; depth: number }
    if (cfg.collisionRadius > 0) {
      res = circleCircle(rx, rz, radius, obj.x, obj.z, cfg.collisionRadius * Math.max(obj.sx, obj.sz))
    } else {
      res = circleAABB(rx, rz, radius, obj.x, obj.z, (obj.sx * 1) / 2, (obj.sz * 1) / 2)
    }
    if (res.pen) {
      rx += res.nx * res.depth
      rz += res.nz * res.depth
    }
  }
  // Closed script doors
  for (const door of getClosedDoorColliders()) {
    const res = circleAABB(rx, rz, radius, door.x, door.z, door.hw, door.hd)
    if (res.pen) {
      rx += res.nx * res.depth
      rz += res.nz * res.depth
    }
  }
  return { x: rx, z: rz }
}

/** Returns true if a point (with small radius) intersects any solid level object or closed door. */
export function pointIntersectsLevel(
  px: number, pz: number, pr: number,
  level: Level,
): boolean {
  for (const obj of level.objects) {
    const cfg = OBJECT_TYPE_CFGS[obj.type]
    if (cfg.isSpawn) continue
    let pen: boolean
    if (cfg.collisionRadius > 0) {
      pen = circleCircle(px, pz, pr, obj.x, obj.z, cfg.collisionRadius * Math.max(obj.sx, obj.sz)).pen
    } else {
      pen = circleAABB(px, pz, pr, obj.x, obj.z, obj.sx / 2, obj.sz / 2).pen
    }
    if (pen) return true
  }
  for (const door of getClosedDoorColliders()) {
    if (circleAABB(px, pz, pr, door.x, door.z, door.hw, door.hd).pen) return true
  }
  return false
}
