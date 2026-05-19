import type { Level, LevelObject, GravityMode } from './editorStore'
import type { ScriptEntity } from './scriptTypes'

let _seq = 9000000
const id = () => `preset-${_seq++}`

const wall  = (x: number, z: number, sx: number, sz: number, rotY = 0, tex?: string): LevelObject =>
  ({ id: id(), type: 'wall',   x, z, sx, sz, rotY, textureKey: tex })
const pillar = (x: number, z: number, d = 0.8): LevelObject =>
  ({ id: id(), type: 'pillar', x, z, sx: d, sz: d, rotY: 0 })
const cover  = (x: number, z: number, sx = 2, sz = 1.5): LevelObject =>
  ({ id: id(), type: 'cover',  x, z, sx, sz, rotY: 0 })
const crate  = (x: number, z: number): LevelObject =>
  ({ id: id(), type: 'crate',  x, z, sx: 1, sz: 1, rotY: 0 })
const spawn  = (x: number, z: number): LevelObject =>
  ({ id: id(), type: 'spawn',  x, z, sx: 1, sz: 1, rotY: 0 })

function make(name: string, objects: LevelObject[], gravity: GravityMode = 'normal'): Level {
  return { id: `preset-lvl-${_seq++}`, name, objects, scriptEntities: [], fogOfWar: false, gravity, arenaHalf: 18, gameModes: [] }
}

// ── Schießstand ───────────────────────────────────────────────────────────────
// Four shooting lanes running N-S, barriers at increasing depths
function schiessstand(): Level {
  const objs: LevelObject[] = []

  // Dividing walls (N-S, full length)
  for (const x of [-6, 0, 6]) {
    objs.push(wall(x, 0, 0.5, 28, 0, 'concrete_worn'))
  }

  // Barrier rows (E-W cover lines, broken by gaps)
  const barrierZ = [-10, -4, 4]
  for (const z of barrierZ) {
    objs.push(wall(-12, z, 5, 0.5, 0, 'concrete'))
    objs.push(wall(-3,  z, 5, 0.5, 0, 'concrete'))
    objs.push(wall(3,   z, 5, 0.5, 0, 'concrete'))
    objs.push(wall(12,  z, 5, 0.5, 0, 'concrete'))
  }

  // Side crates
  for (const z of [-13, -7, 0, 7]) {
    objs.push(crate(-16, z))
    objs.push(crate(16,  z))
  }

  // Player spawn
  objs.push(spawn(0, 13))

  return make('Schießstand', objs)
}

