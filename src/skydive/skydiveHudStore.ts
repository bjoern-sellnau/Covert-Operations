import { create } from 'zustand'

interface SkydiveHUDStore {
  altitude: number
  health: number
  parachuteZone: boolean
  parachuteDeployed: boolean
  setHUD: (altitude: number, health: number, parachuteZone: boolean, parachuteDeployed: boolean) => void
}

export const useSkydiveHUD = create<SkydiveHUDStore>((set) => ({
  altitude: 3000,
  health: 100,
  parachuteZone: false,
  parachuteDeployed: false,
  setHUD: (altitude, health, parachuteZone, parachuteDeployed) =>
    set({ altitude, health, parachuteZone, parachuteDeployed }),
}))
