import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  WEAPON_CONFIGS, EQUIPMENT_CONFIGS, AMMO_CONFIGS,
  STARTING_CREDITS, AKIMBO_PRICE, VERNICHTER_AMMO_PRICE,
  type WeaponId, type EquipmentId, type AmmoId,
} from './types'

interface LoadoutStore {
  credits: number
  selectedWeapon: WeaponId
  ownedWeapons: WeaponId[]
  ownedEquipment: EquipmentId[]
  selectedAmmo: AmmoId
  ownedAmmo: AmmoId[]
  isAkimbo: boolean
  vernichterStock: number
  meleeStacks: Partial<Record<WeaponId, number>>

  addCredits: (n: number) => void
  setCredits: (n: number) => void
  buyWeapon: (id: WeaponId) => boolean
  selectWeapon: (id: WeaponId) => void
  buyEquipment: (id: EquipmentId) => boolean
  buyAmmo: (id: AmmoId) => boolean
  selectAmmo: (id: AmmoId) => void
  buyAkimbo: () => boolean
  toggleAkimbo: () => void
  buyVernichterAmmo: () => boolean
  getMaxAmmo: () => number
  getMaxAmmoFor: (id: WeaponId) => number
  getDamageBonus: () => number
}

export const useLoadoutStore = create<LoadoutStore>()(
  persist(
    (set, get) => ({
      credits: STARTING_CREDITS,
      selectedWeapon: 'pistol',
      ownedWeapons: ['pistol'],
      ownedEquipment: [],
      selectedAmmo: 'standard',
      ownedAmmo: ['standard'],
      isAkimbo: false,
      vernichterStock: 1,
      meleeStacks: {},

      addCredits: (n) => set((s) => ({ credits: s.credits + n })),
      setCredits: (n) => set({ credits: Math.max(0, n) }),

      buyWeapon: (id) => {
        const s   = get()
        const cfg = WEAPON_CONFIGS[id]
        if (s.ownedWeapons.includes(id)) {
          if (cfg.stackable) {
            // Buy another copy: deduct credits, add a stack (increases max durability)
            if (s.credits < cfg.price) return false
            set((st) => ({
              credits:     st.credits - cfg.price,
              selectedWeapon: id,
              meleeStacks: { ...st.meleeStacks, [id]: (st.meleeStacks[id] ?? 1) + 1 },
            }))
            return true
          }
          set({ selectedWeapon: id })
          return true
        }
        const price = cfg.price
        if (s.credits < price) return false
        set((s) => ({
          credits:     s.credits - price,
          ownedWeapons: [...s.ownedWeapons, id],
          selectedWeapon: id,
          meleeStacks: cfg.stackable ? { ...s.meleeStacks, [id]: 1 } : s.meleeStacks,
        }))
        return true
      },

      selectWeapon: (id) => {
        if (get().ownedWeapons.includes(id)) set({ selectedWeapon: id })
      },

      buyEquipment: (id) => {
        const s = get()
        if (s.ownedEquipment.includes(id)) return false
        const price = EQUIPMENT_CONFIGS[id].price
        if (s.credits < price) return false
        set((s) => ({
          credits: s.credits - price,
          ownedEquipment: [...s.ownedEquipment, id],
        }))
        return true
      },

      buyAmmo: (id) => {
        const s = get()
        if (id === 'standard') {
          set({ selectedAmmo: 'standard' })
          return true
        }
        if (s.ownedAmmo.includes(id)) {
          set({ selectedAmmo: id })
          return true
        }
        const price = AMMO_CONFIGS[id].price
        if (s.credits < price) return false
        set((s) => ({
          credits: s.credits - price,
          ownedAmmo: [...s.ownedAmmo, id],
          selectedAmmo: id,
        }))
        return true
      },

      selectAmmo: (id) => {
        if (get().ownedAmmo.includes(id)) set({ selectedAmmo: id })
      },

      buyAkimbo: () => {
        const s = get()
        if (s.isAkimbo) return true
        if (s.credits < AKIMBO_PRICE) return false
        const w = s.selectedWeapon
        if (w !== 'pistol' && w !== 'smg') return false
        set((st) => ({ credits: st.credits - AKIMBO_PRICE, isAkimbo: true }))
        return true
      },

      toggleAkimbo: () => {
        const s = get()
        if (!s.isAkimbo) return
        const w = s.selectedWeapon
        if (w !== 'pistol' && w !== 'smg') return
      },

      buyVernichterAmmo: () => {
        const s = get()
        if (s.credits < VERNICHTER_AMMO_PRICE) return false
        set((st) => ({ credits: st.credits - VERNICHTER_AMMO_PRICE, vernichterStock: st.vernichterStock + 1 }))
        return true
      },

      getMaxAmmo: () => {
        const s = get()
        const base = WEAPON_CONFIGS[s.selectedWeapon].baseAmmo
        let mult = 1.0
        for (const eq of s.ownedEquipment) mult += EQUIPMENT_CONFIGS[eq].ammoMultBonus
        return Math.round(base * mult)
      },

      getMaxAmmoFor: (id) => {
        const s   = get()
        const cfg = WEAPON_CONFIGS[id]
        if (cfg.stackable) {
          // Melee durability scales with number of copies bought; no equipment bonus
          return cfg.baseAmmo * (s.meleeStacks[id] ?? 1)
        }
        const base = cfg.baseAmmo
        let mult = 1.0
        for (const eq of s.ownedEquipment) mult += EQUIPMENT_CONFIGS[eq].ammoMultBonus
        return Math.round(base * mult)
      },

      getDamageBonus: () => AMMO_CONFIGS[get().selectedAmmo].damageBonus,
    }),
    { name: 'covert-ops-loadout-v1' },
  ),
)
