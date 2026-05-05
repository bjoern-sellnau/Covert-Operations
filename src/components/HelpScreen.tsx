import { useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useGameStore } from '../store/gameStore'
import { WEAPON_CONFIGS, ENEMY_CONFIGS } from '../game/types'
import type { WeaponId, EnemyType } from '../game/types'

// ── PartDef ──────────────────────────────────────────────────────────────────

interface PartDef {
  g: 'b' | 'c' | 's'
  p: [number, number, number]
  s: [number, number, number]
  r?: [number, number, number]
  c: string
  m?: number
  rg?: number
  e?: string
  ei?: number
}

function Parts({ defs }: { defs: PartDef[] }) {
  return (
    <>
      {defs.map((d, i) => (
        <mesh key={i} position={d.p} scale={d.s} rotation={d.r ?? [0, 0, 0]}>
          {d.g === 'b' ? <boxGeometry /> :
           d.g === 'c' ? <cylinderGeometry args={[0.5, 0.5, 1, 10]} /> :
                         <sphereGeometry args={[0.5, 12, 8]} />}
          <meshStandardMaterial
            color={d.c} metalness={d.m ?? 0} roughness={d.rg ?? 0.6}
            emissive={d.e ?? '#000000'} emissiveIntensity={d.ei ?? 0}
          />
        </mesh>
      ))}
    </>
  )
}

function RotatingModel({ defs }: { defs: PartDef[] }) {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.9
  })
  return (
    <group ref={ref}>
      <Parts defs={defs} />
    </group>
  )
}

// ── Weapon shapes ─────────────────────────────────────────────────────────────

