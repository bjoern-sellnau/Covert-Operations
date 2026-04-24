import { useMemo } from 'react'
import * as THREE from 'three'
import { ARENA_HALF, WALL_THICKNESS } from './types'
import { getTextures, cloneForObject } from './textures'

const size  = ARENA_HALF * 2
const wallH = 2.5

function Wall({
  position,
  rotation,
  width,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  width: number
}) {
  const material = useMemo(() => {
    const tex = cloneForObject(getTextures().arenaWall, width, wallH, 2)
    return new THREE.MeshStandardMaterial({
      map:              tex,
      color:            new THREE.Color('#1e2040'),
      emissive:         new THREE.Color('#080814'),
      emissiveIntensity: 0.25,
      roughness:        0.85,
      metalness:        0.15,
    })
  }, [width])

  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]} receiveShadow castShadow material={material}>
      <boxGeometry args={[width, wallH, WALL_THICKNESS]} />
    </mesh>
  )
}

function EdgeGlow({
  position,
  rotation,
  width,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  width: number
}) {
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]}>
      <boxGeometry args={[width, 0.05, 0.05]} />
      <meshBasicMaterial color="#00aaff" />
    </mesh>
  )
}

export function Arena() {
  const floorMat = useMemo(() => {
    const tex = getTextures().floor.clone()
    tex.needsUpdate = true
    // floor covers `size x size` world units; tile every 2 world units
    tex.repeat.set(size / 2, size / 2)
    return new THREE.MeshStandardMaterial({
      map:      tex,
      roughness: 0.88,
      metalness: 0.08,
      color:    new THREE.Color('#ccd0ff'),  // slight blue tint
    })
  }, [])

  const wallY = wallH / 2

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorMat}>
        <planeGeometry args={[size, size]} />
      </mesh>

      {/* Walls */}
      <Wall position={[0, wallY, -ARENA_HALF]} width={size + WALL_THICKNESS * 2} />
      <Wall position={[0, wallY,  ARENA_HALF]} width={size + WALL_THICKNESS * 2} />
      <Wall position={[-ARENA_HALF, wallY, 0]} rotation={[0, Math.PI / 2, 0]} width={size} />
      <Wall position={[ ARENA_HALF, wallY, 0]} rotation={[0, Math.PI / 2, 0]} width={size} />

      {/* Neon edge glows */}
      <EdgeGlow position={[0, 0.02, -ARENA_HALF + 0.5]} width={size} />
      <EdgeGlow position={[0, 0.02,  ARENA_HALF - 0.5]} width={size} />
      <EdgeGlow position={[-ARENA_HALF + 0.5, 0.02, 0]} rotation={[0, Math.PI / 2, 0]} width={size} />
      <EdgeGlow position={[ ARENA_HALF - 0.5, 0.02, 0]} rotation={[0, Math.PI / 2, 0]} width={size} />

      {/* Corner pillars */}
      {([-1, 1] as const).flatMap((sx) =>
        ([-1, 1] as const).map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * ARENA_HALF, wallH / 2, sz * ARENA_HALF]} castShadow>
            <boxGeometry args={[WALL_THICKNESS * 2, wallH + 0.2, WALL_THICKNESS * 2]} />
            <meshStandardMaterial color="#080816" roughness={0.7} metalness={0.4} />
          </mesh>
        )),
      )}
    </group>
  )
}
