import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const CREDIT_OPTIONS   = [0, 100, 200, 500, 1000, 2000] as const
export const WEAPON_LIMIT_OPTIONS = [1, 2, 3, 5, 99] as const // 99 = unlimited

const DEFAULTS = {
  startCredits: 500,
  maxWeapons:   99,
}

interface RulesState {
  startCredits: number
  maxWeapons:   number

  setStartCredits: (v: number) => void
  setMaxWeapons:   (v: number) => void
  resetRules:      () => void
}

export const useRulesStore = create<RulesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setStartCredits: (startCredits) => set({ startCredits }),
      setMaxWeapons:   (maxWeapons)   => set({ maxWeapons }),
      resetRules:      ()             => set({ ...DEFAULTS }),
    }),
    { name: 'covert-ops-rules-v1' },
  ),
)
