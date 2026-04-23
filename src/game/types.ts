export type GamePhase = 'menu' | 'shop' | 'playing' | 'gameover' | 'editor' | 'skydive' | 'skydive_win'

export type EnemyType = 'basic' | 'fast' | 'tank'
export type WeaponId = 'pistol' | 'smg' | 'shotgun' | 'rifle'
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
  basic: { speed: 2.5, health: 1, size: 0.45, damage: 8, color: '#cc2222', emissive: '#ff0000', scoreValue: 10, creditValue: 5, segments: 6 },
  fast:  { speed: 5.0, health: 1, size: 0.3,  damage: 12, color: '#cc6600', emissive: '#ff8800', scoreValue: 25, creditValue: 10, segments: 4 },
  tank:  { speed: 1.4, health: 4, size: 0.75, damage: 20, color: '#6600cc', emissive: '#8800ff', scoreValue: 60, creditValue: 25, segments: 8 },
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
}

export const WEAPON_CONFIGS: Record<WeaponId, WeaponConfig> = {
  pistol:  { name: 'Pistole M9',          shortName: 'M9',   price: 0,   baseDamage: 1, pellets: 1, spread: 0,    shootCooldown: 0.18,  bulletSpeed: 18, baseAmmo: 48, statDamage: 2, statRate: 3, statRange: 4, description: 'Zuverlässige Seitenwaffe. Unbegrenzt verfügbar.' },
  smg:     { name: 'MP5 Maschinenpistole', shortName: 'MP5',  price: 150, baseDamage: 1, pellets: 1, spread: 0.04, shootCooldown: 0.083, bulletSpeed: 16, baseAmmo: 90, statDamage: 1, statRate: 5, statRange: 3, description: 'Hohe Feuerrate. Ideal gegen Gruppen leichter Ziele.' },
  shotgun: { name: 'Schrotflinte SPAS',   shortName: 'SPAS', price: 200, baseDamage: 2, pellets: 5, spread: 0.28, shootCooldown: 0.65,  bulletSpeed: 13, baseAmmo: 20, statDamage: 5, statRate: 1, statRange: 1, description: '5 Pellets pro Schuss. Vernichtend auf kurze Distanz.' },
  rifle:   { name: 'Sturmgewehr G36',     shortName: 'G36',  price: 250, baseDamage: 2, pellets: 1, spread: 0,    shootCooldown: 0.25,  bulletSpeed: 22, baseAmmo: 36, statDamage: 4, statRate: 2, statRange: 5, description: 'Präzise und stark. Eliminiert Tanks in 2 Schuss.' },
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
