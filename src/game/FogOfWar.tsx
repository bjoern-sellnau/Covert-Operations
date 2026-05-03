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
  arenaHalf?: number
  revealRadius?: number  // world units
}

export function FogOfWar({ arenaHalf = ARENA_HALF, revealRadius = 8 }: FogOfWarProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const arenaSize = arenaHalf * 2
  const revealUV = revealRadius / arenaSize

  useFrame(() => {
    if (!matRef.current) return
    const p = entityStore.player.position
    const u = (p.x + arenaHalf) / arenaSize
    const v = (p.y + arenaHalf) / arenaSize
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
          uArenaHalf: { value: arenaHalf },
        }}
      />
    </mesh>
  )
}
