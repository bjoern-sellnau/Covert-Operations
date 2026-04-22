import * as THREE from 'three'
import { entityStore } from './entityStore'
import { ARENA_HALF, ENEMY_CONFIGS } from './types'
import type { EnemyType } from './types'

function getWaveComposition(wave: number): EnemyType[] {
  const types: EnemyType[] = []
  const count = 3 + wave * 2

  for (let i = 0; i < count; i++) {
    const r = Math.random()
    if (wave >= 4 && r < 0.25) {
      types.push('tank')
    } else if (wave >= 2 && r < 0.45) {
      types.push('fast')
    } else {
      types.push('basic')
    }
  }
  return types
}

function spawnEdgePosition(): THREE.Vector2 {
  const side = Math.floor(Math.random() * 4)
  const edge = ARENA_HALF - 1.5
  const offset = (Math.random() * 2 - 1) * (ARENA_HALF - 2)
  switch (side) {
    case 0: return new THREE.Vector2(-edge, offset)
    case 1: return new THREE.Vector2(edge, offset)
    case 2: return new THREE.Vector2(offset, -edge)
    default: return new THREE.Vector2(offset, edge)
  }
}

export function spawnWave(wave: number): string[] {
  const types = getWaveComposition(wave)
  const ids: string[] = []

  for (const type of types) {
    const id = `enemy-${++entityStore.enemyIdCounter}`
    entityStore.enemies.set(id, {
      id,
      position: spawnEdgePosition(),
      health: ENEMY_CONFIGS[type].health,
      type,
      hitTime: -999,
      lastDamageTime: -999,
    })
    ids.push(id)
  }
  return ids
}
