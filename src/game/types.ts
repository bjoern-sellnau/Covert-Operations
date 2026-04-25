export type GamePhase = 'menu' | 'lobby' | 'shop' | 'playing' | 'gameover' | 'editor' | 'skydive' | 'skydive_win'

export type EnemyType = 'basic' | 'fast' | 'tank' | 'berserker' | 'flanker' | 'juggernaut'
export type WeaponId = 'pistol' | 'smg' | 'shotgun' | 'rifle' | 'uzi' | 'mp5' | 'm16' | 'blaster' | 'plasma' | 'bazooka' | 'flak' | 'banana'
export type EquipmentId = 'backpack' | 'chest_pouch' | 'leg_pouch'
export type AmmoId = 'standard' | 'hollow_point' | 'ap'

// ── Enemy ──────────────────────────────────────────────────────────────────

export interface EnemyConfig {
  speed: number
  health: number
  size: number
  damage: number
  color: string
  emissive: string
  scoreValue: number
  creditValue: number
  segments: number
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  basic:      { speed: 2.5, health: 1,  size: 0.45, damage: 8,  color: '#cc2222', emissive: '#ff0000', scoreValue: 10,  creditValue: 5,  segments: 6  },
  fast:       { speed: 5.0, health: 1,  size: 0.3,  damage: 12, color: '#cc6600', emissive: '#ff8800', scoreValue: 25,  creditValue: 10, segments: 4  },
  tank:       { speed: 1.4, health: 4,  size: 0.75, damage: 20, color: '#6600cc', emissive: '#8800ff', scoreValue: 60,  creditValue: 25, segments: 8  },
  berserker:  { speed: 6.5, health: 2,  size: 0.35, damage: 22, color: '#cc0066', emissive: '#ff0044', scoreValue: 30,  creditValue: 12, segments: 5  },
  flanker:    { speed: 3.2, health: 1,  size: 0.40, damage: 14, color: '#cc8800', emissive: '#ffaa00', scoreValue: 20,  creditValue: 8,  segments: 6  },
  juggernaut: { speed: 1.1, health: 10, size: 1.00, damage: 40, color: '#334455', emissive: '#112233', scoreValue: 80,  creditValue: 30, segments: 10 },
}

// ── Weapons ────────────────────────────────────────────────────────────────

export interface WeaponConfig {
  name: string
  shortName: string
  price: number
  baseDamage: number
  pellets: number
  spread: number
  shootCooldown: number
  bulletSpeed: number
  baseAmmo: number
  statDamage: number
  statRate: number
  statRange: number
  description: string
  // Burst fire
  burstCount?: number        // rounds per trigger pull (undefined = full-auto / semi)
  burstDelay?: number        // seconds between burst rounds
  // Projectile weapons (plasma, bazooka)
  isProjectile?: boolean
  projectileSpeed?: number
  projectileRadius?: number  // splash radius
  projectileDamage?: number  // splash damage (overrides baseDamage for explosion)
  // Bouncing grenades
  isBanana?: boolean
  maxBounces?: number        // flak shards also use this
}

