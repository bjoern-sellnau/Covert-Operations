import { create } from 'zustand'
import type { GamePhase } from '../game/types'

interface GameStore {
  phase: GamePhase
  health: number
  score: number
  wave: number
  enemyIds: string[]
  bulletIds: string[]
  waveMessage: string
  focus: number
  isBulletTime: boolean
  ammo: number
  maxAmmo: number
  creditsEarned: number

  setPhase: (phase: GamePhase) => void
  updateHUD: (health: number, score: number, wave: number, ammo: number, maxAmmo: number, credits: number) => void
  setBulletTime: (focus: number, active: boolean) => void
  setEnemyIds: (ids: string[]) => void
  setBulletIds: (ids: string[]) => void
  setWaveMessage: (msg: string) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  phase: 'menu',
  health: 100,
  score: 0,
  wave: 1,
  enemyIds: [],
  bulletIds: [],
  waveMessage: '',
  focus: 100,
  isBulletTime: false,
  ammo: 48,
  maxAmmo: 48,
  creditsEarned: 0,

  setPhase: (phase) => set({ phase }),
  updateHUD: (health, score, wave, ammo, maxAmmo, creditsEarned) =>
    set({ health, score, wave, ammo, maxAmmo, creditsEarned }),
  setBulletTime: (focus, isBulletTime) => set({ focus, isBulletTime }),
  setEnemyIds: (ids) => set({ enemyIds: ids }),
  setBulletIds: (ids) => set({ bulletIds: ids }),
  setWaveMessage: (msg) => set({ waveMessage: msg }),
  reset: () =>
    set({
      health: 100,
      score: 0,
      wave: 1,
      enemyIds: [],
      bulletIds: [],
      waveMessage: '',
      focus: 100,
      isBulletTime: false,
      ammo: 48,
      maxAmmo: 48,
      creditsEarned: 0,
    }),
}))