const WEAPON_PARTS: Record<WeaponId, PartDef[]> = {
  pistol: [
    { g: 'b', p: [0, 0, 0],    s: [0.55, 0.28, 0.18], c: '#333344', m: 0.8, rg: 0.3 },
    { g: 'b', p: [0, -0.3, 0], s: [0.22, 0.38, 0.18], c: '#222230', m: 0.5, rg: 0.5 },
    { g: 'c', p: [0.42, 0.04, 0], s: [0.1, 0.52, 0.1], r: [0, 0, Math.PI / 2], c: '#222233', m: 0.9, rg: 0.2 },
  ],
  smg: [
    { g: 'b', p: [0, 0, 0],     s: [0.8, 0.22, 0.18], c: '#2a2a38', m: 0.7, rg: 0.3 },
    { g: 'b', p: [-0.1, -0.28, 0], s: [0.18, 0.34, 0.16], c: '#1e1e2a', m: 0.5 },
    { g: 'c', p: [0.52, 0.02, 0], s: [0.1, 0.48, 0.1], r: [0, 0, Math.PI / 2], c: '#222233', m: 0.9, rg: 0.2 },
    { g: 'b', p: [0.1, 0.18, 0], s: [0.26, 0.12, 0.12], c: '#222230' },
  ],
  shotgun: [
    { g: 'b', p: [0, 0, 0],     s: [0.9, 0.25, 0.22], c: '#5c3a1e', m: 0.1, rg: 0.8 },
    { g: 'b', p: [0, -0.28, 0], s: [0.22, 0.32, 0.2],  c: '#4a2e14', rg: 0.9 },
    { g: 'c', p: [0.55, 0.04, 0],  s: [0.16, 0.52, 0.16], r: [0, 0, Math.PI / 2], c: '#2a2a2a', m: 0.7, rg: 0.3 },
    { g: 'b', p: [0.12, 0.06, 0], s: [0.35, 0.12, 0.18], c: '#3a2510', rg: 0.7 },
  ],
  rifle: [
    { g: 'b', p: [0, 0, 0],      s: [1.0, 0.22, 0.18], c: '#2e3a2e', m: 0.6, rg: 0.4 },
    { g: 'b', p: [-0.2, -0.26, 0], s: [0.2, 0.3, 0.16],  c: '#3a2a1a', rg: 0.8 },
    { g: 'c', p: [0.6, 0.02, 0],  s: [0.1, 0.55, 0.1],  r: [0, 0, Math.PI / 2], c: '#202028', m: 0.9, rg: 0.2 },
    { g: 'b', p: [0.08, 0.16, 0], s: [0.3, 0.1, 0.1],   c: '#223322', m: 0.5 },
  ],
  uzi: [
    { g: 'b', p: [0, 0, 0],     s: [0.62, 0.22, 0.16], c: '#2a2a36', m: 0.75, rg: 0.3 },
    { g: 'b', p: [0, -0.26, 0], s: [0.16, 0.3, 0.14],  c: '#1e1e28', m: 0.5 },
    { g: 'c', p: [0.42, 0.02, 0], s: [0.09, 0.44, 0.09], r: [0, 0, Math.PI / 2], c: '#181820', m: 0.9, rg: 0.15 },
  ],
  mp5: [
    { g: 'b', p: [0, 0, 0],      s: [0.78, 0.22, 0.18], c: '#2c2c3c', m: 0.7, rg: 0.3 },
    { g: 'b', p: [-0.05, -0.27, 0], s: [0.18, 0.32, 0.16], c: '#201e2c', m: 0.5 },
    { g: 'c', p: [0.5, 0.02, 0],  s: [0.1, 0.5, 0.1],  r: [0, 0, Math.PI / 2], c: '#1a1a22', m: 0.85, rg: 0.2 },
    { g: 'b', p: [0.05, 0.15, 0], s: [0.22, 0.1, 0.1],  c: '#222233' },
  ],
  m16: [
    { g: 'b', p: [0, 0, 0],       s: [1.05, 0.22, 0.18], c: '#282c28', m: 0.55, rg: 0.45 },
    { g: 'b', p: [-0.25, -0.27, 0], s: [0.2, 0.32, 0.16],  c: '#3a2a1a', rg: 0.8 },
    { g: 'c', p: [0.62, 0.02, 0],  s: [0.1, 0.58, 0.1],  r: [0, 0, Math.PI / 2], c: '#1a1e1a', m: 0.85, rg: 0.2 },
    { g: 'b', p: [0.1, 0.16, 0],  s: [0.35, 0.1, 0.1],   c: '#242c24', m: 0.5 },
  ],
  blaster: [
    { g: 'b', p: [0, 0, 0],    s: [0.72, 0.28, 0.22], c: '#113366', m: 0.5, rg: 0.3, e: '#0044cc', ei: 0.4 },
    { g: 'b', p: [0, -0.28, 0], s: [0.2, 0.32, 0.18], c: '#0a1f44', m: 0.4 },
    { g: 's', p: [0.46, 0.04, 0], s: [0.26, 0.26, 0.26], c: '#00aaff', m: 0.3, rg: 0.2, e: '#00ccff', ei: 1.2 },
  ],
  plasma: [
    { g: 'b', p: [0, 0, 0],    s: [0.75, 0.3, 0.24], c: '#2a0a44', m: 0.4, rg: 0.4, e: '#8800ff', ei: 0.5 },
    { g: 'b', p: [0, -0.28, 0], s: [0.22, 0.32, 0.2], c: '#1a0630', m: 0.3 },
    { g: 's', p: [0.5, 0.04, 0], s: [0.3, 0.3, 0.3], c: '#cc44ff', m: 0.2, rg: 0.2, e: '#aa00ff', ei: 1.6 },
  ],
  bazooka: [
    { g: 'c', p: [0, 0, 0],    s: [0.32, 1.1, 0.32], r: [0, 0, Math.PI / 2], c: '#3a3a20', m: 0.5, rg: 0.5 },
    { g: 'c', p: [0.58, 0, 0], s: [0.36, 0.22, 0.36], r: [0, 0, Math.PI / 2], c: '#222214', m: 0.3, rg: 0.6, e: '#ff6600', ei: 0.3 },
    { g: 'b', p: [-0.1, -0.28, 0], s: [0.22, 0.22, 0.18], c: '#2a2816' },
  ],
  flak: [
    { g: 'b', p: [0, 0, 0],     s: [0.85, 0.28, 0.28], c: '#2a2a1c', m: 0.6, rg: 0.4 },
    { g: 'c', p: [0.52, 0.02, 0], s: [0.22, 0.5, 0.22], r: [0, 0, Math.PI / 2], c: '#1e1e14', m: 0.7, rg: 0.3 },
    { g: 'b', p: [-0.1, -0.28, 0], s: [0.2, 0.3, 0.18], c: '#242418' },
  ],
  banana: [
    { g: 'b', p: [0, 0, 0],     s: [0.7, 0.26, 0.22], c: '#554400', m: 0.3, rg: 0.5 },
    { g: 's', p: [0.44, 0.04, 0], s: [0.28, 0.28, 0.28], c: '#ffee00', m: 0.1, rg: 0.5, e: '#ffcc00', ei: 0.4 },
    { g: 'b', p: [0, -0.27, 0], s: [0.2, 0.3, 0.18], c: '#3a2e10' },
  ],
  bfg: [
    { g: 'b', p: [0, 0, 0],    s: [0.85, 0.4, 0.38], c: '#0a1a0a', m: 0.6, rg: 0.3, e: '#00aa00', ei: 0.3 },
    { g: 'b', p: [0, -0.33, 0], s: [0.26, 0.35, 0.24], c: '#061006', m: 0.5 },
    { g: 's', p: [0.56, 0.04, 0], s: [0.42, 0.42, 0.42], c: '#00ff44', m: 0.2, rg: 0.2, e: '#00ff00', ei: 2.0 },
  ],
  grenade: [
    { g: 's', p: [0, 0.06, 0],  s: [0.5, 0.5, 0.5],  c: '#2a3a20', m: 0.4, rg: 0.6 },
    { g: 'c', p: [0, 0.4, 0],   s: [0.1, 0.22, 0.1],  c: '#1a1a14' },
    { g: 'b', p: [0, 0.54, 0],  s: [0.18, 0.08, 0.18], c: '#cc8800', m: 0.7, rg: 0.3 },
  ],
  knife: [
    { g: 'b', p: [0, 0.24, 0],  s: [0.1, 0.6, 0.06], c: '#aaaaaa', m: 0.9, rg: 0.1 },
    { g: 'b', p: [0, -0.08, 0], s: [0.28, 0.1, 0.1],  c: '#555566', m: 0.7, rg: 0.3 },
    { g: 'b', p: [0, -0.28, 0], s: [0.14, 0.34, 0.12], c: '#3a2a1a', rg: 0.8 },
  ],
  bat: [
    { g: 'c', p: [0, 0, 0],    s: [0.22, 1.2, 0.22], c: '#8b5a2b', m: 0.1, rg: 0.9 },
    { g: 'c', p: [0, 0.56, 0], s: [0.32, 0.28, 0.32], c: '#a06830', m: 0.1, rg: 0.8 },
  ],
  stick: [
    { g: 'c', p: [0, 0, 0],    s: [0.16, 1.3, 0.16], c: '#6a4a22', m: 0.1, rg: 0.95 },
  ],
  vernichter: [
    { g: 'b', p: [0, 0, 0],    s: [0.9, 0.38, 0.36], c: '#1a0a2a', m: 0.5, rg: 0.3, e: '#6600cc', ei: 0.5 },
    { g: 's', p: [0.55, 0.04, 0], s: [0.36, 0.36, 0.36], c: '#8800ff', m: 0.2, rg: 0.2, e: '#aa00ff', ei: 2.0 },
    { g: 'b', p: [0, -0.32, 0], s: [0.28, 0.34, 0.24], c: '#12071e', m: 0.5 },
  ],
  deathlas: [
    { g: 'b', p: [0, 0, 0],    s: [0.9, 0.3, 0.28], c: '#1a0808', m: 0.6, rg: 0.3, e: '#ff0000', ei: 0.4 },
    { g: 'c', p: [0.55, 0.02, 0], s: [0.13, 0.55, 0.13], r: [0, 0, Math.PI / 2], c: '#220000', m: 0.7, e: '#ff2200', ei: 0.8 },
    { g: 'b', p: [0, -0.28, 0], s: [0.24, 0.3, 0.22], c: '#140404' },
  ],
  ioncan: [
    { g: 'b', p: [0, 0, 0],    s: [0.8, 0.35, 0.32], c: '#0a1a22', m: 0.6, rg: 0.3, e: '#0088ff', ei: 0.4 },
    { g: 'c', p: [0.52, 0.02, 0], s: [0.2, 0.48, 0.2], r: [0, 0, Math.PI / 2], c: '#04121a', m: 0.8, e: '#00aaff', ei: 0.7 },
    { g: 's', p: [-0.48, 0.02, 0], s: [0.22, 0.22, 0.22], c: '#00ccff', m: 0.3, rg: 0.2, e: '#00ffff', ei: 1.4 },
  ],
}

