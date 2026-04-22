import { useMemo } from 'react'
import * as THREE from 'three'
import { ARENA_HALF, WALL_THICKNESS } from './types'

const size = ARENA_HALF * 2
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
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]} receiveShadow castShadow>
      <boxGeometry args={[width, wallH, WALL_THICKNESS]} />
      <meshStandardMaterial
        color="#1a1a2e"
        emissive="#0a0a1a"
        emissiveIntensity={0.3}
        roughness={0.8}
        metalness={0.2}
      />
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
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#0d0d1a'
    ctx.fillRect(0, 0, 512, 512)

    const cellSize = 512 / (ARENA_HALF * 2)
    ctx.strokeStyle = '#1a1a33'
    ctx.lineWidth = 1

    for (let i = 0; i <= ARENA_HALF * 2; i++) {
      const p = i * cellSize
      ctx.beginPath()
      ctx.moveTo(p, 0)
      ctx.lineTo(p, 512)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, p)
      ctx.lineTo(512, p)
      ctx.stroke()
    }

    // Subtle center cross
    ctx.strokeStyle = '#222244'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(256, 0)
    ctx.lineTo(256, 512)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, 256)
    ctx.lineTo(512, 256)
    ctx.stroke()

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [])

  const wallY = wallH / 2

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial map={floorTexture} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Walls */}
      <Wall position={[0, wallY, -ARENA_HALF]} width={size + WALL_THICKNESS * 2} />
      <Wall position={[0, wallY, ARENA_HALF]} width={size + WALL_THICKNESS * 2} />
      <Wall position={[-ARENA_HALF, wallY, 0]} rotation={[0, Math.PI / 2, 0]} width={size} />
      <Wall position={[ARENA_HALF, wallY, 0]} rotation={[0, Math.PI / 2, 0]} width={size} />

      {/* Neon edge glows along floor level */}
      <EdgeGlow position={[0, 0.02, -ARENA_HALF + 0.5]} width={size} />
      <EdgeGlow position={[0, 0.02, ARENA_HALF - 0.5]} width={size} />
      <EdgeGlow
        position={[-ARENA_HALF + 0.5, 0.02, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={size}
      />
      <EdgeGlow
        position={[ARENA_HALF - 0.5, 0.02, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={size}
      />

      {/* Corner pillars */}
      {([-1, 1] as const).flatMap((sx) =>
        ([-1, 1] as const).map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            position={[sx * ARENA_HALF, wallH / 2, sz * ARENA_HALF]}
            castShadow
          >
            <boxGeometry args={[WALL_THICKNESS * 2, wallH + 0.2, WALL_THICKNESS * 2]} />
            <meshStandardMaterial color="#0a0a1a" roughness={0.7} metalness={0.4} />
          </mesh>
        )),
      )}
    </group>
  )
}