export const WEAPON_CONFIGS: Record<WeaponId, WeaponConfig> = {
  pistol:  { name: 'Pistole M9',          shortName: 'M9',    price: 0,   baseDamage: 1,  pellets: 1,  spread: 0,    shootCooldown: 0.18,  bulletSpeed: 18, baseAmmo: 48, statDamage: 2, statRate: 3, statRange: 4, description: 'Zuverlässige Seitenwaffe. Unbegrenzt verfügbar.' },
  smg:     { name: 'MP5 Maschinenpistole', shortName: 'SMG',   price: 150, baseDamage: 1,  pellets: 1,  spread: 0.04, shootCooldown: 0.083, bulletSpeed: 16, baseAmmo: 90, statDamage: 1, statRate: 5, statRange: 3, description: 'Hohe Feuerrate. Ideal gegen Gruppen leichter Ziele.' },
  shotgun: { name: 'Schrotflinte SPAS',   shortName: 'SPAS',  price: 200, baseDamage: 2,  pellets: 5,  spread: 0.28, shootCooldown: 0.65,  bulletSpeed: 13, baseAmmo: 20, statDamage: 5, statRate: 1, statRange: 1, description: '5 Pellets pro Schuss. Vernichtend auf kurze Distanz.' },
  rifle:   { name: 'Sturmgewehr G36',     shortName: 'G36',   price: 250, baseDamage: 2,  pellets: 1,  spread: 0,    shootCooldown: 0.25,  bulletSpeed: 22, baseAmmo: 36, statDamage: 4, statRate: 2, statRange: 5, description: 'Präzise und stark. Eliminiert Tanks in 2 Schuss.' },

  // ── New weapons ──────────────────────────────────────────────────────────
  uzi:     { name: 'Uzi',                  shortName: 'UZI',   price: 180, baseDamage: 0.8, pellets: 1, spread: 0.07, shootCooldown: 0.05,  bulletSpeed: 17, baseAmmo: 150, statDamage: 1, statRate: 5, statRange: 2, description: 'Extrem hohe Feuerrate. Überwältigt durch schiere Menge.' },
  mp5:     { name: 'MP5-K Burst',          shortName: 'MP5K',  price: 240, baseDamage: 1.2, pellets: 1, spread: 0.03, shootCooldown: 0.45,  bulletSpeed: 17, baseAmmo: 120, statDamage: 2, statRate: 4, statRange: 3, description: '3-Schuss Burst. Präzise und effektiv auf mittlere Distanz.', burstCount: 3, burstDelay: 0.06 },
  m16:     { name: 'M16A2',                shortName: 'M16',   price: 300, baseDamage: 2.5, pellets: 1, spread: 0.01, shootCooldown: 0.55,  bulletSpeed: 22, baseAmmo: 45,  statDamage: 4, statRate: 3, statRange: 5, description: '3-Schuss Burst. Hoher Schaden. Klassische Militärwaffe.', burstCount: 3, burstDelay: 0.05 },
  blaster: { name: 'Energie-Blaster',      shortName: 'BLST',  price: 220, baseDamage: 1.5, pellets: 1, spread: 0,    shootCooldown: 0.12,  bulletSpeed: 20, baseAmmo: 60,  statDamage: 3, statRate: 4, statRange: 4, description: 'Energiegeschoss. Kein Spread, hohe Genauigkeit.' },
  flak:    { name: 'Flak-Kanone',          shortName: 'FLAK',  price: 350, baseDamage: 1.8, pellets: 12, spread: 0.45, shootCooldown: 0.55, bulletSpeed: 15, baseAmmo: 30,  statDamage: 4, statRate: 2, statRange: 2, description: '12 Splitter, 3 Abpraller. Vernichtend in geschlossenen Räumen.', maxBounces: 3 },
  plasma:  { name: 'Plasma-Werfer',        shortName: 'PLSM',  price: 320, baseDamage: 8,   pellets: 1, spread: 0,    shootCooldown: 0.7,   bulletSpeed: 8,  baseAmmo: 15,  statDamage: 5, statRate: 2, statRange: 3, description: 'Langsames Projektil. Explosiv bei Einschlag (Radius 2.5m).', isProjectile: true, projectileSpeed: 8, projectileRadius: 2.5, projectileDamage: 30 },
  bazooka: { name: 'Panzerfaust RPG',      shortName: 'RPG',   price: 380, baseDamage: 20,  pellets: 1, spread: 0,    shootCooldown: 1.2,   bulletSpeed: 11, baseAmmo: 8,   statDamage: 5, statRate: 1, statRange: 4, description: 'Schwere Rakete. Massiver Splash-Schaden (Radius 4.5m).', isProjectile: true, projectileSpeed: 11, projectileRadius: 4.5, projectileDamage: 70 },
  banana:  { name: 'Bananenwerfer',        shortName: 'BNNA',  price: 280, baseDamage: 15,  pellets: 1, spread: 0.05, shootCooldown: 0.9,   bulletSpeed: 10, baseAmmo: 12,  statDamage: 4, statRate: 2, statRange: 3, description: 'Springende Granate. Explodiert nach 3s oder 5 Abprallern.', isBanana: true, maxBounces: 5, projectileRadius: 3.5, projectileDamage: 55 },
}

