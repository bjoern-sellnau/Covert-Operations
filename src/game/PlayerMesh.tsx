import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore } from './entityStore'
import { PLAYER_MAX_HEALTH } from './types'

const _bodyMat = new THREE.MeshStandardMaterial({
  color: '#00aaff', emissive: '#0044aa', emissiveIntensity: 0.6,
  roughness: 0.3, metalness: 0.7,
})

const _barrelMat = new THREE.MeshStandardMaterial({
  color: '#88ccff', emissive: '#2266cc', emissiveIntensity: 0.8,
  roughness: 0.2, metalness: 0.9,
})

export function PlayerMesh() {
  const bodyRef      = useRef<THREE.Mesh>(null)
  const barrel1Ref   = useRef<THREE.Mesh>(null)
  const barrel2Ref   = useRef<THREE.Mesh>(null)
  const healthBarRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const es  = entityStore
    const now = state.clock.elapsedTime

    const invincible = now < es.player.invincibleUntil
    const visible    = !invincible || Math.floor(now * 12) % 2 === 0
    if (bodyRef.current)    bodyRef.current.visible    = visible
    if (barrel1Ref.current) barrel1Ref.current.visible = visible
    if (barrel2Ref.current) barrel2Ref.current.visible = visible && es.isAkimbo

    if (healthBarRef.current) {
      const pct = Math.max(0, es.player.health / PLAYER_MAX_HEALTH)
      healthBarRef.current.scale.x    = pct
      healthBarRef.current.position.x = (pct - 1) * 0.5
      const mat = healthBarRef.current.material as THREE.MeshBasicMaterial
      if (pct > 0.5) mat.color.setHex(0x00ff44)
      else if (pct > 0.25) mat.color.setHex(0xffaa00)
      else mat.color.setHex(0xff2200)
    }

    if (es.player.health < 30) {
      const pulse = (Math.sin(now * 8) + 1) * 0.5
      _bodyMat.emissiveIntensity = 0.4 + pulse * 0.8
    } else {
      _bodyMat.emissiveIntensity = 0.6
    }

    if (es.player.shootCooldown > 0) {
      const flash = Math.max(0, es.player.shootCooldown / 0.05)
      _barrelMat.emissiveIntensity = 0.8 + flash * 2
    }
  })

  return (
    <group>
      <mesh ref={bodyRef} material={_bodyMat} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.35, 6]} />
      </mesh>

      {/* Primary barrel */}
      <mesh ref={barrel1Ref} material={_barrelMat} position={[-0.12, 0.05, -0.55]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.5]} />
      </mesh>

      {/* Second barrel — only shown when akimbo */}
      <mesh ref={barrel2Ref} material={_barrelMat} position={[0.12, 0.05, -0.55]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.5]} />
      </mesh>

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
