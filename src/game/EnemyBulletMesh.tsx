import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore } from './entityStore'

interface Props {
  id: string
}

const _mat = new THREE.MeshStandardMaterial({
  color: '#ff2200',
  emissive: '#ff4400',
  emissiveIntensity: 4,
  roughness: 0,
  metalness: 0,
})

export function EnemyBulletMesh({ id }: Props) {
  const meshRef  = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const b = entityStore.enemyBullets.get(id)
    if (!b || !meshRef.current) return
    meshRef.current.position.set(b.position.x, 0.25, b.position.y)
    if (lightRef.current) {
      lightRef.current.position.set(b.position.x, 0.5, b.position.y)
    }
  })

  return (
    <>
      <mesh ref={meshRef} material={_mat}>
        <sphereGeometry args={[0.10, 6, 6]} />
      </mesh>
      <pointLight ref={lightRef} color="#ff3300" intensity={2} distance={2.5} />
    </>
  )
}