// ── Equipment ──────────────────────────────────────────────────────────────

export interface EquipmentConfig {
  name: string
  slot: 'back' | 'chest' | 'legs'
  price: number
  ammoMultBonus: number
  description: string
}

export const EQUIPMENT_CONFIGS: Record<EquipmentId, EquipmentConfig> = {
  backpack:    { name: 'Taktikrucksack', slot: 'back',  price: 100, ammoMultBonus: 0.6, description: '+60% Munitionskapazität. Trägt schwere Last.' },
  chest_pouch: { name: 'Brusttasche',   slot: 'chest', price: 80,  ammoMultBonus: 0.3, description: '+30% Munitionskapazität. Schneller Zugriff.' },
  leg_pouch:   { name: 'Beintasche',    slot: 'legs',  price: 70,  ammoMultBonus: 0.3, description: '+30% Munitionskapazität. Am Oberschenkel befestigt.' },
}

// ── Ammunition ─────────────────────────────────────────────────────────────

export interface AmmoConfig {
  name: string
  shortName: string
  price: number
  damageBonus: number
  color: string
  description: string
}

export const AMMO_CONFIGS: Record<AmmoId, AmmoConfig> = {
  standard:     { name: 'FMJ Standard',      shortName: 'FMJ', price: 0,   damageBonus: 0, color: '#aaaaaa', description: 'Vollmantelgeschoss. Zuverlässig und günstig.' },
  hollow_point: { name: 'Hohlspitz HP',      shortName: 'HP',  price: 80,  damageBonus: 1, color: '#ffaa00', description: '+1 Schaden. Maximale Wundwirkung gegen leicht gepanzerte Ziele.' },
  ap:           { name: 'Panzerbrechend AP', shortName: 'AP',  price: 160, damageBonus: 2, color: '#00ccff', description: '+2 Schaden. Durchschlägt auch schwere Panzerung.' },
}

// ── Physics constants ──────────────────────────────────────────────────────

export const ARENA_HALF = 18
export const WALL_THICKNESS = 1
export const PLAYER_SPEED = 6
export const PLAYER_RADIUS = 0.45
export const BULLET_LIFETIME = 1.8
export const BULLET_RADIUS = 0.12
export const PLAYER_MAX_HEALTH = 100
export const INVINCIBLE_DURATION = 0.8
export const WAVE_BREAK_DURATION = 3.5

// Bullet time
export const BULLET_TIME_SCALE = 0.15
export const BULLET_TIME_PLAYER_REAL = 0.5
export const FOCUS_MAX = 100
export const FOCUS_DRAIN_RATE = 28
export const FOCUS_REGEN_RATE = 13
export const FOCUS_MIN_ACTIVATE = 20

// Shop
export const STARTING_CREDITS = 500
export const AKIMBO_PRICE = 250

// Maneuvers
export const DIVE_SPEED     = 18
export const DIVE_DURATION  = 0.55
export const DIVE_COOLDOWN  = 1.5
export const SPIN_DURATION  = 1.4
export const SPIN_COOLDOWN  = 2.8
export const SPIN_FIRE_RATE = 0.09

// Grenades
export const GRENADE_SPEED    = 12
export const GRENADE_FUSE     = 2.2
export const GRENADE_BOUNCE   = 2
export const GRENADE_RADIUS   = 3.5
export const GRENADE_DAMAGE   = 65

// Ricochets
export const MAX_BOUNCES = 2

// Vernichter (BFG)
export const VERNICHTER_SPEED      = 6
export const VERNICHTER_RADIUS     = 9
export const VERNICHTER_DAMAGE     = 500
export const VERNICHTER_AMMO_PRICE = 300
