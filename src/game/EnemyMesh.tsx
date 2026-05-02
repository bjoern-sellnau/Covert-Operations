import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore } from './entityStore'
import { ENEMY_CONFIGS } from './types'
import { useSettingsStore } from '../store/settingsStore'

interface Props { id: string }

export function EnemyMesh({ id }: Props) {
  const groupRef    = useRef<THREE.Group>(null)
  const leftLegRef  = useRef<THREE.Mesh>(null)
  const rightLegRef = useRef<THREE.Mesh>(null)
  const leftArmRef  = useRef<THREE.Mesh>(null)
  const rightArmRef = useRef<THREE.Mesh>(null)
  const walkPhase   = useRef(0)
  const prevPos     = useRef({ x: 0, y: 0 })

  const enemy0 = entityStore.enemies.get(id)
  const cfg0   = enemy0 ? ENEMY_CONFIGS[enemy0.type] : ENEMY_CONFIGS.basic

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: cfg0.color, emissive: cfg0.emissive, emissiveIntensity: 0.5,
    roughness: 0.45, metalness: 0.3,
  }), [cfg0.color, cfg0.emissive])

  useFrame((state, delta) => {
    const enemy = entityStore.enemies.get(id)
    if (!enemy || !groupRef.current) return

    const cfg = ENEMY_CONFIGS[enemy.type]
    const now = state.clock.elapsedTime
    const dt  = Math.min(delta, 0.05)

    // Position
    groupRef.current.position.set(enemy.position.x, 0, enemy.position.y)

    // Face toward player
    const px = entityStore.player.position.x - enemy.position.x
    const pz = entityStore.player.position.y - enemy.position.y
    if (px !== 0 || pz !== 0) groupRef.current.rotation.y = Math.atan2(px, -pz)

    // Scale by enemy size × charScale setting
    const scale = (cfg.size / 0.45) * useSettingsStore.getState().charScale
    groupRef.current.scale.setScalar(scale)

    // Hit flash
    const timeSinceHit = now - enemy.hitTime
    if (timeSinceHit < 0.12) {
      bodyMat.color.setHex(0xffffff)
      bodyMat.emissiveIntensity = 2.5
    } else {
      bodyMat.color.set(cfg.color)
      bodyMat.emissiveIntensity = 0.5 + Math.sin(now * 3 + parseFloat(id.split('-')[1] ?? '0') * 1.3) * 0.1
    }

    // Detect movement for walk cycle
    const isMoving = Math.abs(enemy.position.x - prevPos.current.x) > 0.0005 ||
                     Math.abs(enemy.position.y - prevPos.current.y) > 0.0005
    prevPos.current.x = enemy.position.x
    prevPos.current.y = enemy.position.y

    const speed = enemy.type === 'fast' || enemy.type === 'berserker' ? 12 : 8
    if (isMoving) walkPhase.current += dt * speed
    const swing = Math.sin(walkPhase.current)

    if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing * 0.55
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.55
    if (leftArmRef.current)  leftArmRef.current.rotation.x  = 0.7 - swing * 0.45
    if (rightArmRef.current) rightArmRef.current.rotation.x = 0.7 + swing * 0.45
  })

  const enemy = entityStore.enemies.get(id)
  if (!enemy) return null

  const cfg      = ENEMY_CONFIGS[enemy.type]
  const isTank   = enemy.type === 'tank'
  const isJugg   = enemy.type === 'juggernaut'
  const isFast   = enemy.type === 'fast' || enemy.type === 'berserker'

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh material={bodyMat} position={[0, 0.44, 0]} castShadow>
        <sphereGeometry args={[isFast ? 0.18 : isJugg ? 0.28 : 0.22, 7, 5]} />
      </mesh>
      {/* Torso */}
      <mesh material={bodyMat} position={[0, 0.09, 0]} castShadow>
        <boxGeometry args={
          isJugg ? [0.50, 0.34, 0.36] :
          isTank ? [0.44, 0.30, 0.30] :
          isFast ? [0.28, 0.26, 0.20] :
                   [0.34, 0.28, 0.24]
        } />
      </mesh>
      {/* Left arm */}
      <mesh ref={leftArmRef} material={bodyMat} position={[-0.27, 0.16, -0.10]} rotation={[0.7, 0, 0.35]} castShadow>
        <boxGeometry args={[0.11, 0.11, 0.27]} />
      </mesh>
      {/* Right arm */}
      <mesh ref={rightArmRef} material={bodyMat} position={[0.27, 0.16, -0.10]} rotation={[0.7, 0, -0.35]} castShadow>
        <boxGeometry args={[0.11, 0.11, 0.27]} />
      </mesh>
      {/* Left leg */}
      <mesh ref={leftLegRef} material={bodyMat} position={[-0.09, -0.19, 0.02]} castShadow>
        <boxGeometry args={[0.12, 0.23, 0.14]} />
      </mesh>
      {/* Right leg */}
      <mesh ref={rightLegRef} material={bodyMat} position={[0.09, -0.19, 0.02]} castShadow>
        <boxGeometry args={[0.12, 0.23, 0.14]} />
      </mesh>

      {/* Health pips for multi-HP enemies */}
      {(isTank || isJugg) && (
        <group position={[0, cfg.size * 0.7 + 0.55, 0]}>
          {Array.from({ length: enemy.health }).map((_, i) => (
            <mesh key={i} position={[(i - (cfg.health - 1) / 2) * 0.30, 0, 0]}>
              <sphereGeometry args={[0.09, 6, 6]} />
              <meshBasicMaterial color={isJugg ? '#ffffff' : '#ff44ff'} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}
