import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type GameType   = 'waves' | 'roundtime'
export type PickupMode = 'none' | 'ammo' | 'weapons' | 'both' | 'chaos'
export type EnemyDrop  = 'credits' | 'ammo' | 'weapons' | 'health'

interface MutatorsState {
  gameType:        GameType
  roundTimeSec:    number
  weaponPickups:   PickupMode
  enemyDrops:      EnemyDrop[]
  suddenDeath:     boolean
  suddenDeathSec:  number
  lives:           number    // per player/bot; 0 = infinite
  chaosMode:       boolean

  setGameType:       (v: GameType) => void
  setRoundTimeSec:   (v: number) => void
  setWeaponPickups:  (v: PickupMode) => void
  toggleEnemyDrop:   (v: EnemyDrop) => void
  setSuddenDeath:    (v: boolean) => void
  setSuddenDeathSec: (v: number) => void
  setLives:          (v: number) => void
  setChaosMode:      (v: boolean) => void
}

export const useMutatorsStore = create<MutatorsState>()(
  persist(
    (set, get) => ({
      gameType:       'waves',
      roundTimeSec:   180,
      weaponPickups:  'none',
      enemyDrops:     [],
      suddenDeath:    false,
      suddenDeathSec: 60,
      lives:          3,
      chaosMode:      false,

      setGameType:       (gameType)       => set({ gameType }),
      setRoundTimeSec:   (roundTimeSec)   => set({ roundTimeSec }),
      setWeaponPickups:  (weaponPickups)  => set({ weaponPickups }),
      toggleEnemyDrop:   (v) => {
        const drops = get().enemyDrops
        set({ enemyDrops: drops.includes(v) ? drops.filter(d => d !== v) : [...drops, v] })
      },
      setSuddenDeath:    (suddenDeath)    => set({ suddenDeath }),
      setSuddenDeathSec: (suddenDeathSec) => set({ suddenDeathSec }),
      setLives:          (lives)          => set({ lives }),
      setChaosMode:      (chaosMode)      => set({ chaosMode }),
    }),
    { name: 'covert-ops-mutators-v1' }
  )
)
