import type { Level, LevelObject } from '../editor/editorStore'

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

export const BUILT_IN_MAPS: Level[] = [COLOSSEUM, WAREHOUSE, ATOMIC_TEST_GROUND]
