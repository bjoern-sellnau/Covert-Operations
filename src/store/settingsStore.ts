import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MusicTrack = 'auto' | 'game1' | 'game2' | 'game3' | 'game4' | 'game5' | 'game6' | 'game7' | 'game8' | 'game9' | 'game10' | 'game11' | 'game12' | 'game13' | 'game14' | 'game15' | 'game16' | 'game17' | 'game18' | 'game19' | 'game20'
export type Difficulty = 'ultra_easy' | 'very_easy' | 'easy' | 'normal' | 'hard' | 'hardcore' | 'nightmare'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  ultra_easy: 'Ultra Leicht',
  very_easy:  'Sehr Leicht',
  easy:       'Leicht',
  normal:     'Normal',
  hard:       'Schwer',
  hardcore:   'Hardcore',
  nightmare:  'Nightmare',
}

// enemy_hp_mult, enemy_dmg_mult, enemy_speed_mult, player_hp_mult
export const DIFFICULTY_MULTS: Record<Difficulty, [number, number, number, number]> = {
  ultra_easy: [0.30, 0.25, 0.60, 2.0],
  very_easy:  [0.55, 0.45, 0.75, 1.6],
  easy:       [0.75, 0.65, 0.85, 1.3],
  normal:     [1.00, 1.00, 1.00, 1.0],
  hard:       [1.40, 1.40, 1.15, 0.85],
  hardcore:   [2.00, 2.00, 1.30, 0.65],
  nightmare:  [3.50, 3.50, 1.50, 0.40],
}

interface SettingsStore {
  bloodIntensity: 0 | 1 | 2 | 3
  mobileControls: boolean
  musicEnabled: boolean
  skyFPV: boolean
  musicTrack: MusicTrack
  cameraFollow: boolean
  difficulty: Difficulty
  setBloodIntensity: (v: 0 | 1 | 2 | 3) => void
  setMobileControls: (v: boolean) => void
  setMusicEnabled: (v: boolean) => void
  setSkyFPV: (v: boolean) => void
  setMusicTrack: (v: MusicTrack) => void
  setCameraFollow: (v: boolean) => void
  setDifficulty: (v: Difficulty) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      bloodIntensity: 2,
      mobileControls: false,
      musicEnabled: true,
      skyFPV: false,
      musicTrack: 'auto',
      cameraFollow: false,
      difficulty: 'normal',
      setBloodIntensity: (bloodIntensity) => set({ bloodIntensity }),
      setMobileControls: (mobileControls) => set({ mobileControls }),
      setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
      setSkyFPV: (skyFPV) => set({ skyFPV }),
      setMusicTrack: (musicTrack) => set({ musicTrack }),
      setCameraFollow: (cameraFollow) => set({ cameraFollow }),
      setDifficulty: (difficulty) => set({ difficulty }),
    }),
    { name: 'covert-ops-settings-v1' },
  ),
)

export const BLOOD_COUNTS  = [0,  5, 15, 45] as const
export const EXPL_COUNTS   = [0,  8, 25, 60] as const
export const SPARK_COUNTS  = [0,  3,  6, 12] as const
