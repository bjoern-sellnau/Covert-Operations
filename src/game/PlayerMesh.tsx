import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore } from './entityStore'
import { PLAYER_MAX_HEALTH } from './types'

interface Props {
  player2?: boolean
}

export function PlayerMesh({ player2 = false }: Props) {
  const bodyRef      = useRef<THREE.Mesh>(null)
  const barrel1Ref   = useRef<THREE.Mesh>(null)
  const barrel2Ref   = useRef<THREE.Mesh>(null)
  const healthBarRef = useRef<THREE.Mesh>(null)

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color:             player2 ? '#ff6600' : '#00aaff',
    emissive:          player2 ? '#aa2200' : '#0044aa',
    emissiveIntensity: 0.6,
    roughness: 0.3, metalness: 0.7,
  }), [player2])

  const barrelMat = useMemo(() => new THREE.MeshStandardMaterial({
    color:             player2 ? '#ffbb88' : '#88ccff',
    emissive:          player2 ? '#cc6600' : '#2266cc',
    emissiveIntensity: 0.8,
    roughness: 0.2, metalness: 0.9,
  }), [player2])

  useFrame((state) => {
    const es  = entityStore
    const now = state.clock.elapsedTime
    const p   = player2 ? es.player2 : es.player

    if (player2 && !es.player2Active) {
      if (bodyRef.current) bodyRef.current.visible = false
      if (barrel1Ref.current) barrel1Ref.current.visible = false
      if (barrel2Ref.current) barrel2Ref.current.visible = false
      if (healthBarRef.current) healthBarRef.current.parent!.visible = false
      return
    }
    if (healthBarRef.current?.parent) healthBarRef.current.parent.visible = true

    const invincible = now < p.invincibleUntil
    const visible    = !invincible || Math.floor(now * 12) % 2 === 0
    if (bodyRef.current)    bodyRef.current.visible    = visible
    if (barrel1Ref.current) barrel1Ref.current.visible = visible
    if (barrel2Ref.current) barrel2Ref.current.visible = visible && !player2 && es.isAkimbo

    if (healthBarRef.current) {
      const pct = Math.max(0, p.health / PLAYER_MAX_HEALTH)
      healthBarRef.current.scale.x    = pct
      healthBarRef.current.position.x = (pct - 1) * 0.5
      const mat = healthBarRef.current.material as THREE.MeshBasicMaterial
      if (pct > 0.5) mat.color.setHex(0x00ff44)
      else if (pct > 0.25) mat.color.setHex(0xffaa00)
      else mat.color.setHex(0xff2200)
    }

    if (p.health < 30) {
      const pulse = (Math.sin(now * 8) + 1) * 0.5
      bodyMat.emissiveIntensity = 0.4 + pulse * 0.8
    } else {
      bodyMat.emissiveIntensity = 0.6
    }

    if (p.shootCooldown > 0) {
      barrelMat.emissiveIntensity = 0.8 + Math.max(0, p.shootCooldown / 0.05) * 2
    }
  })

  return (
    <group>
      <mesh ref={bodyRef} material={bodyMat} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.35, 6]} />
      </mesh>

      <mesh ref={barrel1Ref} material={barrelMat} position={[-0.12, 0.05, -0.55]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.5]} />
      </mesh>

      {!player2 && (
        <mesh ref={barrel2Ref} material={barrelMat} position={[0.12, 0.05, -0.55]} castShadow>
          <boxGeometry args={[0.14, 0.14, 0.5]} />
        </mesh>
      )}

      {/* Health bar */}
      <group position={[0, 0.9, 0]}>
        <mesh>
          <planeGeometry args={[1, 0.12]} />
          <meshBasicMaterial color="#222222" side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={healthBarRef} position={[0, 0, 0.001]}>
          <planeGeometry args={[1, 0.1]} />
          <meshBasicMaterial color="#00ff44" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}
