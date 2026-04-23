import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore } from './entityStore'

const _dummy = new THREE.Object3D()
const _col    = new THREE.Color()

const GRAVITY = 9.8

// ── Materials ────────────────────────────────────────────────────────────────

const bloodMat = new THREE.MeshStandardMaterial({
  color: '#cc0000', emissive: '#440000', emissiveIntensity: 0.4,
  roughness: 0.8, metalness: 0.1,
})

const explosionMat = new THREE.MeshStandardMaterial({
  color: '#ff6600', emissive: '#ff2200', emissiveIntensity: 1.2,
  roughness: 0.5, metalness: 0.2,
})

const sparkMat = new THREE.MeshStandardMaterial({
  color: '#ffee44', emissive: '#ffcc00', emissiveIntensity: 1.5,
  roughness: 0.2, metalness: 0.5,
})

const decalMat = new THREE.MeshBasicMaterial({
  color: '#440000', transparent: true, opacity: 0.85,
  side: THREE.DoubleSide, depthWrite: false,
})

// ── Geometries ───────────────────────────────────────────────────────────────

const bloodGeo     = new THREE.SphereGeometry(0.08, 4, 4)
const explosionGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14)
const sparkGeo     = new THREE.SphereGeometry(0.04, 3, 3)
const decalGeo     = new THREE.CircleGeometry(0.5, 7)

// ── Component ────────────────────────────────────────────────────────────────

export function ParticleSystem() {
  const bloodRef     = useRef<THREE.InstancedMesh>(null)
  const explosionRef = useRef<THREE.InstancedMesh>(null)
  const sparkRef     = useRef<THREE.InstancedMesh>(null)
  const decalRef     = useRef<THREE.InstancedMesh>(null)

  const bloodCount     = 120
  const explosionCount = 80
  const sparkCount     = 40
  const decalCount     = 60

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const { particles, decals } = entityStore

    let bi = 0, ei = 0, si = 0

    for (const p of particles) {
      if (!p.active) continue

      // Integrate
      p.vy -= GRAVITY * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      p.life -= dt

      if (p.life <= 0 || p.y < -0.5) {
        p.active = false
        continue
      }

      const lifePct = p.life / p.maxLife

      _dummy.position.set(p.x, Math.max(0, p.y), p.z)
      _dummy.scale.setScalar(p.scale * lifePct)
      _dummy.updateMatrix()

      if (p.type === 'blood' && bi < bloodCount) {
        bloodRef.current?.setMatrixAt(bi, _dummy.matrix)
        bi++
      } else if (p.type === 'explosion' && ei < explosionCount) {
        explosionRef.current?.setMatrixAt(ei, _dummy.matrix)
        ei++
      } else if (p.type === 'spark' && si < sparkCount) {
        sparkRef.current?.setMatrixAt(si, _dummy.matrix)
        si++
      }
    }

    // Hide unused instances
    _dummy.scale.setScalar(0)
    _dummy.updateMatrix()
    for (let i = bi; i < bloodCount; i++) bloodRef.current?.setMatrixAt(i, _dummy.matrix)
    for (let i = ei; i < explosionCount; i++) explosionRef.current?.setMatrixAt(i, _dummy.matrix)
    for (let i = si; i < sparkCount; i++) sparkRef.current?.setMatrixAt(i, _dummy.matrix)

    if (bloodRef.current)     bloodRef.current.instanceMatrix.needsUpdate     = true
    if (explosionRef.current) explosionRef.current.instanceMatrix.needsUpdate = true
    if (sparkRef.current)     sparkRef.current.instanceMatrix.needsUpdate     = true

    // ── Decals ────────────────────────────────────────────────────────────────
    let di = 0
    for (const d of decals) {
      if (!d.active || di >= decalCount) continue
      d.age += dt
      if (d.age >= d.maxAge) { d.active = false; continue }

      const fade = 1 - d.age / d.maxAge
      _dummy.position.set(d.x, 0.01, d.z)
      _dummy.rotation.set(-Math.PI / 2, 0, d.rotY)
      _dummy.scale.setScalar(d.size * Math.min(1, d.age * 4))
      _dummy.updateMatrix()
      decalRef.current?.setMatrixAt(di, _dummy.matrix)
      // Fade opacity via color (approximate with scale trick)
      _col.setRGB(fade * 0.27, 0, 0)
      decalRef.current?.setColorAt(di, _col)
      di++
    }
    _dummy.scale.setScalar(0)
    _dummy.updateMatrix()
    for (let i = di; i < decalCount; i++) {
      decalRef.current?.setMatrixAt(i, _dummy.matrix)
    }
    if (decalRef.current) {
      decalRef.current.instanceMatrix.needsUpdate = true
      if (decalRef.current.instanceColor) decalRef.current.instanceColor.needsUpdate = true
    }
  })

  return (
    <>
      <instancedMesh ref={bloodRef}     args={[bloodGeo,     bloodMat,     bloodCount]}     />
      <instancedMesh ref={explosionRef} args={[explosionGeo, explosionMat, explosionCount]} />
      <instancedMesh ref={sparkRef}     args={[sparkGeo,     sparkMat,     sparkCount]}     />
      <instancedMesh ref={decalRef}     args={[decalGeo,     decalMat,     decalCount]}     />
    </>
  )
}
