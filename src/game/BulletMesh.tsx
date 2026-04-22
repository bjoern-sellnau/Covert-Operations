import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore } from './entityStore'
import { BULLET_LIFETIME } from './types'

interface Props {
  id: string
}

const _bulletMat = new THREE.MeshStandardMaterial({
  color: '#ffee00',
  emissive: '#ffcc00',
  emissiveIntensity: 3,
  roughness: 0,
  metalness: 0,
})

export function BulletMesh({ id }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const bullet = entityStore.bullets.get(id)
    if (!bullet || !meshRef.current) return

    meshRef.current.position.set(bullet.position.x, 0.25, bullet.position.y)

    if (lightRef.current) {
      lightRef.current.position.set(bullet.position.x, 0.5, bullet.position.y)
      // Fade light as bullet ages
      const agePct = bullet.lifetime / BULLET_LIFETIME
      lightRef.current.intensity = agePct * 2
    }
  })

  return (
    <>
      <mesh ref={meshRef} material={_bulletMat}>
        <sphereGeometry args={[0.12, 8, 8]} />
      </mesh>
      <pointLight ref={lightRef} color="#ffcc00" intensity={2} distance={3} />
    </>
  )
}
