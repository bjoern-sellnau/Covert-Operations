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
  fpsMode: boolean
  isPlaytesting: boolean
  gameMode: 'arena' | 'skydive' | 'shooting_range'
  bigExplosion: boolean
  // Co-op Player 2
  p2Active: boolean
  p2Health: number
  p2Ammo: number
  p2MaxAmmo: number

  setPhase: (phase: GamePhase) => void
  setGameMode: (m: 'arena' | 'skydive' | 'shooting_range') => void
  setBigExplosion: (v: boolean) => void
  updateHUD: (health: number, score: number, wave: number, ammo: number, maxAmmo: number, credits: number) => void
  updateP2HUD: (active: boolean, health: number, ammo: number, maxAmmo: number) => void
  setBulletTime: (focus: number, active: boolean) => void
  setEnemyIds: (ids: string[]) => void
  setBulletIds: (ids: string[]) => void
  setWaveMessage: (msg: string) => void
  setFpsMode: (v: boolean) => void
  setPlaytesting: (v: boolean) => void
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
  fpsMode: false,
  isPlaytesting: false,
  gameMode: 'arena',
  bigExplosion: false,
  p2Active: false,
  p2Health: 100,
  p2Ammo: 48,
  p2MaxAmmo: 48,

  setPhase: (phase) => set({ phase }),
  setGameMode: (gameMode) => set({ gameMode }),
  setBigExplosion: (bigExplosion) => set({ bigExplosion }),
  updateHUD: (health, score, wave, ammo, maxAmmo, creditsEarned) =>
    set({ health, score, wave, ammo, maxAmmo, creditsEarned }),
  updateP2HUD: (p2Active, p2Health, p2Ammo, p2MaxAmmo) =>
    set({ p2Active, p2Health, p2Ammo, p2MaxAmmo }),
  setBulletTime: (focus, isBulletTime) => set({ focus, isBulletTime }),
  setEnemyIds: (ids) => set({ enemyIds: ids }),
  setBulletIds: (ids) => set({ bulletIds: ids }),
  setWaveMessage: (msg) => set({ waveMessage: msg }),
  setFpsMode: (fpsMode) => set({ fpsMode }),
  setPlaytesting: (isPlaytesting) => set({ isPlaytesting }),
  reset: () =>
    set({
      health: 100, score: 0, wave: 1,
      enemyIds: [], bulletIds: [], waveMessage: '',
      focus: 100, isBulletTime: false,
      ammo: 48, maxAmmo: 48, creditsEarned: 0, fpsMode: false,
      gameMode: 'arena',
      p2Active: false, p2Health: 100, p2Ammo: 48, p2MaxAmmo: 48,
    }),
}))
