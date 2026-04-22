import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore } from './entityStore'
import { ENEMY_CONFIGS } from './types'

interface Props {
  id: string
}

export function EnemyMesh({ id }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((state) => {
    const enemy = entityStore.enemies.get(id)
    if (!enemy || !groupRef.current || !matRef.current) return

    groupRef.current.position.set(enemy.position.x, 0, enemy.position.y)

    // Rotate continuously
    groupRef.current.rotation.y = state.clock.elapsedTime * 1.5

    // Hit flash
    const timeSinceHit = state.clock.elapsedTime - enemy.hitTime
    if (timeSinceHit < 0.12) {
      matRef.current.color.setHex(0xffffff)
      matRef.current.emissiveIntensity = 2.0
    } else {
      const cfg = ENEMY_CONFIGS[enemy.type]
      matRef.current.color.set(cfg.color)
      matRef.current.emissiveIntensity = 0.5
    }

    // Scale pulse
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3 + parseFloat(id.split('-')[1]) * 1.3) * 0.04
    groupRef.current.scale.setScalar(pulse)
  })

  const enemy = entityStore.enemies.get(id)
  if (!enemy) return null

  const cfg = ENEMY_CONFIGS[enemy.type]

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[cfg.size, cfg.size * 0.9, cfg.size * 0.8, cfg.segments]} />
        <meshStandardMaterial
          ref={matRef}
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={0.5}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* Health indicator pips for tanks */}
      {enemy.type === 'tank' && (
        <group position={[0, cfg.size * 0.5 + 0.3, 0]}>
          {Array.from({ length: enemy.health }).map((_, i) => (
            <mesh key={i} position={[(i - (ENEMY_CONFIGS.tank.health - 1) / 2) * 0.28, 0, 0]}>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshBasicMaterial color="#ff44ff" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}
