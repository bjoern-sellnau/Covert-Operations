import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { entityStore, spawnParticles } from './entityStore'
import type { PickupData, PickupKind, ChaosModifier } from './entityStore'
import { useMutatorsStore } from '../store/mutatorsStore'
import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from './loadoutStore'
import { WEAPON_CONFIGS, ARENA_HALF, EQUIPMENT_CONFIGS, FOCUS_MAX } from './types'
import type { WeaponId } from './types'

const POOL          = 28
const PICKUP_RADIUS = 0.65
const CHAOS_WEAPONS: WeaponId[] = ['pistol','smg','shotgun','rifle','uzi','mp5','m16','blaster','flak']

// Colors per pickup kind
const KIND_COLOR: Record<PickupKind, string> = {
  ammo:        '#00aaff',
  weapon:      '#ff8800',
  health:      '#00ff66',
  credits:     '#ffee00',
  bad_package: '#8800cc',
  armor:       '#4488ff',
  focus:       '#00ffcc',
  quad_damage: '#ffcc00',
  berserker:   '#ff6600',
}
const KIND_EMISSIVE: Record<PickupKind, string> = {
  ammo:        '#002244',
  weapon:      '#331a00',
  health:      '#003322',
  credits:     '#332200',
  bad_package: '#220033',
  armor:       '#001133',
  focus:       '#003322',
  quad_damage: '#332200',
  berserker:   '#331100',
}

// Module-level pool of pre-built materials (one per slot)
const _pickupMats = Array.from({ length: POOL }, () =>
  new THREE.MeshStandardMaterial({
    color: '#00aaff', emissive: '#002244', emissiveIntensity: 1.4,
    roughness: 0.25, metalness: 0.65,
  })
)

// ── Public API ────────────────────────────────────────────────────────────────
// Called by GameScene when an enemy dies (enemy drops mutator).
export function spawnEnemyDrop(x: number, z: number, drops: string[]) {
  for (const drop of drops) {
    const slot = _freeSlot()
    if (slot < 0) return
    const kind: PickupKind = drop === 'health' ? 'health'
      : drop === 'credits' ? 'credits'
      : drop === 'weapons' ? 'weapon'
      : drop === 'armor'   ? 'armor'
      : drop === 'focus'   ? 'focus'
      : 'ammo'
    _push(slot, {
      id: `drop-${++entityStore.pickupIdCounter}`,
      x: x + (Math.random() - 0.5) * 1.2,
      z: z + (Math.random() - 0.5) * 1.2,
      kind,
      weaponId:      'pistol',
      amount:        kind === 'health' ? 20 : kind === 'credits' ? 15 : kind === 'ammo' ? 16 : kind === 'armor' ? 25 : kind === 'focus' ? 30 : 0,
      active:        true,
      spawnTime:     performance.now() / 1000,
      isChaos:       false,
      chaosModifier: 'normal',
      fuseTimer:     0,
      fallY:         0,
    })
  }
}

function _freeSlot(): number {
  for (let i = 0; i < POOL; i++) {
    if (i >= entityStore.pickups.length || !entityStore.pickups[i].active) return i
  }
  return -1
}

