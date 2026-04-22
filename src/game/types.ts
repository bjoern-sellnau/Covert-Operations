export type GamePhase = 'menu' | 'playing' | 'gameover'

export type EnemyType = 'basic' | 'fast' | 'tank'

export interface EnemyConfig {
  speed: number
  health: number
  size: number
  damage: number
  color: string
  emissive: string
  scoreValue: number
  segments: number
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  basic: {
    speed: 2.5,
    health: 1,
    size: 0.45,
    damage: 8,
    color: '#cc2222',
    emissive: '#ff0000',
    scoreValue: 10,
    segments: 6,
  },
  fast: {
    speed: 5.0,
    health: 1,
    size: 0.3,
    damage: 12,
    color: '#cc6600',
    emissive: '#ff8800',
    scoreValue: 25,
    segments: 4,
  },
  tank: {
    speed: 1.4,
    health: 4,
    size: 0.75,
    damage: 20,
    color: '#6600cc',
    emissive: '#8800ff',
    scoreValue: 60,
    segments: 8,
  },
}

export const ARENA_HALF = 18
export const WALL_THICKNESS = 1
export const PLAYER_SPEED = 6
export const PLAYER_RADIUS = 0.45
export const BULLET_SPEED = 18
export const BULLET_LIFETIME = 1.8
export const BULLET_RADIUS = 0.12
export const SHOOT_COOLDOWN = 0.18
export const PLAYER_MAX_HEALTH = 100
export const INVINCIBLE_DURATION = 0.8
export const WAVE_BREAK_DURATION = 3.5
