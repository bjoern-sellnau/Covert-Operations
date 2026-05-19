import type { Level, LevelObject } from '../editor/editorStore'
import type { ScriptEntity } from '../editor/scriptTypes'

let _seq = 9000000
const id = () => `blt-${_seq++}`

function wall(x: number, z: number, sx: number, sz: number, rotY = 0): LevelObject {
  return { id: id(), type: 'wall', x, z, rotY, sx, sz }
}
function pillar(x: number, z: number, sx = 1.2): LevelObject {
  return { id: id(), type: 'pillar', x, z, rotY: 0, sx, sz: sx }
}
function cover(x: number, z: number, sx = 2, sz = 1.5, rotY = 0): LevelObject {
  return { id: id(), type: 'cover', x, z, rotY, sx, sz }
}
function crate(x: number, z: number): LevelObject {
  return { id: id(), type: 'crate', x, z, rotY: 0, sx: 1, sz: 1 }
}
function spawn(x: number, z: number): LevelObject {
  return { id: id(), type: 'spawn', x, z, rotY: 0, sx: 1, sz: 1 }
}

// ── COLOSSEUM ──────────────────────────────────────────────────────────────
const COLOSSEUM_OBJECTS: LevelObject[] = [
  // Outer ring: 12 pillars at r=15
  ...Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    return pillar(Math.cos(a) * 15, Math.sin(a) * 15, 2.5)
  }),
  // Inner ring: 8 pillars at r=7
  ...Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2
    return pillar(Math.cos(a) * 7, Math.sin(a) * 7, 1.5)
  }),
  // Cardinal cover pieces between inner and outer
  cover(0, 11, 3, 1.5),
  cover(0, -11, 3, 1.5),
  cover(11, 0, 1.5, 3),
  cover(-11, 0, 1.5, 3),
  // Spawns (8 around inner ring, 1 center)
  spawn(0, 0),
  ...Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2
    return spawn(Math.cos(a) * 11, Math.sin(a) * 11)
  }),
]

export const COLOSSEUM: Level = {
  id: 'builtin-colosseum',
  name: 'Colosseum',
  objects: COLOSSEUM_OBJECTS,
  scriptEntities: [],
  fogOfWar: false,
  gravity: 'normal',
  arenaHalf: 20,
  gameModes: [],
}

// ── WAREHOUSE ─────────────────────────────────────────────────────────────
const WAREHOUSE_OBJECTS: LevelObject[] = [
  // Left aisle divider: 2 wall segments with gap in center
  wall(-7, -8, 1, 7),
  wall(-7,  8, 1, 7),
  // Right aisle divider: 2 wall segments with gap in center
  wall(7, -8, 1, 7),
  wall(7,  8, 1, 7),
  // North bay end wall with corridor gaps
  wall(-12, -17, 9, 1),
  wall(12,  -17, 9, 1),
  // South bay end wall with corridor gaps
  wall(-12, 17, 9, 1),
  wall(12,  17, 9, 1),
  // Crate rows along left aisle
  crate(-12, -12), crate(-12, -10), crate(-12, -8),
  crate(-12,  8),  crate(-12, 10),  crate(-12, 12),
  // Crate rows along right aisle
  crate(12, -12), crate(12, -10), crate(12, -8),
  crate(12,  8),  crate(12,  10),  crate(12, 12),
  // Central cluster
  crate(-2, -2), crate(0, -2), crate(2, -2),
  crate(-2,  2), crate(0,  2), crate(2,  2),
  // Cover at aisle junctions
  cover(-7, 0, 2, 1.5),
  cover(7,  0, 2, 1.5),
  // Spawns
  spawn(0, 0),
  spawn(-14, 0), spawn(14, 0),
  spawn(0, -14), spawn(0, 14),
  spawn(-14, -14), spawn(-14, 14),
  spawn(14, -14), spawn(14, 14),
]

export const WAREHOUSE: Level = {
  id: 'builtin-warehouse',
  name: 'Warehouse',
  objects: WAREHOUSE_OBJECTS,
  scriptEntities: [],
  fogOfWar: false,
  gravity: 'normal',
  arenaHalf: 20,
  gameModes: [],
}

// ── ATOMIC TEST GROUND ────────────────────────────────────────────────────
const PI4 = Math.PI / 4

