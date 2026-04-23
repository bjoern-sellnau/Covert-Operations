import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  bloodIntensity: 0 | 1 | 2 | 3
  setBloodIntensity: (v: 0 | 1 | 2 | 3) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      bloodIntensity: 2,
      setBloodIntensity: (bloodIntensity) => set({ bloodIntensity }),
    }),
    { name: 'covert-ops-settings-v1' },
  ),
)

export const BLOOD_COUNTS  = [0,  5, 15, 45] as const
export const EXPL_COUNTS   = [0,  8, 25, 60] as const
export const SPARK_COUNTS  = [0,  3,  6, 12] as const
