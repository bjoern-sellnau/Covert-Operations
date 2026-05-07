import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PickupWeights {
  // Regular crate kinds (relative weights)
  ammo:        number
  weapon:      number
  health:      number
  credits:     number
  bad_package: number
  armor:       number
  focus:       number
  quad_damage: number
  berserker:   number
  // Chaos modifier weights
  chaos_normal:    number
  chaos_explosive: number
  chaos_jammed:    number
}

export interface PickupProfile {
  id:      string
  name:    string
  weights: PickupWeights
}

export const DEFAULT_WEIGHTS: PickupWeights = {
  ammo:        40,
  weapon:      30,
  health:      15,
  credits:     10,
  bad_package:  5,
  armor:        0,
  focus:        0,
  quad_damage:  0,
  berserker:    0,
  chaos_normal:    40,
  chaos_explosive: 30,
  chaos_jammed:    30,
}

/** Weighted random pick; returns index. */
export function weightedPick(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0) return 0
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

interface PickupProfileStore {
  profiles:        PickupProfile[]
  activeProfileId: string | null

  createProfile:   (name: string) => string
  updateWeights:   (id: string, weights: Partial<PickupWeights>) => void
  renameProfile:   (id: string, name: string) => void
  deleteProfile:   (id: string) => void
  setActiveProfile:(id: string | null) => void
  importProfile:   (p: PickupProfile) => string
  getActiveWeights:() => PickupWeights
}

let _seq = Date.now()
const newId = () => `pp-${_seq++}`

export const usePickupProfileStore = create<PickupProfileStore>()(
  persist(
    (set, get) => ({
      profiles:        [],
      activeProfileId: null,

      createProfile: (name) => {
        const id = newId()
        set((s) => ({ profiles: [...s.profiles, { id, name, weights: { ...DEFAULT_WEIGHTS } }] }))
        return id
      },

      updateWeights: (id, weights) =>
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === id ? { ...p, weights: { ...p.weights, ...weights } } : p,
          ),
        })),

      renameProfile: (id, name) =>
        set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, name } : p)) })),

      deleteProfile: (id) =>
        set((s) => ({
          profiles:        s.profiles.filter((p) => p.id !== id),
          activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
        })),

      setActiveProfile: (id) => set({ activeProfileId: id }),

      importProfile: (p) => {
        const id = newId()
        set((s) => ({ profiles: [...s.profiles, { ...p, id }] }))
        return id
      },

      getActiveWeights: () => {
        const { profiles, activeProfileId } = get()
        if (!activeProfileId) return DEFAULT_WEIGHTS
        return profiles.find((p) => p.id === activeProfileId)?.weights ?? DEFAULT_WEIGHTS
      },
    }),
    { name: 'covert-ops-pickup-profiles-v1' },
  ),
)
