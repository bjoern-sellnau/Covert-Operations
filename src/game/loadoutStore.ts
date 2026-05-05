import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  WEAPON_CONFIGS, EQUIPMENT_CONFIGS, AMMO_CONFIGS,
  STARTING_CREDITS, AKIMBO_PRICE, VERNICHTER_AMMO_PRICE, LASER_AMMO_PRICE, ION_AMMO_PRICE,
  WEAPON_SLOT_WEAPONS, WEAPON_TO_SLOT,
  type WeaponId, type EquipmentId, type AmmoId,
} from './types'

// Always-owned weapons (no purchase required)
export const ALWAYS_OWNED: WeaponId[] = ['pistol', 'grenade', 'vernichter', 'deathlas', 'ioncan']

interface LoadoutStore {
  credits: number
  selectedWeapon: WeaponId
  ownedWeapons: WeaponId[]
  ownedEquipment: EquipmentId[]
  selectedAmmo: AmmoId
  ownedAmmo: AmmoId[]
  isAkimbo: boolean
  vernichterStock: number
  laserStock: number
  ionStock: number
  meleeStacks: Partial<Record<WeaponId, number>>
  weaponAmmoRefills: Partial<Record<WeaponId, number>>
  activeSlot: number
  slotIndices: Partial<Record<number, number>>

  addCredits: (n: number) => void
  setCredits: (n: number) => void
  buyWeapon: (id: WeaponId) => boolean
  selectWeapon: (id: WeaponId) => void
  switchToSlot: (slot: number) => WeaponId | null
  buyEquipment: (id: EquipmentId) => boolean
  buyAmmo: (id: AmmoId) => boolean
  selectAmmo: (id: AmmoId) => void
  buyAkimbo: () => boolean
  toggleAkimbo: () => void
  buyVernichterAmmo: () => boolean
  buyLaserAmmo: () => boolean
  buyIonAmmo: () => boolean
  buyWeaponAmmo: (id: WeaponId) => boolean
  consumeAmmoRefills: () => Partial<Record<WeaponId, number>>
  getMaxAmmo: () => number
  getMaxAmmoFor: (id: WeaponId) => number
  getDamageBonus: () => number
  resetForGame: (startCredits: number) => void
}