function _push(slot: number, data: PickupData) {
  if (slot < entityStore.pickups.length) entityStore.pickups[slot] = data
  else entityStore.pickups.push(data)
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PickupSystem() {
  const meshRefs   = useRef<(THREE.Mesh | null)[]>(new Array(POOL).fill(null))
  const spawnTimer = useRef(6 + Math.random() * 4)
  const chaosTimer = useRef(10 + Math.random() * 6)

  useFrame((_, delta) => {
    const dt       = Math.min(delta, 0.05)
    const mutators = useMutatorsStore.getState()
    const setMsg   = useGameStore.getState().setWaveMessage
    const es       = entityStore

    // ── Regular pickup spawning ─────────────────────────────────────────────
    if (mutators.weaponPickups !== 'none' || mutators.crateExtras.length > 0) {
      spawnTimer.current -= dt
      if (spawnTimer.current <= 0) {
        spawnTimer.current = 7 + Math.random() * 7
        _spawnRandom(mutators.weaponPickups, mutators.crateExtras)
      }
    }

    // ── Chaos crate dropping ────────────────────────────────────────────────
    if (mutators.chaosMode) {
      chaosTimer.current -= dt
      if (chaosTimer.current <= 0) {
        chaosTimer.current = 10 + Math.random() * 8
        _spawnChaosCrate()
      }
    }

    // ── Update pickups ──────────────────────────────────────────────────────
    for (let i = 0; i < es.pickups.length; i++) {
      const p    = es.pickups[i]
      const mesh = meshRefs.current[i % POOL]

      if (!p.active) {
        if (mesh) mesh.visible = false
        continue
      }

      // Falling chaos crates
      if (p.fallY > 0) p.fallY = Math.max(0, p.fallY - 16 * dt)

      // Animate mesh
      if (mesh) {
        mesh.visible = true
        mesh.position.set(p.x, p.fallY + 0.28, p.z)
        mesh.rotation.y += dt * (p.kind === 'bad_package' ? 4 : 1.8)
        const t     = performance.now() / 1000 - p.spawnTime
        const pulse = 1 + Math.sin(t * 3.5) * 0.06
        mesh.scale.setScalar(pulse * (p.kind === 'bad_package' && p.fuseTimer > 0 ? 1 + (2 - Math.max(0, p.fuseTimer)) * 0.1 : 1))

        // Update material per kind
        const mat = _pickupMats[i % POOL]
        if (p.isChaos) {
          const mod: Record<ChaosModifier, string> = { normal: '#aa44ff', explosive: '#ff2200', jammed: '#ffaa00' }
          mat.color.set(mod[p.chaosModifier])
          mat.emissive.set(mod[p.chaosModifier])
          mat.emissiveIntensity = 1.0 + Math.sin(t * 6) * 0.4
        } else {
          mat.color.set(KIND_COLOR[p.kind])
          mat.emissive.set(KIND_EMISSIVE[p.kind])
          mat.emissiveIntensity = p.kind === 'bad_package'
            ? 1.2 + Math.sin(t * 12) * 0.8
            : 1.0 + Math.sin(t * 3) * 0.3
        }
      }

      // Bad package fuse countdown
      if (p.kind === 'bad_package' && p.fuseTimer > 0) {
        p.fuseTimer -= dt
        if (p.fuseTimer <= 0) {
          p.active = false
          if (mesh) mesh.visible = false
          spawnParticles(p.x, p.z, 'explosion', 22)
          const dx = es.player.position.x - p.x
          const dz = es.player.position.y - p.z
          if (Math.sqrt(dx * dx + dz * dz) < 3.5) {
            es.player.health -= 40
            es.player.invincibleUntil = performance.now() / 1000 + 0.8
          }
          setMsg('💥 BOMBE!')
          setTimeout(() => setMsg(''), 1200)
          continue
        }
      }

      // Player overlap (only when on ground)
      if (p.fallY <= 0.1) {
        const dx   = es.player.position.x - p.x
        const dz   = es.player.position.y - p.z
        if (Math.sqrt(dx * dx + dz * dz) < PICKUP_RADIUS) {
          _applyPickup(p, setMsg)
          p.active = false
          if (mesh) mesh.visible = false
        }
      }
    }
  })

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => { meshRefs.current[i] = m }}
          visible={false}
          material={_pickupMats[i % POOL]}
          castShadow
        >
          <boxGeometry args={[0.38, 0.38, 0.38]} />
        </mesh>
      ))}
    </>
  )
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function _spawnRandom(mode: string, extras: string[]) {
  const slot = _freeSlot()
  if (slot < 0) return
  const x   = (Math.random() - 0.5) * (ARENA_HALF * 2 - 5)
  const z   = (Math.random() - 0.5) * (ARENA_HALF * 2 - 5)
  const rng = Math.random()

  // 20% chance to spawn a crate extra if any are configured
  let kind: PickupKind
  if (extras.length > 0 && rng < 0.20) {
    kind = extras[Math.floor(Math.random() * extras.length)] as PickupKind
  } else if (mode === 'none') {
    kind = extras.length > 0 ? extras[Math.floor(Math.random() * extras.length)] as PickupKind : 'ammo'
  } else if (mode === 'ammo')    { kind = 'ammo' }
  else if (mode === 'weapons')   { kind = 'weapon' }
  else if (mode === 'chaos')     { kind = rng < 0.25 ? 'bad_package' : rng < 0.55 ? 'weapon' : 'ammo' }
  else { kind = rng < 0.5 ? 'ammo' : 'weapon' }  // 'both'

  const weapons: WeaponId[] = ['pistol','smg','shotgun','rifle','uzi','mp5','m16']
  const extraAmounts: Partial<Record<PickupKind, number>> = { ammo: 20, health: 20, armor: 25, focus: 30 }
  _push(slot, {
    id:            `pickup-${++entityStore.pickupIdCounter}`,
    x, z, kind,
    weaponId:      weapons[Math.floor(Math.random() * weapons.length)],
    amount:        extraAmounts[kind] ?? 0,
    active:        true,
    spawnTime:     performance.now() / 1000,
    isChaos:       false,
    chaosModifier: 'normal',
    fuseTimer:     kind === 'bad_package' ? (Math.random() < 0.3 ? -1 : 2.2) : 0,
    fallY:         0,
  })
}