// ── Pickup shapes ─────────────────────────────────────────────────────────────

type PickupKind = 'ammo' | 'weapon' | 'health' | 'credits' | 'bad_package' | 'armor' | 'focus' | 'quad_damage' | 'berserker'

const PICKUP_PARTS: Record<PickupKind, PartDef[]> = {
  ammo: [
    { g: 'b', p: [0, 0, 0],     s: [0.5, 0.35, 0.22], c: '#00aaff', m: 0.7, rg: 0.3, e: '#0044aa', ei: 0.4 },
    { g: 'b', p: [0, -0.02, 0], s: [0.25, 0.5, 0.1],  c: '#0088cc', m: 0.8, rg: 0.2 },
  ],
  weapon: [
    { g: 'b', p: [0, 0, 0],    s: [0.65, 0.22, 0.18], c: '#ff8800', m: 0.6, rg: 0.3, e: '#aa4400', ei: 0.5 },
    { g: 'c', p: [0.42, 0.02, 0], s: [0.1, 0.45, 0.1], r: [0, 0, Math.PI / 2], c: '#cc6600', m: 0.8, rg: 0.2 },
  ],
  health: [
    { g: 'b', p: [0, 0, 0],    s: [0.55, 0.18, 0.18], c: '#00ff66', m: 0.3, rg: 0.5, e: '#00aa44', ei: 0.6 },
    { g: 'b', p: [0, 0, 0],    s: [0.18, 0.55, 0.18], c: '#00ff66', m: 0.3, rg: 0.5, e: '#00aa44', ei: 0.6 },
  ],
  credits: [
    { g: 'c', p: [0, 0, 0],    s: [0.56, 0.14, 0.56], c: '#ffdd00', m: 0.9, rg: 0.1, e: '#aa8800', ei: 0.5 },
    { g: 'c', p: [0, 0.08, 0], s: [0.34, 0.06, 0.34], c: '#ffcc00', m: 0.9, rg: 0.1 },
  ],
  bad_package: [
    { g: 'b', p: [0, 0, 0],     s: [0.55, 0.55, 0.55], c: '#cc2200', m: 0.3, rg: 0.6, e: '#880000', ei: 0.3 },
    { g: 'b', p: [0, 0, 0.28],  s: [0.52, 0.08, 0.04], r: [0, 0, Math.PI / 4],  c: '#ff0000', e: '#ff0000', ei: 0.8 },
    { g: 'b', p: [0, 0, 0.28],  s: [0.52, 0.08, 0.04], r: [0, 0, -Math.PI / 4], c: '#ff0000', e: '#ff0000', ei: 0.8 },
  ],
  armor: [
    { g: 'b', p: [0, 0, 0],     s: [0.6, 0.5, 0.14], c: '#4488ff', m: 0.8, rg: 0.2, e: '#1144aa', ei: 0.4 },
    { g: 'b', p: [0, 0.3, 0],   s: [0.4, 0.18, 0.14], c: '#3366dd', m: 0.8, rg: 0.2 },
  ],
  focus: [
    { g: 's', p: [0, 0, 0],    s: [0.5, 0.5, 0.5], c: '#aa66ff', m: 0.3, rg: 0.3, e: '#6600ff', ei: 1.0 },
  ],
  quad_damage: [
    { g: 's', p: [0, 0, 0],    s: [0.55, 0.55, 0.55], c: '#ff6600', m: 0.3, rg: 0.2, e: '#ff4400', ei: 1.8 },
    { g: 's', p: [0, 0, 0],    s: [0.38, 0.38, 0.38], c: '#ffaa00', m: 0.2, rg: 0.2, e: '#ff8800', ei: 1.2 },
  ],
  berserker: [
    { g: 's', p: [0, 0, 0],    s: [0.52, 0.52, 0.52], c: '#ff0066', m: 0.3, rg: 0.2, e: '#cc0044', ei: 1.5 },
    { g: 'b', p: [0,  0.36, 0], s: [0.1, 0.2, 0.1],  c: '#ff2288', e: '#ff0066', ei: 1.0 },
    { g: 'b', p: [0, -0.36, 0], s: [0.1, 0.2, 0.1],  c: '#ff2288', e: '#ff0066', ei: 1.0 },
    { g: 'b', p: [ 0.36, 0, 0], s: [0.2, 0.1, 0.1],  c: '#ff2288', e: '#ff0066', ei: 1.0 },
    { g: 'b', p: [-0.36, 0, 0], s: [0.2, 0.1, 0.1],  c: '#ff2288', e: '#ff0066', ei: 1.0 },
  ],
}

// ── Character shapes ──────────────────────────────────────────────────────────

type CharId = 'player' | EnemyType

function charParts(id: CharId): PartDef[] {
  if (id === 'player') {
    return [
      { g: 'c', p: [0, -0.1, 0], s: [0.75, 0.85, 0.75], c: '#00ff88', m: 0.4, rg: 0.5, e: '#00aa55', ei: 0.3 },
      { g: 's', p: [0,  0.52, 0], s: [0.52, 0.52, 0.52], c: '#00ee77', m: 0.3, rg: 0.5, e: '#00aa44', ei: 0.2 },
    ]
  }
  const cfg = ENEMY_CONFIGS[id as EnemyType]
  const sc = cfg.size * 1.6
  return [
    { g: 'c', p: [0, -0.08, 0], s: [sc, sc * 0.9, sc],   c: cfg.color, m: 0.4, rg: 0.5, e: cfg.emissive, ei: 0.3 },
    { g: 's', p: [0, sc * 0.62, 0], s: [sc * 0.65, sc * 0.65, sc * 0.65], c: cfg.color, m: 0.3, rg: 0.5, e: cfg.emissive, ei: 0.2 },
  ]
}

// ── Logo / fallback model ─────────────────────────────────────────────────────

