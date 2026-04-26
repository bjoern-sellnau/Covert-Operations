import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MusicTrack = 'auto' | 'game1' | 'game2' | 'game3' | 'game4'

interface SettingsStore {
  bloodIntensity: 0 | 1 | 2 | 3
  mobileControls: boolean
  musicEnabled: boolean
  skyFPV: boolean
  musicTrack: MusicTrack
  setBloodIntensity: (v: 0 | 1 | 2 | 3) => void
  setMobileControls: (v: boolean) => void
  setMusicEnabled: (v: boolean) => void
  setSkyFPV: (v: boolean) => void
  setMusicTrack: (v: MusicTrack) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      bloodIntensity: 2,
      mobileControls: false,
      musicEnabled: true,
      skyFPV: false,
      musicTrack: 'auto',
      setBloodIntensity: (bloodIntensity) => set({ bloodIntensity }),
      setMobileControls: (mobileControls) => set({ mobileControls }),
      setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
      setSkyFPV: (skyFPV) => set({ skyFPV }),
      setMusicTrack: (musicTrack) => set({ musicTrack }),
    }),
    { name: 'covert-ops-settings-v1' },
  ),
)

export const BLOOD_COUNTS  = [0,  5, 15, 45] as const
export const EXPL_COUNTS   = [0,  8, 25, 60] as const
export const SPARK_COUNTS  = [0,  3,  6, 12] as const
