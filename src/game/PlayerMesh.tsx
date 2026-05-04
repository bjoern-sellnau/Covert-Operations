import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore } from './entityStore'
import { PLAYER_MAX_HEALTH } from './types'
import { SKIN_CONFIGS } from './skins'
import { useSettingsStore } from '../store/settingsStore'

interface Props { player2?: boolean }

export function PlayerMesh({ player2 = false }: Props) {
  const innerRef        = useRef<THREE.Group>(null)
  const healthBarRef    = useRef<THREE.Mesh>(null)
  const leftArmRef      = useRef<THREE.Mesh>(null)
  const rightArmRef     = useRef<THREE.Mesh>(null)
  const leftLegRef      = useRef<THREE.Mesh>(null)
  const rightLegRef     = useRef<THREE.Mesh>(null)
  const akimboWeaponRef = useRef<THREE.Mesh>(null)
  const walkPhase       = useRef(0)
  const prevPos         = useRef({ x: 0, y: 0 })

  const playerSkin  = useSettingsStore((s) => s.playerSkin)
  const isLowQuality = useSettingsStore((s) => s.graphicsQuality === 'low')
  const sc          = player2 ? null : SKIN_CONFIGS[playerSkin]

  const skinMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: sc?.skin ?? '#d4956a', roughness: 0.7, metalness: 0.0 }), [sc?.skin])
  const uniformMat = useMemo(() => new THREE.MeshStandardMaterial({
    color:             player2 ? '#cc3300' : (sc?.uniform ?? '#1a3a6e'),
    emissive:          player2 ? '#aa2200' : (sc?.uniformEmissive ?? '#001144'),
    emissiveIntensity: player2 ? 0.3       : (sc?.uniformEmissiveIntensity ?? 0.3),
    roughness: 0.55, metalness: isLowQuality ? 0 : (player2 ? 0.2 : (sc?.metalness ?? 0.2)),
  }), [player2, sc?.uniform, sc?.uniformEmissive, sc?.uniformEmissiveIntensity, sc?.metalness, isLowQuality])
  const helmetMat  = useMemo(() => new THREE.MeshStandardMaterial({
    color:             player2 ? '#ff6600' : (sc?.helmet ?? '#00aaff'),
    emissive:          player2 ? '#ff6600' : (sc?.helmetEmissive ?? '#00aaff'),
    emissiveIntensity: player2 ? 0.55      : (sc?.helmetEmissiveIntensity ?? 0.55),
    roughness: 0.3, metalness: isLowQuality ? 0 : (player2 ? 0.7 : (sc?.metalness ?? 0.7)),
  }), [player2, sc?.helmet, sc?.helmetEmissive, sc?.helmetEmissiveIntensity, sc?.metalness, isLowQuality])
  const pantsMat   = useMemo(() => new THREE.MeshStandardMaterial({
    color: player2 ? '#7a1a00' : (sc?.pants ?? '#0d1f3c'), roughness: 0.8, metalness: 0.1,
  }), [player2, sc?.pants])
  const weaponMat  = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a1a', emissive: '#111111', emissiveIntensity: 0.2, roughness: 0.2,
    metalness: isLowQuality ? 0 : 0.9,
  }), [isLowQuality])

  useFrame((state, delta) => {
    const es  = entityStore
    const now = state.clock.elapsedTime
    const dt  = Math.min(delta, 0.05)
    const p   = player2 ? es.player2 : es.player

    if (player2 && !es.player2Active) {
      if (innerRef.current?.parent) innerRef.current.parent.visible = false
      return
    }
    if (innerRef.current?.parent) innerRef.current.parent.visible = true

    const invincible = now < p.invincibleUntil
    const visible    = !invincible || Math.floor(now * 12) % 2 === 0
    if (innerRef.current) innerRef.current.visible = visible
    if (akimboWeaponRef.current) akimboWeaponRef.current.visible = !player2 && es.isAkimbo

    // Health bar
    if (healthBarRef.current) {
      const pct = Math.max(0, p.health / PLAYER_MAX_HEALTH)
      healthBarRef.current.scale.x    = pct
      healthBarRef.current.position.x = (pct - 1) * 0.5
      const mat = healthBarRef.current.material as THREE.MeshBasicMaterial
      if (pct > 0.5) mat.color.setHex(0x00ff44)
      else if (pct > 0.25) mat.color.setHex(0xffaa00)
      else mat.color.setHex(0xff2200)
    }

    // Detect movement
    const isMoving = Math.abs(p.position.x - prevPos.current.x) > 0.0005 ||
                     Math.abs(p.position.y - prevPos.current.y) > 0.0005
    prevPos.current.x = p.position.x
    prevPos.current.y = p.position.y

    if (!player2 && innerRef.current) {
      if (es.maneuver === 'dive') {
        // Dive roll: spin body + spread limbs
        innerRef.current.rotation.z = now * Math.PI * 10
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = 0.2
          leftArmRef.current.rotation.z = Math.PI * 0.55
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.x = 0.2
          rightArmRef.current.rotation.z = -Math.PI * 0.55
        }
        if (leftLegRef.current) {
          leftLegRef.current.rotation.x = -0.65
          leftLegRef.current.rotation.z = 0.15
        }
        if (rightLegRef.current) {
          rightLegRef.current.rotation.x = 0.65
          rightLegRef.current.rotation.z = -0.15
        }
      } else {
        // Upright: recover spin, apply walk cycle
        innerRef.current.rotation.z = THREE.MathUtils.lerp(innerRef.current.rotation.z, 0, 0.25)

        if (isMoving) walkPhase.current += dt * 9
        const swing = Math.sin(walkPhase.current)

        // Melee swing: right arm lunges forward, left arm swings back
        const meleeT = es.meleeSwing > 0 ? Math.sin((es.meleeSwing / 0.28) * Math.PI) : 0

        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x,  0.35 - swing * 0.38 + meleeT * 0.6, 0.3)
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z,  0.18, 0.3)
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0.55 + swing * 0.38 - meleeT * 1.8, 0.3)
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.12 - meleeT * 0.3, 0.3)
        }
        if (leftLegRef.current) {
          leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x,  swing * 0.52, 0.3)
          leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z,  0, 0.3)
        }
        if (rightLegRef.current) {
          rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -swing * 0.52, 0.3)
          rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z,  0, 0.3)
        }
      }
    } else if (player2) {
      // P2 walk cycle only
      if (isMoving) walkPhase.current += dt * 9
      const swing = Math.sin(walkPhase.current)
      if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing * 0.52
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.52
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = 0.35 - swing * 0.38
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0.55 + swing * 0.38
    }

    // Power-up glow: quad damage = rainbow, berserker = orange pulse
    if (p.quadDamageTimer > 0) {
      const hue = (now * 120) % 360
      uniformMat.color.setHSL(hue / 360, 1, 0.55)
      helmetMat.color.setHSL(((hue + 60) % 360) / 360, 1, 0.55)
      uniformMat.emissiveIntensity = 0.9
      helmetMat.emissiveIntensity = 0.9
    } else if (p.berserkerTimer > 0) {
      const pulse = (Math.sin(now * 10) + 1) * 0.5
      uniformMat.color.set(player2 ? '#cc3300' : (sc?.uniform ?? '#1a3a6e'))
      uniformMat.emissive.setRGB(1, 0.35, 0)
      uniformMat.emissiveIntensity = 0.6 + pulse * 1.2
      helmetMat.emissive.setRGB(1, 0.4, 0)
      helmetMat.emissiveIntensity = 0.8 + pulse
    } else if (p.health < 30) {
      uniformMat.color.set(player2 ? '#cc3300' : (sc?.uniform ?? '#1a3a6e'))
      helmetMat.color.set(player2 ? '#ff6600' : (sc?.helmet ?? '#00aaff'))
      helmetMat.emissive.set(player2 ? '#ff6600' : (sc?.helmetEmissive ?? '#00aaff'))
      helmetMat.emissiveIntensity = sc?.helmetEmissiveIntensity ?? 0.55
      uniformMat.emissiveIntensity = (sc?.uniformEmissiveIntensity ?? 0.3) + ((Math.sin(now * 8) + 1) * 0.5) * 0.7
    } else {
      uniformMat.color.set(player2 ? '#cc3300' : (sc?.uniform ?? '#1a3a6e'))
      helmetMat.color.set(player2 ? '#ff6600' : (sc?.helmet ?? '#00aaff'))
      helmetMat.emissive.set(player2 ? '#ff6600' : (sc?.helmetEmissive ?? '#00aaff'))
      helmetMat.emissiveIntensity = sc?.helmetEmissiveIntensity ?? 0.55
      uniformMat.emissiveIntensity = sc?.uniformEmissiveIntensity ?? 0.3
    }

    // Muzzle flash
    weaponMat.emissiveIntensity = p.shootCooldown > 0
      ? Math.min(1.5, (p.shootCooldown / 0.06) * 1.5)
      : 0.2
  })

  return (
    <group>
      <group ref={innerRef}>
        {/* Head (skin) */}
        <mesh material={skinMat} position={[0, 0.43, 0.0]} castShadow>
          <sphereGeometry args={[0.19, 8, 6]} />
        </mesh>
        {/* Helmet */}
        <mesh material={helmetMat} position={[0, 0.47, -0.01]} castShadow>
          <sphereGeometry args={[0.205, 8, 6]} />
        </mesh>
        {/* Torso */}
        <mesh material={uniformMat} position={[0, 0.09, 0]} castShadow>
          <boxGeometry args={[0.34, 0.30, 0.23]} />
        </mesh>
        {/* Left arm */}
        <mesh ref={leftArmRef} material={uniformMat} position={[-0.26, 0.13, -0.09]} rotation={[0.35, 0, 0.18]} castShadow>
          <boxGeometry args={[0.11, 0.11, 0.28]} />
        </mesh>
        {/* Right arm (weapon arm) */}
        <mesh ref={rightArmRef} material={uniformMat} position={[0.14, 0.13, -0.26]} rotation={[0.55, 0, -0.12]} castShadow>
          <boxGeometry args={[0.11, 0.11, 0.30]} />
        </mesh>
        {/* Primary weapon */}
        <mesh material={weaponMat} position={[0, 0.09, -0.54]} castShadow>
          <boxGeometry args={[0.13, 0.09, 0.52]} />
        </mesh>
        {/* Akimbo second weapon — visibility toggled via ref in useFrame */}
        <mesh ref={akimboWeaponRef} material={weaponMat} visible={false} position={[-0.22, 0.09, -0.42]} rotation={[0.2, -0.3, 0]} castShadow>
          <boxGeometry args={[0.10, 0.08, 0.38]} />
        </mesh>
        {/* Left leg */}
        <mesh ref={leftLegRef} material={pantsMat} position={[-0.09, -0.20, 0.02]} castShadow>
          <boxGeometry args={[0.12, 0.24, 0.14]} />
        </mesh>
        {/* Right leg */}
        <mesh ref={rightLegRef} material={pantsMat} position={[0.09, -0.20, 0.02]} castShadow>
          <boxGeometry args={[0.12, 0.24, 0.14]} />
        </mesh>
      </group>

      {/* Health bar — only for P2 (P1 uses the HUD bar) */}
      {player2 && (
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
      )}
    </group>
  )
}