const ATOMIC_OBJECTS: LevelObject[] = [
  // 4 L-shaped corner bunkers
  // NW corner
  wall(-16, -18, 6, 1),
  wall(-19, -15, 1, 6),
  // NE corner
  wall(16, -18, 6, 1),
  wall(19, -15, 1, 6),
  // SW corner
  wall(-16, 18, 6, 1),
  wall(-19, 15, 1, 6),
  // SE corner
  wall(16, 18, 6, 1),
  wall(19, 15, 1, 6),

  // Central blast ring: 4 cover + 4 diagonal
  cover(0, -5, 3, 1.5),
  cover(0,  5, 3, 1.5),
  cover(-5, 0, 1.5, 3),
  cover(5,  0, 1.5, 3),
  cover(-3.5, -3.5, 2, 1.5, PI4),
  cover(3.5,  -3.5, 2, 1.5, -PI4),
  cover(-3.5,  3.5, 2, 1.5, -PI4),
  cover(3.5,   3.5, 2, 1.5, PI4),

  // Mid-field diagonal walls
  wall(-11, -11, 1, 6, PI4),
  wall(11,  -11, 1, 6, -PI4),
  wall(-11,  11, 1, 6, -PI4),
  wall(11,   11, 1, 6, PI4),

  // Debris crates
  crate(-9, 0), crate(9, 0),
  crate(0, -9), crate(0, 9),
  crate(-13, 0), crate(13, 0),

  // Spawns
  spawn(0, 0),
  spawn(-15, 0), spawn(15, 0),
  spawn(0, -15), spawn(0, 15),
  spawn(-15, -15), spawn(-15, 15),
  spawn(15, -15), spawn(15, 15),
  spawn(-10, -10), spawn(10, 10),
]

export const ATOMIC_TEST_GROUND: Level = {
  id: 'builtin-atomic',
  name: 'Atomic Test Ground',
  objects: ATOMIC_OBJECTS,
  scriptEntities: [],
  fogOfWar: false,
  gravity: 'normal',
  arenaHalf: 22,
  gameModes: [],
}

// ── AKTION SCHLOSS ────────────────────────────────────────────────────────────
// Three-zone bunker. Open two doors to reach the north room, find the red key,
// then unlock the vault. All doors open/close with E.
//
//   z=-16  ┌─── TRESOR (gesperrt, roter Schlüssel) ───┐
//   z=-12  ├─────────── Tresortür ────────────────────┤
//          │   Nordraum (roter Schlüssel liegt hier)  │
//   z= -4  ├─────────── Innentor ────────────────────┤
//          │   Mittelzone (cover, crates)             │
//   z=  4  ├─────────── Haupttor ────────────────────┤
//          │   Eingang (Spawns)                       │
//   z= 14  │                 S                        │
//
const _SCHLOSS_KEY = 'schloss-vault-key'

const SCHLOSS_SCRIPT: ScriptEntity[] = [
  { id: 'schloss-d-main',  type: 'door', x:  0, z:  4, angle: 0, w: 6, label: 'Haupttor',           keyId: '',           startOpen: false },
  { id: 'schloss-d-inner', type: 'door', x:  5, z: -4, angle: 0, w: 6, label: 'Innentor',           keyId: '',           startOpen: false },
  { id: 'schloss-d-vault', type: 'door', x:  0, z:-12, angle: 0, w: 6, label: 'TRESOR',             keyId: _SCHLOSS_KEY, startOpen: false },
  { id: 'schloss-key',     type: 'key',  x: 10, z: -8, keyId: _SCHLOSS_KEY, color: '#ff3300', label: 'Tresor-Schlüssel' },
]

export const AKTION_SCHLOSS: Level = {
  id: 'builtin-aktion-schloss',
  name: 'Aktion Schloss',
  objects: [
    // ── Gate wall (z=4) — door gap x=-3…+3
    wall(-10,   4, 14, 0.5, 0), wall( 10,  4, 14, 0.5, 0),
    // ── Inner wall (z=-4) — door gap x=2…+8
    wall( -7.5, -4, 15, 0.5, 0), wall(12.5, -4,  9, 0.5, 0),
    // ── Vault wall (z=-12) — door gap x=-3…+3
    wall(-10,  -12, 14, 0.5, 0), wall( 10, -12, 14, 0.5, 0),
    // ── Alcove side walls (middle zone narrowing)
    wall(-14,   -8, 0.5, 8, 0), wall( 14,  -8, 0.5, 8, 0),
    // ── Cover — Eingang
    cover(-8, 10, 3, 1.2), cover(8, 10, 3, 1.2),
    crate(-3, 8), crate(3, 8),
    // ── Cover — Mittelzone
    cover(-8,  0, 1, 4), cover(0, 0, 3, 1),
    crate(-5, -2), crate(8, -1),
    pillar(-12, 0, 0.9), pillar(12, 0, 0.9),
    // ── Cover — Nordraum
    cover(-10, -8, 3, 1), cover(4, -7, 4, 1),
    crate(-5, -9), pillar(12, -8, 0.8),
    // ── Vault interior
    crate(-6, -15), crate(6, -15), pillar(0, -15, 1.4),
    // ── Spawns
    spawn(0, 14), spawn(-6, 12), spawn(6, 12),
  ],
  scriptEntities: SCHLOSS_SCRIPT,
  fogOfWar: false,
  gravity: 'normal',
  arenaHalf: 18,
  gameModes: [],
}

export const BUILT_IN_MAPS: Level[] = [COLOSSEUM, WAREHOUSE, ATOMIC_TEST_GROUND, AKTION_SCHLOSS]