function _spawnChaosCrate() {
  const slot = _freeSlot()
  if (slot < 0) return
  const x          = (Math.random() - 0.5) * (ARENA_HALF * 2 - 5)
  const z          = (Math.random() - 0.5) * (ARENA_HALF * 2 - 5)
  const weaponId   = CHAOS_WEAPONS[Math.floor(Math.random() * CHAOS_WEAPONS.length)]
  const rng        = Math.random()
  const chaosModifier: ChaosModifier = rng < 0.4 ? 'normal' : rng < 0.7 ? 'jammed' : 'explosive'
  _push(slot, {
    id:            `chaos-${++entityStore.pickupIdCounter}`,
    x, z,
    kind:          'weapon',
    weaponId,
    amount:        WEAPON_CONFIGS[weaponId].baseAmmo,
    active:        true,
    spawnTime:     performance.now() / 1000,
    isChaos:       true,
    chaosModifier,
    fuseTimer:     0,
    fallY:         18,
  })
}

function _applyPickup(p: PickupData, setMsg: (m: string) => void) {
  const es     = entityStore
  const loadout = useLoadoutStore.getState()

  if (p.kind === 'ammo') {
    es.ammo = Math.min(es.maxAmmo, es.ammo + p.amount)
    es.weaponAmmo.set(loadout.selectedWeapon, es.ammo)
    setMsg('+MUNITION')
    setTimeout(() => setMsg(''), 1400)

  } else if (p.kind === 'weapon') {
    if (p.isChaos) {
      es.chaosWeaponId  = p.weaponId
      es.chaosAmmo      = p.amount
      es.chaosModifier  = p.chaosModifier
      const icon = p.chaosModifier === 'explosive' ? '💥' : p.chaosModifier === 'jammed' ? '⚠' : '★'
      setMsg(`${icon} CHAOS: ${WEAPON_CONFIGS[p.weaponId].shortName}`)
    } else {
      const wid   = p.weaponId
      const cur   = es.weaponAmmo.get(wid) ?? 0
      const max   = WEAPON_CONFIGS[wid].baseAmmo
      es.weaponAmmo.set(wid, Math.min(max, cur + Math.round(max * 0.6)))
      setMsg(`+${WEAPON_CONFIGS[wid].shortName}`)
    }
    setTimeout(() => setMsg(''), 1600)

  } else if (p.kind === 'health') {
    es.player.health = Math.min(100, es.player.health + p.amount)
    setMsg(`+${p.amount} HP`)
    setTimeout(() => setMsg(''), 1200)

  } else if (p.kind === 'credits') {
    es.creditsEarned += p.amount
    setMsg(`+${p.amount} CR`)
    setTimeout(() => setMsg(''), 1200)

  } else if (p.kind === 'bad_package') {
    if (p.fuseTimer < 0) {
      es.ammo = Math.min(es.maxAmmo, es.ammo + 8)
      setMsg('BLINDGÄNGER ✓')
    }
    setTimeout(() => setMsg(''), 1500)

  } else if (p.kind === 'armor') {
    const maxArmor = loadout.ownedEquipment.includes('palantir_suit')
      ? EQUIPMENT_CONFIGS.palantir_suit.maxArmor : 50
    es.player.armor = Math.min(maxArmor, es.player.armor + p.amount)
    setMsg(`+${p.amount} RÜSTUNG`)
    setTimeout(() => setMsg(''), 1400)

  } else if (p.kind === 'focus') {
    es.focus = Math.min(FOCUS_MAX, es.focus + p.amount)
    setMsg('+FOCUS')
    setTimeout(() => setMsg(''), 1200)

  } else if (p.kind === 'quad_damage') {
    const dur = useMutatorsStore.getState().quadDamageDuration
    es.player.quadDamageTimer = dur
    setMsg('★ QUAD DAMAGE!')
    setTimeout(() => setMsg(''), 2200)

  } else if (p.kind === 'berserker') {
    const dur = useMutatorsStore.getState().berserkerDuration
    es.player.berserkerTimer = dur
    setMsg('⚡ BERSERKER!')
    setTimeout(() => setMsg(''), 2200)
  }
}