// ── Fabrik ────────────────────────────────────────────────────────────────────
function fabrik(): Level {
  const objs: LevelObject[] = []

  // Large machinery blocks in corners
  for (const [sx, sz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) {
    objs.push(wall(sx, sz, 5, 5, 0, 'metal'))
  }

  // Conveyor corridor walls (N-S twin tracks)
  for (const x of [-5, -4, 4, 5]) {
    objs.push(wall(x, 0, 0.4, 16, 0, 'metal_grid'))
  }

  // Cross corridor (E-W)
  for (const z of [-1, 1]) {
    objs.push(wall(0, z, 6, 0.4, 0, 'metal_grid'))
  }

  // Scattered crates
  for (const [cx, cz] of [[-8, 0], [8, 0], [0, -8], [0, 8], [-8, 6], [8, -6]]) {
    objs.push(crate(cx, cz))
  }

  // Pillars along conveyor
  for (const z of [-7, -3, 3, 7]) {
    objs.push(pillar(-4.5, z, 0.6))
    objs.push(pillar(4.5,  z, 0.6))
  }

  objs.push(spawn(0, 0))
  return make('Fabrik', objs)
}

// ── Mondstation ───────────────────────────────────────────────────────────────
// Open ring of craters + central cover; moon gravity
function mondstation(): Level {
  const objs: LevelObject[] = []

  // Ring of crater pillars
  const R = 11
  const COUNT = 10
  for (let i = 0; i < COUNT; i++) {
    const ang = (i / COUNT) * Math.PI * 2
    const cx = Math.round(Math.cos(ang) * R)
    const cz = Math.round(Math.sin(ang) * R)
    objs.push(pillar(cx, cz, 1.4 + Math.sin(i * 1.3) * 0.4))
  }

  // Inner ring (smaller craters)
  const R2 = 6
  const C2 = 6
  for (let i = 0; i < C2; i++) {
    const ang = (i / C2) * Math.PI * 2 + 0.3
    objs.push(pillar(Math.round(Math.cos(ang) * R2), Math.round(Math.sin(ang) * R2), 0.7))
  }

  // Central bunker
  objs.push(cover(-2, 0, 3, 1))
  objs.push(cover(2, 0, 3, 1))
  objs.push(cover(0, -2, 1, 3))
  objs.push(cover(0, 2, 1, 3))

  objs.push(spawn(0, 0))
  return make('Mondstation', objs, 'moon')
}

// ── Raumstation ───────────────────────────────────────────────────────────────
// Cross-shaped corridors, corner rooms
function raumstation(): Level {
  const objs: LevelObject[] = []

  // Horizontal corridor walls (2 units wide)
  objs.push(wall(0, -3.5, 22, 0.5, 0, 'metal'))
  objs.push(wall(0,  3.5, 22, 0.5, 0, 'metal'))

  // Vertical corridor walls
  objs.push(wall(-3.5, 0, 0.5, 22, 0, 'metal'))
  objs.push(wall( 3.5, 0, 0.5, 22, 0, 'metal'))

  // Corner room walls (close off diagonals)
  const corners: [number, number, number, number][] = [
    [-10, -10, 8, 0.5], [-10, -10, 0.5, 8],
    [ 10, -10, 8, 0.5], [ 10, -10, 0.5, 8],
    [-10,  10, 8, 0.5], [-10,  10, 0.5, 8],
    [ 10,  10, 8, 0.5], [ 10,  10, 0.5, 8],
  ]
  for (const [cx, cz, sx, sz] of corners) {
    objs.push(wall(cx, cz, sx, sz, 0, 'metal_grid'))
  }

  // Equipment in corner rooms
  for (const [cx, cz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) {
    objs.push(crate(cx, cz))
    objs.push(pillar(cx + Math.sign(cx) * (-2), cz + Math.sign(cz) * (-2), 0.6))
  }

  // Corridor cover
  for (const x of [-7, 7]) {
    objs.push(cover(x, 0, 0.5, 2))
  }
  for (const z of [-7, 7]) {
    objs.push(cover(0, z, 2, 0.5))
  }

  objs.push(spawn(0, 0))
  return make('Raumstation', objs)
}

// ── Schmiede ─────────────────────────────────────────────────────────────────
// Workshop chambers, central furnace
function schmiede(): Level {
  const objs: LevelObject[] = []

  // Central furnace (big pillar)
  objs.push(pillar(0, 0, 2.5))

  // Workshop benches (rows of cover + crates)
  for (const z of [-10, -5, 5, 10]) {
    objs.push(cover(-8, z, 4, 1.2, ))
    objs.push(cover(8,  z, 4, 1.2))
    objs.push(crate(-3, z))
    objs.push(crate(3,  z))
  }

  // Chamber dividing walls
  objs.push(wall(-5, -7.5, 0.5, 6,  0, 'stone_dark'))
  objs.push(wall( 5, -7.5, 0.5, 6,  0, 'stone_dark'))
  objs.push(wall(-5,  7.5, 0.5, 6,  0, 'stone_dark'))
  objs.push(wall( 5,  7.5, 0.5, 6,  0, 'stone_dark'))

  // Tool racks (short walls along sides)
  for (const z of [-13, 0, 13]) {
    objs.push(wall(-14, z, 0.5, 4, 0, 'metal'))
    objs.push(wall( 14, z, 0.5, 4, 0, 'metal'))
  }

  // Pillars at chamber entrances
  for (const [px, pz] of [[-5, 0], [5, 0], [0, -7], [0, 7]]) {
    objs.push(pillar(px, pz, 0.6))
  }

  objs.push(spawn(-12, 12))
  return make('Schmiede', objs)
}

// ── Aktion Schloss ────────────────────────────────────────────────────────────
// Three-zone bunker connected by doors. Vault in north requires a key found
// in the middle room. All doors open/close with E.
//
// Layout (top = north = z-negative):
//
//   z=-16  ┌─────[TRESOR gesperrt]─────┐
//          │  Vault: crates + objective  │
//   z=-12  └──────TRESOR-WAND──────────┘
//          │   Nordraum (Schlüssel!)     │
//   z=-4   └─────[Innentor]─────────────┘
//          │   Mittelzone (cover, crates)│
//   z=4    └──────[Haupttor]────────────┘
//          │   Eingang (spawn)           │
//   z=14   │            S               │
//
function aktion_schloss(): Level {
  const objs: LevelObject[]       = []
  const script: ScriptEntity[]    = []
  const VAULT_KEY                 = 'vault-key'

  // ── Script entities ──────────────────────────────────────────────────────
  // Haupttor (z=4, door gap x=-3…+3)
  script.push({ id: 'd-main',  type: 'door', x:  0, z:  4, angle: 0, w: 6, label: 'Haupttor',  keyId: '',         startOpen: false })
  // Innentor (z=-4, offset right: gap x=2…+8)
  script.push({ id: 'd-inner', type: 'door', x:  5, z: -4, angle: 0, w: 6, label: 'Innentor',  keyId: '',         startOpen: false })
  // Tresortür (z=-12, locked)
  script.push({ id: 'd-vault', type: 'door', x:  0, z:-12, angle: 0, w: 6, label: 'TRESOR',    keyId: VAULT_KEY,  startOpen: false })
  // Key inside north room
  script.push({ id: 'k-vault', type: 'key',  x: 10, z: -8, keyId: VAULT_KEY, color: '#ff3300', label: 'Tresor-Schlüssel' })

  // ── Horizontal walls ─────────────────────────────────────────────────────
  // Haupttor-Wand (z=4): door gap x=-3…+3 → walls cover x=-17…-3 and x=3…17
  objs.push(wall(-10, 4,  14, 0.5, 0, 'concrete'))
  objs.push(wall( 10, 4,  14, 0.5, 0, 'concrete'))

  // Innentor-Wand (z=-4): door gap x=2…+8 → walls cover x=-17…+2 and x=8…+17
  objs.push(wall( -7.5, -4, 15, 0.5, 0, 'concrete_worn'))
  objs.push(wall( 12.5, -4,  9, 0.5, 0, 'concrete_worn'))

  // Tresorwand (z=-12): door gap x=-3…+3
  objs.push(wall(-10, -12, 14, 0.5, 0, 'stone_dark'))
  objs.push(wall( 10, -12, 14, 0.5, 0, 'stone_dark'))

  // ── Side walls narrowing the middle zone ─────────────────────────────────
  // Left bunker alcove: x=-14, z=-4 to -12 (between inner and vault wall)
  objs.push(wall(-14,  -8, 0.5, 8, 0, 'concrete_worn'))
  // Right bunker alcove: x=14, z=-4 to -12
  objs.push(wall( 14,  -8, 0.5, 8, 0, 'concrete_worn'))

  // ── Cover — Eingang (south room) ─────────────────────────────────────────
  objs.push(cover(-8, 10, 3, 1.2))
  objs.push(cover( 8, 10, 3, 1.2))
  objs.push(crate(-3,  8))
  objs.push(crate( 3,  8))

  // ── Cover — Mittelzone ────────────────────────────────────────────────────
  objs.push(cover(-8,  0,  1, 4))       // left pillar-cover
  objs.push(cover( 0,  0,  3, 1))       // center cover
  objs.push(crate(-5, -2))
  objs.push(crate( 8, -1))
  objs.push(pillar(-12, 0, 0.9))
  objs.push(pillar( 12, 0, 0.9))

  // ── Cover — Nordraum ─────────────────────────────────────────────────────
  objs.push(cover(-10, -8, 3, 1))
  objs.push(cover(  4, -7, 4, 1))
  objs.push(crate( -5, -9))
  objs.push(pillar( 12, -8, 0.8))       // near key pickup

  // ── Vault interior ────────────────────────────────────────────────────────
  objs.push(crate(-6, -15))
  objs.push(crate( 6, -15))
  objs.push(pillar(0, -15, 1.4))        // central "objective" column

  // ── Spawns ────────────────────────────────────────────────────────────────
  objs.push(spawn( 0, 14))
  objs.push(spawn(-6, 12))
  objs.push(spawn( 6, 12))

  return {
    id: `preset-lvl-${_seq++}`,
    name: 'Aktion Schloss',
    objects: objs,
    scriptEntities: script,
    fogOfWar: false,
    gravity: 'normal',
    arenaHalf: 18,
    gameModes: [],
  }
}

export const PRESET_LEVELS: Level[] = [
  schiessstand(),
  fabrik(),
  mondstation(),
  raumstation(),
  schmiede(),
  aktion_schloss(),
]