const LOGO_PARTS: PartDef[] = [
  { g: 'b', p: [0, 0, 0],     s: [0.8, 0.8, 0.8], c: '#001a33', m: 0.7, rg: 0.3, e: '#0044aa', ei: 0.3 },
  { g: 'b', p: [0, 0, 0],     s: [0.55, 0.55, 0.55], r: [0, Math.PI / 4, Math.PI / 4], c: '#003366', m: 0.8, rg: 0.2, e: '#0066ff', ei: 0.5 },
  { g: 's', p: [0, 0, 0],     s: [0.32, 0.32, 0.32], c: '#00aaff', m: 0.4, rg: 0.2, e: '#00ccff', ei: 1.5 },
]

// ── 3D Canvas viewer ─────────────────────────────────────────────────────────

function ModelViewer({ parts }: { parts: PartDef[] }) {
  return (
    <Canvas
      camera={{ position: [0, 0.6, 2.8], fov: 38 }}
      style={{ width: 280, height: 280, borderRadius: 4 }}
    >
      <color attach="background" args={['#060804']} />
      <ambientLight intensity={5.0} />
      <directionalLight position={[3, 6, 3]} intensity={6.0} />
      <directionalLight position={[-3, 2, -2]} intensity={3.0} color="#88aaff" />
      <pointLight position={[0, 1, 3]} intensity={4.0} distance={10} />
      <RotatingModel defs={parts} />
    </Canvas>
  )
}

// ── Stat bar ──────────────────────────────────────────────────────────────────

function StatBar({ label, value, max = 5, color }: { label: string; value: number; max?: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ color: 'rgba(106,112,72,0.6)', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.1em', width: 56, flexShrink: 0 }}>{label}</div>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{
            width: 18, height: 7, borderRadius: 1,
            background: i < value ? color : '#111122',
            boxShadow: i < value ? `0 0 5px ${color}` : 'none',
          }} />
        ))}
      </div>
    </div>
  )
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'waffen' | 'pickups' | 'charaktere' | 'steuerung' | 'tipps' | 'editor' | 'specials'

// ── Weapon items ──────────────────────────────────────────────────────────────

const ALL_WEAPONS = Object.keys(WEAPON_CONFIGS) as WeaponId[]

function WeaponInfo({ id }: { id: WeaponId }) {
  const cfg = WEAPON_CONFIGS[id]
  return (
    <div>
      <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, color: '#e05418', fontSize: 22, letterSpacing: '0.12em', marginBottom: 4 }}>
        {cfg.name}
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(106,112,72,0.6)', fontSize: 9, letterSpacing: '0.2em', marginBottom: 14 }}>
        {cfg.shortName}{cfg.price > 0 ? ` · ${cfg.price} CR` : ' · KOSTENLOS'}
        {cfg.isMelee && ' · NAHKAMPF'}
        {cfg.isProjectile && ' · PROJEKTIL'}
        {cfg.isBanana && ' · ABPRALLER'}
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(200,196,176,0.65)', fontSize: 12, lineHeight: 1.7, marginBottom: 16, maxWidth: 340 }}>
        {cfg.description}
      </div>
      <StatBar label="SCHADEN" value={cfg.statDamage} color="#ff4444" />
      <StatBar label="RATE"    value={cfg.statRate}   color="#ffaa00" />
      <StatBar label="REICHW"  value={cfg.statRange}  color="#44aaff" />
      <div style={{ marginTop: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          cfg.baseDamage  && [`SCHADEN`, `${cfg.baseDamage}`],
          cfg.baseAmmo    && [`MAGAZIN`, `${cfg.baseAmmo}`],
          cfg.reloadTime  && [`RELOAD`, `${cfg.reloadTime}s`],
          cfg.pellets > 1 && [`PELLETS`, `${cfg.pellets}`],
          cfg.burstCount  && [`BURST`, `${cfg.burstCount}×`],
          cfg.projectileRadius && [`RADIUS`, `${cfg.projectileRadius}m`],
        ].filter((x): x is [string, string] => Boolean(x)).map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(106,112,72,0.5)', fontSize: 9, letterSpacing: '0.15em' }}>{k}</div>
            <div style={{ color: 'rgba(220,216,200,0.85)', fontSize: 14, fontWeight: 'bold' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pickup items ──────────────────────────────────────────────────────────────

const ALL_PICKUPS: Array<{ id: PickupKind; name: string; desc: string; color: string }> = [
  { id: 'ammo',        color: '#00aaff', name: 'MUNITION',       desc: 'Füllt Magazin der aktuellen Waffe auf. Überall verteilt.' },
  { id: 'weapon',      color: '#ff8800', name: 'WAFFE',          desc: 'Enthält eine zufällige Waffe. Lohnt sich immer!' },
  { id: 'health',      color: '#00ff66', name: 'MEDKIT',         desc: '+20 HP. Unentbehrlich in langen Wellen.' },
  { id: 'credits',     color: '#ffdd00', name: 'CREDITS',        desc: 'Geldfund. Mehr Credits = mehr Waffen im Shop.' },
  { id: 'bad_package', color: '#cc2200', name: 'BAD PACKAGE',    desc: 'Falle! Explodiert und schadet dem Spieler. Meiden!' },
  { id: 'armor',       color: '#4488ff', name: 'RÜSTUNG',        desc: '+25 Rüstung. Nimmt Schaden vor HP ab.' },
  { id: 'focus',       color: '#aa66ff', name: 'FOKUS',          desc: '+30 Fokus. Ermöglicht länger Bullet Time.' },
  { id: 'quad_damage', color: '#ff4400', name: 'QUAD DAMAGE',    desc: '4× Schaden für 90s. Stapelt nicht.' },
  { id: 'berserker',   color: '#ff0066', name: 'BERSERKER',      desc: 'Unverwundbar + Schnell für 60s. Aggressiv spielen!' },
]

function PickupInfo({ id }: { id: PickupKind }) {
  const info = ALL_PICKUPS.find((p) => p.id === id)!
  return (
    <div>
      <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, color: info.color, fontSize: 22, letterSpacing: '0.12em', marginBottom: 4, textShadow: `0 0 14px ${info.color}88` }}>
        {info.name}
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(200,196,176,0.65)', fontSize: 13, lineHeight: 1.7, marginTop: 16, maxWidth: 340 }}>
        {info.desc}
      </div>
    </div>
  )
}

// ── Character items ───────────────────────────────────────────────────────────

const ALL_CHARS: Array<{ id: CharId; name: string }> = [
  { id: 'player',     name: 'SPIELER'     },
  { id: 'basic',      name: 'BASIC'       },
  { id: 'fast',       name: 'FAST'        },
  { id: 'tank',       name: 'TANK'        },
  { id: 'berserker',  name: 'BERSERKER'   },
  { id: 'flanker',    name: 'FLANKER'     },
  { id: 'juggernaut', name: 'JUGGERNAUT'  },
]

function CharInfo({ id }: { id: CharId }) {
  if (id === 'player') {
    return (
      <div>
        <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, color: '#00ff88', fontSize: 22, letterSpacing: '0.12em', marginBottom: 4 }}>SPIELER</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(200,196,176,0.65)', fontSize: 12, lineHeight: 1.7, marginBottom: 16, maxWidth: 340 }}>
          Vollständig steuerbare Figur. 100 HP + Rüstungssystem. Nutze Bullet Time, Dive und Spin zur Überlebensstrategie.
        </div>
        <StatBar label="SPEED"   value={4} color="#00ff88" />
        <StatBar label="HP"      value={4} color="#ff4444" />
        <StatBar label="SCHUTZ"  value={5} color="#4488ff" />
      </div>
    )
  }
  const cfg = ENEMY_CONFIGS[id as EnemyType]
  const speedVal  = Math.round(Math.min(cfg.speed / 1.5, 5))
  const healthVal = Math.min(cfg.health, 5)
  const dangerVal = Math.round(Math.min(cfg.damage / 12, 5))
  return (
    <div>
      <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, color: cfg.color, fontSize: 22, letterSpacing: '0.12em', marginBottom: 4, textShadow: `0 0 14px ${cfg.emissive}88` }}>
        {id.toUpperCase()}
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(106,112,72,0.6)', fontSize: 9, letterSpacing: '0.2em', marginBottom: 14 }}>
        {cfg.scoreValue} PTS · {cfg.creditValue} CR · Ø {cfg.shootRange}m Reichweite
      </div>
      <StatBar label="SPEED"  value={speedVal}  color="#ffaa00" />
      <StatBar label="HP"     value={healthVal} color="#ff4444" />
      <StatBar label="GEFAHR" value={dangerVal} color="#ff0044" />
      <div style={{ marginTop: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          ['HP',      `${cfg.health}`],
          ['SCHADEN', `${cfg.damage}`],
          ['SPEED',   `${cfg.speed}`],
          ['CR',      `${cfg.creditValue}`],
        ].map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(106,112,72,0.5)', fontSize: 9, letterSpacing: '0.15em' }}>{k}</div>
            <div style={{ color: 'rgba(220,216,200,0.85)', fontSize: 14, fontWeight: 'bold' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Controls tab ──────────────────────────────────────────────────────────────

const CONTROLS: Array<[string, string]> = [
  ['WASD',           'Bewegen'],
  ['MAUS',           'Zielen'],
  ['LINKSKLICK',     'Schießen'],
  ['LEERTASTE',      'Schießen (Alternative)'],
  ['SHIFT',          'Bullet Time aktivieren'],
  ['SPACE (kurz)',   'Dive – schnelles Ausweichen'],
  ['Q / E',          'Bullet Ballet – Spin-Angriff (nur mit Akimbo)'],
  ['G',              'Gun Kata – Auto-Aim-Angriff (Mutator aktivieren)'],
  ['Slot 7',         'Granate werfen'],
  ['R',              'Nachladen'],
  ['1 – 0',          'Waffenslot wählen'],
  ['F',              'Kamera wechseln (Topdown → Iso → Ego)'],
  ['PFEIL / GAMEPAD','Spieler 2 steuern'],
]

function ControlsTab() {
  return (
    <div style={{ padding: '28px 40px', maxWidth: 600 }}>
      <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, color: '#e05418', fontSize: 20, letterSpacing: '0.2em', marginBottom: 24 }}>
        STEUERUNG
      </div>
      {CONTROLS.map(([key, action]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 11 }}>
          <div style={{
            background: 'rgba(10,12,7,0.9)', border: '1px solid rgba(224,84,24,0.3)',
            color: '#e05418', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
            padding: '3px 10px', borderRadius: 2, minWidth: 130, flexShrink: 0,
            textAlign: 'center',
          }}>
            {key}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(200,196,176,0.65)', fontSize: 12 }}>{action}</div>
        </div>
      ))}
    </div>
  )
}

