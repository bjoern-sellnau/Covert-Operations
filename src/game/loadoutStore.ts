import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  WEAPON_CONFIGS, EQUIPMENT_CONFIGS, AMMO_CONFIGS,
  STARTING_CREDITS, AKIMBO_PRICE,
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

  addCredits: (n: number) => void
  buyWeapon: (id: WeaponId) => boolean
  selectWeapon: (id: WeaponId) => void
  buyEquipment: (id: EquipmentId) => boolean
  buyAmmo: (id: AmmoId) => boolean
  selectAmmo: (id: AmmoId) => void
  buyAkimbo: () => boolean
  toggleAkimbo: () => void
  getMaxAmmo: () => number
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

      addCredits: (n) => set((s) => ({ credits: s.credits + n })),

      buyWeapon: (id) => {
        const s = get()
        if (s.ownedWeapons.includes(id)) {
          set({ selectedWeapon: id })
          return true
        }
        const price = WEAPON_CONFIGS[id].price
        if (s.credits < price) return false
        set((s) => ({
          credits: s.credits - price,
          ownedWeapons: [...s.ownedWeapons, id],
          selectedWeapon: id,
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

      getMaxAmmo: () => {
        const s = get()
        const base = WEAPON_CONFIGS[s.selectedWeapon].baseAmmo
        let mult = 1.0
        for (const eq of s.ownedEquipment) {
          mult += EQUIPMENT_CONFIGS[eq].ammoMultBonus
        }
        return Math.round(base * mult)
      },

      getDamageBonus: () => AMMO_CONFIGS[get().selectedAmmo].damageBonus,
    }),
    { name: 'covert-ops-loadout-v1' },
  ),
)
