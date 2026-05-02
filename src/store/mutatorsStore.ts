import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EnemyType } from '../game/types'

export type GameType    = 'waves' | 'roundtime' | 'instakill' | 'instakill_wave' | 'hardline_solo' | 'hardline' | 'deathmatch'
export type PickupMode  = 'none' | 'ammo' | 'weapons' | 'both' | 'chaos'
export type EnemyDrop   = 'credits' | 'ammo' | 'weapons' | 'health' | 'armor' | 'focus'
export type BtChargeMode = 'time' | 'kills' | 'start' | 'crate' | 'enemy'
export type CrateExtra  = 'health' | 'armor' | 'focus' | 'quad_damage' | 'berserker'

interface MutatorsState {
  gameType:        GameType
  roundTimeSec:    number
  weaponPickups:   PickupMode
  enemyDrops:      EnemyDrop[]
  suddenDeath:     boolean
  suddenDeathSec:  number
  lives:           number
  chaosMode:       boolean
  // Bullet ricochet
  bulletBounce:      boolean
  bulletBounceCount: number   // 0 = unlimited
  // Bullet time
  btChargeModes:   BtChargeMode[]
  btDuration:      number     // seconds at full meter
  btVisualEffect:  boolean
  // God mode
  godMode:         boolean
  // Crate extras & enemy armor drops
  crateExtras:     CrateExtra[]
  // Power-up durations (seconds)
  quadDamageDuration: number
  berserkerDuration:  number
  // Bot modes
  botCount:        number
  botEnemyTypes:   EnemyType[]
  killMultipliers: boolean

  setGameType:          (v: GameType) => void
  setRoundTimeSec:      (v: number) => void
  setWeaponPickups:     (v: PickupMode) => void
  toggleEnemyDrop:      (v: EnemyDrop) => void
  setSuddenDeath:       (v: boolean) => void
  setSuddenDeathSec:    (v: number) => void
  setLives:             (v: number) => void
  setChaosMode:         (v: boolean) => void
  setBulletBounce:      (v: boolean) => void
  setBulletBounceCount: (v: number) => void
  toggleBtChargeMode:   (v: BtChargeMode) => void
  setBtDuration:        (v: number) => void
  setBtVisualEffect:    (v: boolean) => void
  setGodMode:           (v: boolean) => void
  toggleCrateExtra:     (v: CrateExtra) => void
  setQuadDamageDuration:(v: number) => void
  setBerserkerDuration: (v: number) => void
  setBotCount:          (v: number) => void
  toggleBotEnemyType:   (v: EnemyType) => void
  setKillMultipliers:   (v: boolean) => void
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
      bulletBounce:      true,
      bulletBounceCount: 2,
      btChargeModes:   ['time'],
      btDuration:      4,
      btVisualEffect:  true,
      godMode:         false,
      crateExtras:     [],
      quadDamageDuration: 90,
      berserkerDuration:  60,
      botCount:        6,
      botEnemyTypes:   ['basic', 'fast'],
      killMultipliers: true,

      setGameType:          (gameType)       => set({ gameType }),
      setRoundTimeSec:      (roundTimeSec)   => set({ roundTimeSec }),
      setWeaponPickups:     (weaponPickups)  => set({ weaponPickups }),
      toggleEnemyDrop: (v) => {
        const drops = get().enemyDrops
        set({ enemyDrops: drops.includes(v) ? drops.filter(d => d !== v) : [...drops, v] })
      },
      setSuddenDeath:       (suddenDeath)    => set({ suddenDeath }),
      setSuddenDeathSec:    (suddenDeathSec) => set({ suddenDeathSec }),
      setLives:             (lives)          => set({ lives }),
      setChaosMode:         (chaosMode)      => set({ chaosMode }),
      setBulletBounce:      (bulletBounce)   => set({ bulletBounce }),
      setBulletBounceCount: (bulletBounceCount) => set({ bulletBounceCount }),
      toggleBtChargeMode: (v) => {
        const modes = get().btChargeModes
        set({ btChargeModes: modes.includes(v) ? modes.filter(m => m !== v) : [...modes, v] })
      },
      setBtDuration:        (btDuration)     => set({ btDuration }),
      setBtVisualEffect:    (btVisualEffect) => set({ btVisualEffect }),
      setGodMode:           (godMode)        => set({ godMode }),
      toggleCrateExtra: (v) => {
        const extras = get().crateExtras
        set({ crateExtras: extras.includes(v) ? extras.filter(e => e !== v) : [...extras, v] })
      },
      setQuadDamageDuration: (quadDamageDuration) => set({ quadDamageDuration }),
      setBerserkerDuration:  (berserkerDuration)  => set({ berserkerDuration }),
      setBotCount:           (botCount)           => set({ botCount }),
      toggleBotEnemyType: (v) => {
        const types = get().botEnemyTypes
        set({ botEnemyTypes: types.includes(v) ? types.filter(t => t !== v) : [...types, v] })
      },
      setKillMultipliers:    (killMultipliers)    => set({ killMultipliers }),
    }),
    { name: 'covert-ops-mutators-v3' }
  )
)