// ── Tips tab ──────────────────────────────────────────────────────────────────

const TIPS: Array<{ title: string; body: string; color: string }> = [
  { color: '#00aaff', title: 'Bullet Time klug einsetzen',  body: 'Shift aktiviert Bullet Time. Der Fokusbalken leert sich schnell — spare ihn für dichte Wellen oder Boss-Gegner. Fokus-Pickups (lila Kugeln) aufladen.' },
  { color: '#ff8800', title: 'Dive durch Feuer',           body: 'Kurzes Space-Drücken löst einen Dive aus. Du bist während des Dives unverwundbar — nutze das um durch Feuerzonen zu tauchen.' },
  { color: '#00ff66', title: 'Munition verwalten',         body: 'Die Pistole hat unbegrenzte Munition — schieß nicht blindlings mit Spezialwaffen. Nachladen (R) rechtzeitig bevor das Magazin leer ist.' },
  { color: '#ffdd00', title: 'Shop-Strategie',             body: 'Credits sammeln und im Shop investieren. Rüstung (Palantir Suit) kostet 1500 CR aber gibt dir 100 Rüstungspunkte — fast unverwundbar!' },
  { color: '#ff4400', title: 'Kill-Streak nutzen',         body: 'Mehrere Kills hintereinander erhöhen den Score-Multiplikator. Im Bullet Time kannst du Streaks leichter aufrechterhalten.' },
  { color: '#aa66ff', title: 'Quad Damage aufheben',       body: 'Quad Damage (oranger Leuchtkugel) vervierfacht deinen Schaden für 90s. Im Idealfall aktiviere es direkt vor einer schweren Welle.' },
  { color: '#ff0066', title: 'Berserker-Modus',           body: 'Im Berserker-Modus (pink) bist du unverwundbar und schneller. Ideal zum Durchbrechen von Juggernaut-Gruppen.' },
  { color: '#4488ff', title: 'Akimbo freischalten',        body: 'Mit 250 CR Akimbo kaufen (Pistole oder SMG). Doppelte Feuerrate — kombiniert mit Bullet Time kaum zu stoppen.' },
]

