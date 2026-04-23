import * as THREE from 'three'
import type { EnemyType } from './types'
import { FOCUS_MAX } from './types'

export interface EnemyData {
  id: string
  position: THREE.Vector2
  health: number
  type: EnemyType
  hitTime: number
  lastDamageTime: number
}

export interface BulletData {
  id: string
  position: THREE.Vector2
  velocity: THREE.Vector2
  lifetime: number
  damage: number
}

export interface PlayerData {
  position: THREE.Vector2
  angle: number
  health: number
  shootCooldown: number
  invincibleUntil: number
}

function makeEntityStore() {
  return {
    player: {
      position: new THREE.Vector2(0, 0),
      angle: 0,
      health: 100,
      shootCooldown: 0,
      invincibleUntil: 0,
    } as PlayerData,
    enemies: new Map<string, EnemyData>(),
    bullets: new Map<string, BulletData>(),
    mouseWorld: new THREE.Vector3(0, 0, 0),
    score: 0,
    wave: 1,
    waveBreakTimer: 0,
    inWaveBreak: false,
    enemyIdCounter: 0,
    bulletIdCounter: 0,
    focus: FOCUS_MAX,
    isBulletTime: false,
    ammo: 48,
    maxAmmo: 48,
    creditsEarned: 0,
  }
}

export const entityStore = makeEntityStore()

export function resetEntityStore() {
  const s = entityStore
  s.player.position.set(0, 0)
  s.player.angle = 0
  s.player.health = 100
  s.player.shootCooldown = 0
  s.player.invincibleUntil = 0
  s.enemies.clear()
  s.bullets.clear()
  s.mouseWorld.set(0, 0, 0)
  s.score = 0
  s.wave = 1
  s.waveBreakTimer = 0
  s.inWaveBreak = false
  s.focus = FOCUS_MAX
  s.isBulletTime = false
  s.ammo = 48
  s.maxAmmo = 48
  s.creditsEarned = 0
}
