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

  setPhase: (phase: GamePhase) => void
  updateHUD: (health: number, score: number, wave: number) => void
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

  setPhase: (phase) => set({ phase }),
  updateHUD: (health, score, wave) => set({ health, score, wave }),
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
    }),
}))