export const useLoadoutStore = create<LoadoutStore>()(
  persist(
    (set, get) => ({
      credits: STARTING_CREDITS,
      selectedWeapon: 'pistol',
      ownedWeapons: [...ALWAYS_OWNED],
      ownedEquipment: [],
      selectedAmmo: 'standard',
      ownedAmmo: ['standard'],
      isAkimbo: false,
      vernichterStock: 1,
      laserStock: 0,
      ionStock: 0,
      meleeStacks: {},
      weaponAmmoRefills: {},
      activeSlot: 2,
      slotIndices: {},

      addCredits: (n) => set((s) => ({ credits: s.credits + n })),
      setCredits: (n) => set({ credits: Math.max(0, n) }),

      buyWeapon: (id) => {
        const s   = get()
        const cfg = WEAPON_CONFIGS[id]
        if (s.ownedWeapons.includes(id)) {
          if (cfg.stackable) {
            if ((s.meleeStacks[id] ?? 1) >= 5) return false
            if (s.credits < cfg.price) return false
            set((st) => ({
              credits:     st.credits - cfg.price,
              selectedWeapon: id,
              activeSlot: WEAPON_TO_SLOT[id] ?? st.activeSlot,
              meleeStacks: { ...st.meleeStacks, [id]: (st.meleeStacks[id] ?? 1) + 1 },
            }))
            return true
          }
          if ((id === 'pistol' || id === 'smg') && !s.isAkimbo) {
            if (s.credits < AKIMBO_PRICE) return false
            set((st) => ({ credits: st.credits - AKIMBO_PRICE, isAkimbo: true, selectedWeapon: id, activeSlot: WEAPON_TO_SLOT[id] ?? st.activeSlot }))
            return true
          }
          set({ selectedWeapon: id, activeSlot: WEAPON_TO_SLOT[id] ?? s.activeSlot })
          return true
        }
        const price = cfg.price
        if (s.credits < price) return false
        set((s) => ({
          credits:      s.credits - price,
          ownedWeapons: [...s.ownedWeapons, id],
          selectedWeapon: id,
          activeSlot: WEAPON_TO_SLOT[id] ?? s.activeSlot,
          meleeStacks: cfg.stackable ? { ...s.meleeStacks, [id]: 1 } : s.meleeStacks,
        }))
        return true
      },

      selectWeapon: (id) => {
        const s = get()
        if (!s.ownedWeapons.includes(id)) return
        const slot = WEAPON_TO_SLOT[id] ?? s.activeSlot
        const slotWeapons = WEAPON_SLOT_WEAPONS[slot] ?? []
        const owned = slotWeapons.filter(w => s.ownedWeapons.includes(w))
        const idx = owned.indexOf(id)
        set({
          selectedWeapon: id,
          activeSlot: slot,
          slotIndices: idx >= 0 ? { ...s.slotIndices, [slot]: idx } : s.slotIndices,
        })
      },

      switchToSlot: (slot) => {
        const s = get()
        const slotWeapons = WEAPON_SLOT_WEAPONS[slot] ?? []
        const owned = slotWeapons.filter(w => s.ownedWeapons.includes(w))
        if (owned.length === 0) return null

        let targetIdx: number
        if (s.activeSlot === slot) {
          // Already on this slot — cycle to next weapon
          const curIdx = owned.indexOf(s.selectedWeapon)
          targetIdx = (curIdx + 1) % owned.length
        } else {
          // Switch to last-used weapon in this slot
          targetIdx = Math.min(s.slotIndices[slot] ?? 0, owned.length - 1)
        }
        const target = owned[targetIdx]
        set({ selectedWeapon: target, activeSlot: slot, slotIndices: { ...s.slotIndices, [slot]: targetIdx } })
        return target
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
        if (s.vernichterStock >= 5) return false
        if (s.credits < VERNICHTER_AMMO_PRICE) return false
        set((st) => ({ credits: st.credits - VERNICHTER_AMMO_PRICE, vernichterStock: st.vernichterStock + 1 }))
        return true
      },

      buyLaserAmmo: () => {
        const s = get()
        if (s.laserStock >= 3) return false
        if (s.credits < LASER_AMMO_PRICE) return false
        set((st) => ({ credits: st.credits - LASER_AMMO_PRICE, laserStock: st.laserStock + 1 }))
        return true
      },

      buyIonAmmo: () => {
        const s = get()
        if (s.ionStock >= 3) return false
        if (s.credits < ION_AMMO_PRICE) return false
        set((st) => ({ credits: st.credits - ION_AMMO_PRICE, ionStock: st.ionStock + 1 }))
        return true
      },

      buyWeaponAmmo: (id) => {
        const s   = get()
        const cfg = WEAPON_CONFIGS[id]
        if (cfg.isMelee || cfg.isVernichter || cfg.isLaser || cfg.isIon || cfg.isGrenade) return false
        const current = s.weaponAmmoRefills[id] ?? 0
        if (current >= 3) return false
        const price = Math.max(15, Math.round(cfg.price * 0.12))
        if (s.credits < price) return false
        set((st) => ({
          credits: st.credits - price,
          weaponAmmoRefills: { ...st.weaponAmmoRefills, [id]: current + 1 },
        }))
        return true
      },

      consumeAmmoRefills: () => {
        const refills = get().weaponAmmoRefills
        set({ weaponAmmoRefills: {} })
        return refills
      },

      getMaxAmmo: () => {
        const s = get()
        const cfg = WEAPON_CONFIGS[s.selectedWeapon]
        if (cfg.isVernichter) return s.vernichterStock
        if (cfg.isLaser)      return s.laserStock
        if (cfg.isIon)        return s.ionStock
        const base = cfg.baseAmmo
        let mult = 1.0
        for (const eq of s.ownedEquipment) mult += EQUIPMENT_CONFIGS[eq].ammoMultBonus
        return Math.round(base * mult)
      },

      getMaxAmmoFor: (id) => {
        const s   = get()
        const cfg = WEAPON_CONFIGS[id]
        if (cfg.isVernichter) return s.vernichterStock
        if (cfg.isLaser)      return s.laserStock
        if (cfg.isIon)        return s.ionStock
        if (cfg.stackable) {
          return cfg.baseAmmo * (s.meleeStacks[id] ?? 1)
        }
        const base = cfg.baseAmmo
        let mult = 1.0
        for (const eq of s.ownedEquipment) mult += EQUIPMENT_CONFIGS[eq].ammoMultBonus
        return Math.round(base * mult)
      },

      getDamageBonus: () => AMMO_CONFIGS[get().selectedAmmo].damageBonus,

      resetForGame: (startCredits) => set({
        credits:        startCredits,
        selectedWeapon: 'pistol',
        ownedWeapons:   [...ALWAYS_OWNED],
        ownedEquipment: [],
        selectedAmmo:   'standard',
        ownedAmmo:      ['standard'],
        isAkimbo:       false,
        vernichterStock: 1,
        laserStock:     0,
        ionStock:       0,
        meleeStacks:    {},
        weaponAmmoRefills: {},
        activeSlot:     2,
        slotIndices:    {},
      }),
    }),
    { name: 'covert-ops-loadout-v2' },
  ),
)
