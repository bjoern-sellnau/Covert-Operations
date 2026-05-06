import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore } from './entityStore'

interface Props {
  id: string
}

const _bulletMatNormal = new THREE.MeshStandardMaterial({
  color: '#ffee00',
  emissive: '#ffcc00',
  emissiveIntensity: 3,
  roughness: 0,
  metalness: 0,
})

const _bulletMatEnergy = new THREE.MeshStandardMaterial({
  color: '#00eeff',
  emissive: '#0088ff',
  emissiveIntensity: 4,
  roughness: 0,
  metalness: 0,
  transparent: true,
  opacity: 0.9,
})

const _bulletMatFlak = new THREE.MeshStandardMaterial({
  color: '#dddddd',
  emissive: '#aaaacc',
  emissiveIntensity: 1.5,
  roughness: 0.3,
  metalness: 0.8,
})

export function BulletMesh({ id }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const bullet = entityStore.bullets.get(id)
    if (!bullet || !meshRef.current) return

    meshRef.current.position.set(bullet.position.x, 0.25, bullet.position.y)

    if (bullet.isEnergy) {
      meshRef.current.material = _bulletMatEnergy
    } else if (bullet.isFlak) {
      meshRef.current.material = _bulletMatFlak
    } else {
      meshRef.current.material = _bulletMatNormal
    }
  })

  return (
    <mesh ref={meshRef} material={_bulletMatNormal}>
      <sphereGeometry args={[0.12, 8, 8]} />
    </mesh>
  )
}
