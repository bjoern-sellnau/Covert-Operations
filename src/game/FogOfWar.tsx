import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore } from './entityStore'
import { ARENA_HALF } from './types'

const VERTEX = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAGMENT = /* glsl */`
varying vec2 vUv;
uniform vec2  uPlayerUV;   // 0..1 across the arena
uniform float uRevealR;    // reveal radius in UV space
uniform float uArenaHalf;  // world units, for aspect correction

void main() {
  // Arena is square, so UV maps 1:1 with world coordinates
  float dx = vUv.x - uPlayerUV.x;
  float dy = vUv.y - uPlayerUV.y;
  float dist = sqrt(dx * dx + dy * dy);

  // Soft edge
  float alpha = smoothstep(uRevealR, uRevealR * 1.35, dist);
  gl_FragColor = vec4(0.01, 0.01, 0.06, alpha * 0.88);
}
`

interface FogOfWarProps {
  revealRadius?: number  // world units
}

export function FogOfWar({ revealRadius = 8 }: FogOfWarProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const arenaSize = ARENA_HALF * 2
  const revealUV = revealRadius / arenaSize

  useFrame(() => {
    if (!matRef.current) return
    const p = entityStore.player.position
    // Convert world X/Z to UV (0..1): center of arena = (0.5, 0.5)
    const u = (p.x + ARENA_HALF) / arenaSize
    const v = (p.y + ARENA_HALF) / arenaSize   // player uses Vector2: y = world Z
    matRef.current.uniforms.uPlayerUV.value.set(u, v)
  })

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, 0.15, 0]}
      renderOrder={10}
    >
      <planeGeometry args={[arenaSize, arenaSize]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        transparent
        depthWrite={false}
        uniforms={{
          uPlayerUV:  { value: new THREE.Vector2(0.5, 0.5) },
          uRevealR:   { value: revealUV },
          uArenaHalf: { value: ARENA_HALF },
        }}
      />
    </mesh>
  )
}
