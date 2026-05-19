import { create } from 'zustand'
import type { GamePhase } from '../game/types'

export type CameraMode = 'topdown' | 'iso' | 'fps'

interface GameStore {
  phase: GamePhase
  health: number
  score: number
  wave: number
  enemyIds: string[]
  bulletIds: string[]
  enemyBulletIds: string[]
  waveMessage: string
  doorHint: string
  focus: number
  isBulletTime: boolean
  ammo: number
  maxAmmo: number
  creditsEarned: number
  armor: number
  cameraMode: CameraMode
  isPlaytesting: boolean
  gameMode: 'arena' | 'skydive' | 'shooting_range'
  skipShop: boolean
  offlinePath: boolean
  bigExplosion: boolean
  briefingReturnTo: GamePhase
  optionsReturnTo: GamePhase
  // Co-op Player 2
  p2Active: boolean
  p2Health: number
  p2Ammo: number
  p2MaxAmmo: number
  // Mutators HUD
  roundTimer:   number   // seconds remaining; 0 = not active
  playerLives:  number
  p2Lives:      number
  inSuddenDeath: boolean
  chaosActive:  boolean

  setPhase: (phase: GamePhase) => void
  setGameMode: (m: 'arena' | 'skydive' | 'shooting_range') => void
  setSkipShop: (v: boolean) => void
  setOfflinePath: (v: boolean) => void
  setBriefingReturnTo: (v: GamePhase) => void
  setOptionsReturnTo: (phase: GamePhase) => void
  setBigExplosion: (v: boolean) => void
  updateHUD: (health: number, score: number, wave: number, ammo: number, maxAmmo: number, credits: number, armor: number) => void
  updateP2HUD: (active: boolean, health: number, ammo: number, maxAmmo: number) => void
  setBulletTime: (focus: number, active: boolean) => void
  setEnemyIds: (ids: string[]) => void
  setBulletIds: (ids: string[]) => void
  setEnemyBulletIds: (ids: string[]) => void
  setWaveMessage: (msg: string) => void
  setDoorHint: (hint: string) => void
  setCameraMode: (v: CameraMode) => void
  setPlaytesting: (v: boolean) => void
  updateMutatorHUD: (roundTimer: number, playerLives: number, p2Lives: number, inSuddenDeath: boolean, chaosActive: boolean) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  phase: 'splash',
  health: 100,
  score: 0,
  wave: 1,
  enemyIds: [],
  bulletIds: [],
  enemyBulletIds: [],
  waveMessage: '',
  doorHint: '',
  focus: 100,
  isBulletTime: false,
  ammo: 48,
  maxAmmo: 48,
  creditsEarned: 0,
  armor: 0,
  cameraMode: 'topdown',
  isPlaytesting: false,
  gameMode: 'arena',
  skipShop: false,
  offlinePath: false,
  bigExplosion: false,
  briefingReturnTo: 'title_screen' as GamePhase,
  optionsReturnTo: 'title_screen' as GamePhase,
  p2Active: false,
  p2Health: 100,
  p2Ammo: 48,
  p2MaxAmmo: 48,
  roundTimer:    0,
  playerLives:   3,
  p2Lives:       3,
  inSuddenDeath: false,
  chaosActive:   false,

  setPhase: (phase) => {
    if (phase === 'menu' || phase === 'title_screen') {
      set({
        phase,
        health: 100, score: 0, wave: 1,
        enemyIds: [], bulletIds: [], enemyBulletIds: [], waveMessage: '', doorHint: '',
        focus: 100, isBulletTime: false,
        ammo: 48, maxAmmo: 48, creditsEarned: 0, armor: 0, cameraMode: 'topdown',
        p2Active: false, p2Health: 100, p2Ammo: 48, p2MaxAmmo: 48,
        roundTimer: 0, playerLives: 3, p2Lives: 3, inSuddenDeath: false, chaosActive: false,
        offlinePath: false,
      })
    } else if (phase === 'playing') {
      set({ phase, offlinePath: false })
    } else {
      set({ phase })
    }
  },
  setGameMode:     (gameMode)   => set({ gameMode }),
  setSkipShop:         (skipShop)        => set({ skipShop }),
  setOfflinePath:      (offlinePath)     => set({ offlinePath }),
  setBriefingReturnTo: (briefingReturnTo) => set({ briefingReturnTo }),
  setOptionsReturnTo:  (optionsReturnTo) => set({ optionsReturnTo }),
  setBigExplosion: (bigExplosion) => set({ bigExplosion }),
  updateHUD: (health, score, wave, ammo, maxAmmo, creditsEarned, armor) =>
    set({ health, score, wave, ammo, maxAmmo, creditsEarned, armor }),
  updateP2HUD: (p2Active, p2Health, p2Ammo, p2MaxAmmo) =>
    set({ p2Active, p2Health, p2Ammo, p2MaxAmmo }),
  setBulletTime: (focus, isBulletTime) => set({ focus, isBulletTime }),
  setEnemyIds:   (ids) => set({ enemyIds: ids }),
  setBulletIds:      (ids) => set({ bulletIds: ids }),
  setEnemyBulletIds: (ids) => set({ enemyBulletIds: ids }),
  setWaveMessage: (msg) => set({ waveMessage: msg }),
  setDoorHint: (hint) => set({ doorHint: hint }),
  setCameraMode:  (cameraMode) => set({ cameraMode }),
  setPlaytesting: (isPlaytesting) => set({ isPlaytesting }),
  updateMutatorHUD: (roundTimer, playerLives, p2Lives, inSuddenDeath, chaosActive) =>
    set({ roundTimer, playerLives, p2Lives, inSuddenDeath, chaosActive }),
  reset: () =>
    set({
      health: 100, score: 0, wave: 1,
      enemyIds: [], bulletIds: [], enemyBulletIds: [], waveMessage: '', doorHint: '',
      focus: 100, isBulletTime: false,
      ammo: 48, maxAmmo: 48, creditsEarned: 0, armor: 0, cameraMode: 'topdown',
      gameMode: 'arena',
      skipShop: false,
      offlinePath: false,
      p2Active: false, p2Health: 100, p2Ammo: 48, p2MaxAmmo: 48,
      roundTimer: 0, playerLives: 3, p2Lives: 3, inSuddenDeath: false, chaosActive: false,
    }),
}))