function TipsTab() {
  return (
    <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 720 }}>
      {TIPS.map(({ title, body, color }) => (
        <div key={title} style={{
          background: 'rgba(10,12,7,0.85)', border: `1px solid ${color}44`,
          borderRadius: 4, padding: '14px 16px',
          boxShadow: `0 0 12px ${color}18`,
        }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color, fontSize: 11, letterSpacing: '0.1em', marginBottom: 8 }}>{title}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(200,196,176,0.55)', fontSize: 11, lineHeight: 1.65 }}>{body}</div>
        </div>
      ))}
    </div>
  )
}

// ── Editor tab ────────────────────────────────────────────────────────────────

const EDITOR_SECTIONS: Array<{ title: string; color: string; items: Array<[string, string]> }> = [
  {
    title: 'Objekte platzieren', color: '#00aaff',
    items: [
      ['Mauer', 'Hohes, solides Hindernis. Breite (SX) anpassen für Korridore und Räume.'],
      ['Säule', 'Runde Säule als Deckung. Radius durch SX/SZ skalieren.'],
      ['Deckung', 'Niedriges Hindernis (~0.9m) — Feinde schießen darüber, aber du kannst dich dahinter ducken.'],
      ['Kiste', 'Quadratische 1m-Kiste. Ideal für Lager und enge Gassen.'],
      ['Spawn', 'Markiert Spieler- und Feind-Spawn-Punkt. Mindestens einen setzen!'],
    ],
  },
  {
    title: 'Skript-Entities', color: '#ffcc00',
    items: [
      ['Trigger', 'Unsichtbare Zone — wenn der Spieler eintritt, löst sie Aktionen aus. OneShot = einmalig.'],
      ['Tür', 'Animierte Schiebetür. Kann mit Schlüssel gesperrt werden (KeyId eingeben).'],
      ['Schlüssel', 'Pickup-Item das Türen öffnet. KeyId muss mit der Tür übereinstimmen.'],
      ['Todeszone', 'Schadet oder tötet sofort. Für Lava, Abgründe, elektrifizierte Böden.'],
      ['Emitter', 'Partikelquelle (Funken, Explosionen, Blut) — an/aus per Trigger steuerbar.'],
      ['Kamera', 'Kamera-Pan-Punkt. Per Trigger aktivieren für Cutscene-artige Effekte.'],
      ['Portal', 'Teleportiert den Spieler sofort in ein anderes Level (targetLevelId setzen).'],
      ['Fahrstuhl', 'Platform die sich bewegt und dann ein neues Level lädt. Richtung (↑/↓) und Dauer einstellbar.'],
    ],
  },
  {
    title: 'Steuerung im Editor', color: '#00ff88',
    items: [
      ['Klick (Platzieren-Modus)', 'Neues Objekt am Mauszeiger setzen.'],
      ['Klick (Auswahl-Modus)', 'Objekt auswählen → Eigenschaften rechts bearbeiten.'],
      ['Ziehen', 'Ausgewähltes Objekt verschieben.'],
      ['R-Taste', 'Rotation um 45° — für Wände und Türen.'],
      ['Entf', 'Ausgewähltes Objekt löschen.'],
      ['↓ Export', 'Level als JSON-Datei speichern.'],
      ['↑ Import', 'JSON-Datei wieder laden.'],
      ['▶ Testen', 'Level direkt im Spiel ausprobieren.'],
    ],
  },
  {
    title: 'Level-Optionen', color: '#ff8800',
    items: [
      ['Kartengröße', 'Schieberegler 36×36 bis 120×120. Größere Karten brauchen mehr Objekte für Struktur!'],
      ['Gravitation', 'Normal / Mond (Granaten fliegen weiter) / Schwer (breitere Explosionen).'],
      ['Nebel des Krieges', 'Aktiviert einen Sichtradius um den Spieler — Gegner außerhalb sind unsichtbar.'],
      ['Vorlagen', 'Vorgefertigte Level zum Starten oder als Referenz importieren.'],
    ],
  },
  {
    title: 'Tipps & Tricks', color: '#cc44ff',
    items: [
      ['Spawns außen', 'Feind-Spawns an den Kartenrändern platzieren, Spieler-Spawn in der Mitte.'],
      ['Fahrstuhl-Kette', 'Mehrere Level mit Fahrstühlen verknüpfen um mehrstöckige Karten zu bauen.'],
      ['Trigger + Tür', 'Trigger-Zone direkt vor einer Tür mit Aktion "open_door" verknüpfen.'],
      ['Fog of War', 'Mit Fog of War und vielen Hindernissen entsteht ein echtes Horror-/Dungeon-Feeling.'],
      ['Textur wählen', 'Im Eigenschaften-Panel jede Textur pro Objekt separat setzen (Metall, Beton, etc.).'],
    ],
  },
]

