import type { WeaponId } from '../game/types'

export interface SkydiveResult {
  kills:           number
  weapons:         WeaponId[]
  healthRemaining: number
  survived:        boolean
  difficulty:      'easy' | 'hard'
}

let _result: SkydiveResult = { kills: 0, weapons: [], healthRemaining: 0, survived: false, difficulty: 'easy' }

export function setSkydiveResult(r: SkydiveResult) { _result = r }
export function getSkydiveResult(): SkydiveResult   { return _result }