function EditorTab() {
  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {EDITOR_SECTIONS.map(({ title, color, items }) => (
        <div key={title}>
          <div style={{ color, fontSize: 12, fontWeight: 'bold', letterSpacing: 3, marginBottom: 10, textShadow: `0 0 8px ${color}66` }}>
            {title.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {items.map(([name, desc]) => (
              <div key={name} style={{ display: 'flex', gap: 12, background: 'rgba(10,12,7,0.85)', border: `1px solid ${color}22`, borderRadius: 4, padding: '8px 12px' }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", color, fontSize: 9, letterSpacing: '0.1em', minWidth: 120, flexShrink: 0 }}>{name}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(200,196,176,0.5)', fontSize: 10, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Specials tab ─────────────────────────────────────────────────────────────

const SPECIALS_KEYFRAMES = `
  @keyframes coSlowPulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
  @keyframes coRollRight { 0%{transform:translateX(-28px)rotate(0deg);opacity:0} 20%{opacity:1} 100%{transform:translateX(28px)rotate(720deg);opacity:0} }
  @keyframes coExpandFade { 0%{transform:scale(0.2);opacity:1} 100%{transform:scale(2.4);opacity:0} }
  @keyframes coRotateSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes coThrowArc { 0%{transform:translate(-24px,6px)rotate(-30deg);opacity:0} 15%{opacity:1} 60%{transform:translate(12px,-18px)rotate(20deg)} 100%{transform:translate(28px,6px)rotate(110deg);opacity:0} }
  @keyframes coTargetSnap { 0%{opacity:0;transform:scale(2)} 25%{opacity:1;transform:scale(1)} 70%{opacity:1} 100%{opacity:0;transform:scale(0.7)} }
`

interface SpecialsCardProps { title: string; keys: string[]; desc: string; color: string; animation: React.ReactNode }
function SpecialsCard({ title, keys, desc, color, animation }: SpecialsCardProps) {
  return (
    <div style={{ background: 'rgba(10,12,7,0.85)', border: `1px solid ${color}33`, borderRadius: 4, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, color, fontSize: 16, letterSpacing: '0.12em' }}>{title}</div>
      <div style={{ display: 'flex', gap: 5 }}>
        {keys.map((k) => (
          <div key={k} style={{ background: `${color}18`, border: `1px solid ${color}55`, color, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 2 }}>{k}</div>
        ))}
      </div>
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {animation}
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(200,196,176,0.55)', fontSize: 11, lineHeight: 1.55 }}>{desc}</div>
    </div>
  )
}

function SpecialsTab() {
  return (
    <div style={{ padding: '20px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, overflowY: 'auto', paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 20px))' }}>
      <style>{SPECIALS_KEYFRAMES}</style>

      <SpecialsCard title="BULLET TIME" keys={['SHIFT']} color="#aa66ff"
        desc="Verlangsamt die Zeit dramatisch. Verbraucht Fokus — spare ihn für kritische Momente."
        animation={
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            {[0,1,2].map((i) => (
              <div key={i} style={{ position: 'absolute', inset: 0, margin: 'auto', width: 44 - i*8, height: 44 - i*8, borderRadius: '50%', border: `2px solid rgba(170,102,255,${0.9 - i*0.25})`, animation: `coSlowPulse ${1.4 + i*0.35}s ease-in-out ${i*0.2}s infinite` }} />
            ))}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aa66ff', fontFamily: "'Share Tech Mono', monospace", fontSize: 11 }}>0.3×</div>
          </div>
        }
      />

      <SpecialsCard title="DIVE ROLL" keys={['SPACE']} color="#44aaff"
        desc="Blitzschnelles Ausweichen in Bewegungsrichtung. Während des Rolls unverwundbar."
        animation={
          <div style={{ width: 80, height: 40, position: 'relative' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#44aaff', boxShadow: '0 0 8px rgba(68,170,255,0.6)', position: 'absolute', top: 11, animation: 'coRollRight 1.3s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, borderBottom: '1px dashed rgba(68,170,255,0.25)' }} />
          </div>
        }
      />

      <SpecialsCard title="GUN KATA" keys={['G']} color="#e05418"
        desc="Auto-Aim auf nahegelegene Feinde. Nur aktiv wenn Mutator eingeschaltet. Verbraucht Fokus."
        animation={
          <div style={{ position: 'relative', width: 80, height: 60 }}>
            {[[-22,-12],[22,-12],[0,20]].map(([dx,dy], i) => (
              <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))` }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#cc2222', boxShadow: '0 0 5px #ff0000', animation: `coTargetSnap 1.8s ease ${i*0.45}s infinite` }} />
              </div>
            ))}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 13, height: 13, borderRadius: '50%', background: '#e05418', boxShadow: '0 0 10px rgba(224,84,24,0.8)' }} />
          </div>
        }
      />

      <SpecialsCard title="VERNICHTER" keys={['V']} color="#ff4400"
        desc="Massive Flächenexplosion. Begrenzte Ladungen — im Shop unter Ausrüstung nachkaufen."
        animation={
          <div style={{ position: 'relative', width: 70, height: 70 }}>
            {[0,1,2].map((i) => (
              <div key={i} style={{ position: 'absolute', inset: 0, margin: 'auto', width: 20, height: 20, borderRadius: '50%', border: `2px solid rgba(255,${68+i*50},0,${1-i*0.25})`, animation: `coExpandFade 1.0s ease-out ${i*0.28}s infinite` }} />
            ))}
            <div style={{ position: 'absolute', inset: 0, margin: 'auto', width: 10, height: 10, borderRadius: '50%', background: '#ff4400', boxShadow: '0 0 14px #ff8800' }} />
          </div>
        }
      />

      <SpecialsCard title="GRANATE" keys={['Slot 7']} color="#ffcc00"
        desc="Wirft eine Granate auf den Mauszeiger. Verweilt kurz dann explodiert sie — ideal für Gruppen."
        animation={
          <div style={{ position: 'relative', width: 80, height: 50 }}>
            <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#ffcc00', boxShadow: '0 0 8px #ffaa00', position: 'absolute', top: 18, animation: 'coThrowArc 1.6s ease-in-out infinite' }} />
          </div>
        }
      />

      <SpecialsCard title="SPIN ATTACK" keys={['Q', 'E']} color="#44ffcc"
        desc="Bullet Ballet — Spin-Angriff der in alle Richtungen schießt. Nur mit Akimbo verfügbar."
        animation={
          <div style={{ position: 'relative', width: 60, height: 60, animation: 'coRotateSpin 1.1s linear infinite' }}>
            {[0,45,90,135,180,225,270,315].map((deg) => (
              <div key={deg} style={{ position: 'absolute', left: '50%', top: '50%', width: 5, height: 5, borderRadius: '50%', background: '#44ffcc', transform: `rotate(${deg}deg) translateY(-24px)`, transformOrigin: '0 0', opacity: 0.7 }} />
            ))}
            <div style={{ position: 'absolute', inset: 0, margin: 'auto', width: 10, height: 10, borderRadius: '50%', background: '#44ffcc', boxShadow: '0 0 8px #44ffcc' }} />
          </div>
        }
      />
    </div>
  )
}

// ── Item grid card ────────────────────────────────────────────────────────────

function GridCard({ label, color, selected, onClick }: { label: string; color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: 80, padding: '8px 4px',
        background: selected ? `${color}18` : 'rgba(10,12,7,0.85)',
        border: `1px solid ${selected ? color : 'rgba(138,154,98,0.15)'}`,
        borderRadius: 2, cursor: 'pointer',
        color: selected ? color : 'rgba(138,154,98,0.45)',
        fontSize: 9, letterSpacing: '0.12em',
        fontFamily: "'Share Tech Mono', monospace",
        textTransform: 'uppercase',
        transition: 'all 0.12s',
        boxShadow: selected ? `0 0 8px ${color}44` : 'none',
        textAlign: 'center',
        lineHeight: 1.3,
        wordBreak: 'break-all',
      }}
    >
      {label}
    </button>
  )
}

// ── Main HelpScreen ───────────────────────────────────────────────────────────

export function HelpScreen() {
  const setPhase = useGameStore((s) => s.setPhase)

  const [tab, setTab]                   = useState<Tab>('waffen')
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponId>('pistol')
  const [selectedPickup, setSelectedPickup] = useState<PickupKind>('ammo')
  const [selectedChar, setSelectedChar]   = useState<CharId>('player')

  const showModel = tab !== 'steuerung' && tab !== 'tipps' && tab !== 'editor' && tab !== 'specials'

  const modelParts: PartDef[] = (() => {
    if (tab === 'waffen')     return WEAPON_PARTS[selectedWeapon]
    if (tab === 'pickups')    return PICKUP_PARTS[selectedPickup]
    if (tab === 'charaktere') return charParts(selectedChar)
    return LOGO_PARTS
  })()

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'waffen',     label: 'WAFFEN'    },
    { id: 'pickups',    label: 'PICKUPS'   },
    { id: 'charaktere', label: 'CHARAKTERE'},
    { id: 'steuerung',  label: 'STEUERUNG' },
    { id: 'specials',   label: 'SPECIALS'  },
    { id: 'tipps',      label: 'TIPPS'     },
    { id: 'editor',     label: 'EDITOR'    },
  ]

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      fontFamily: "'Share Tech Mono', monospace",
      userSelect: 'none',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(224,84,24,0.8), transparent)', pointerEvents: 'none' }} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px',
        paddingTop: 'max(12px, calc(env(safe-area-inset-top, 0px) + 12px))',
        paddingLeft: 'max(20px, calc(env(safe-area-inset-left, 0px) + 20px))',
        borderBottom: '1px solid rgba(138,154,98,0.12)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setPhase('title_screen')}
          style={{
            background: 'transparent', border: '1px solid rgba(138,154,98,0.2)', color: 'rgba(138,154,98,0.5)',
            fontSize: 9, letterSpacing: '0.2em', padding: '6px 12px', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', transition: 'all 0.12s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e05418'; e.currentTarget.style.borderColor = 'rgba(224,84,24,0.5)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(138,154,98,0.5)'; e.currentTarget.style.borderColor = 'rgba(138,154,98,0.2)' }}
        >
          ← ZURÜCK
        </button>

        <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, color: '#e05418', fontSize: 18, letterSpacing: '0.25em', textShadow: '0 0 14px rgba(224,84,24,0.4)' }}>
          HILFE
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 3, overflowX: 'auto', flexShrink: 1, WebkitOverflowScrolling: 'touch' as never, marginLeft: 8 }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                background: tab === id ? 'rgba(224,84,24,0.12)' : 'transparent',
                border: `1px solid ${tab === id ? 'rgba(224,84,24,0.7)' : 'rgba(138,154,98,0.2)'}`,
                color: tab === id ? '#e05418' : 'rgba(138,154,98,0.5)',
                fontSize: 9, letterSpacing: '0.2em', padding: '5px 10px', cursor: 'pointer',
                fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', transition: 'all 0.12s',
                boxShadow: tab === id ? '0 0 6px rgba(224,84,24,0.3)' : 'none',
                borderRadius: 2,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Full-screen non-3D tabs ─────────────────────────────────────── */}
      {tab === 'steuerung' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ControlsTab />
        </div>
      )}
      {tab === 'tipps' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <TipsTab />
        </div>
      )}
      {tab === 'editor' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <EditorTab />
        </div>
      )}
      {tab === 'specials' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <SpecialsTab />
        </div>
      )}

      {/* ── 3D tabs layout ─────────────────────────────────────────────── */}
      {showModel && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

          {/* Main content row */}
          <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', minHeight: 0 }}>

            {/* Left: 3D viewer */}
            <div style={{
              width: 300, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(6,8,4,0.6)',
              borderRight: '1px solid rgba(138,154,98,0.1)',
            }}>
              <div style={{
                width: 280, height: 280,
                border: '1px solid rgba(138,154,98,0.15)',
                borderRadius: 4,
                overflow: 'hidden',
                background: 'radial-gradient(ellipse at center, rgba(20,26,14,0.9) 0%, rgba(6,8,4,1) 100%)',
                boxShadow: '0 0 24px rgba(224,84,24,0.08) inset',
              }}>
                <ModelViewer parts={modelParts} />
              </div>
            </div>

            {/* Right: info panel */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
              {tab === 'waffen'     && <WeaponInfo id={selectedWeapon} />}
              {tab === 'pickups'    && <PickupInfo id={selectedPickup} />}
              {tab === 'charaktere' && <CharInfo   id={selectedChar}  />}
            </div>
          </div>

          {/* Bottom: item grid */}
          <div style={{
            borderTop: '1px solid rgba(138,154,98,0.1)',
            padding: '10px 16px',
            paddingBottom: 'max(12px, calc(env(safe-area-inset-bottom, 0px) + 12px))',
            background: 'rgba(6,8,4,0.9)',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', gap: 6,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch' as never,
              paddingBottom: 2,
            }}>
              {tab === 'waffen' && ALL_WEAPONS.map((id) => (
                <GridCard
                  key={id}
                  label={WEAPON_CONFIGS[id].shortName}
                  color="#e05418"
                  selected={selectedWeapon === id}
                  onClick={() => setSelectedWeapon(id)}
                />
              ))}
              {tab === 'pickups' && ALL_PICKUPS.map(({ id, name, color }) => (
                <GridCard
                  key={id}
                  label={name}
                  color={color}
                  selected={selectedPickup === id}
                  onClick={() => setSelectedPickup(id)}
                />
              ))}
              {tab === 'charaktere' && ALL_CHARS.map(({ id, name }) => {
                const color = id === 'player' ? '#00ff88' : ENEMY_CONFIGS[id as EnemyType].color
                return (
                  <GridCard
                    key={id}
                    label={name}
                    color={color}
                    selected={selectedChar === id}
                    onClick={() => setSelectedChar(id)}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
