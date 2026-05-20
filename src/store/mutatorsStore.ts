import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EnemyType } from '../game/types'

export type GameType    = 'waves' | 'roundtime' | 'instakill' | 'instakill_wave' | 'hardline_solo' | 'hardline' | 'deathmatch' | 'arena'
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
  // Bullet Ballet (Akimbo-Spin)
  balletDuration:    number   // seconds (default 1.4)
  balletBulletCount: number   // bullets fired per tick (default 2)
  balletSpeed:       number   // multiplier for spin rate + fire rate (default 1.0)
  // Gun Kata
  gunKataEnabled:    boolean
  gunKataDuration:   number   // seconds (default 1.5)
  gunKataTargets:    number   // max enemies auto-targeted per burst (default 4)
  gunKataSpeed:      number   // bullet speed multiplier (default 1.0)
  // Auto-reload
  autoReload:        boolean
  // Fog of war
  fogOfWarEnabled:   boolean
  fogOfWarRadius:    number   // world units
  // FPS visual tweaks
  largeBullets:      boolean  // keep old (large) bullet size in FPS mode

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
  setBalletDuration:    (v: number) => void
  setBalletBulletCount: (v: number) => void
  setBalletSpeed:       (v: number) => void
  setGunKataEnabled:    (v: boolean) => void
  setGunKataDuration:   (v: number) => void
  setGunKataTargets:    (v: number) => void
  setGunKataSpeed:      (v: number) => void
  setAutoReload:        (v: boolean) => void
  setFogOfWarEnabled:   (v: boolean) => void
  setFogOfWarRadius:    (v: number) => void
  setLargeBullets:      (v: boolean) => void
  resetMutators:        () => void
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
      balletDuration:    1.4,
      balletBulletCount: 2,
      balletSpeed:       1.0,
      gunKataEnabled:    false,
      gunKataDuration:   1.5,
      gunKataTargets:    4,
      gunKataSpeed:      1.0,
      autoReload:        false,
      fogOfWarEnabled:   false,
      fogOfWarRadius:    8,
      largeBullets:      false,

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
      setBalletDuration:    (balletDuration)    => set({ balletDuration }),
      setBalletBulletCount: (balletBulletCount) => set({ balletBulletCount }),
      setBalletSpeed:       (balletSpeed)       => set({ balletSpeed }),
      setGunKataEnabled:    (gunKataEnabled)    => set({ gunKataEnabled }),
      setGunKataDuration:   (gunKataDuration)   => set({ gunKataDuration }),
      setGunKataTargets:    (gunKataTargets)    => set({ gunKataTargets }),
      setGunKataSpeed:      (gunKataSpeed)      => set({ gunKataSpeed }),
      setAutoReload:        (autoReload)        => set({ autoReload }),
      setFogOfWarEnabled:   (fogOfWarEnabled)   => set({ fogOfWarEnabled }),
      setFogOfWarRadius:    (fogOfWarRadius)    => set({ fogOfWarRadius }),
      setLargeBullets:      (largeBullets)      => set({ largeBullets }),
      resetMutators: () => set({
        gameType: 'waves', roundTimeSec: 180, weaponPickups: 'none', enemyDrops: [],
        suddenDeath: false, suddenDeathSec: 60, lives: 3, chaosMode: false,
        bulletBounce: true, bulletBounceCount: 2, btChargeModes: ['time'], btDuration: 4,
        btVisualEffect: true, godMode: false, crateExtras: [], quadDamageDuration: 90,
        berserkerDuration: 60, botCount: 6, botEnemyTypes: ['basic', 'fast'],
        killMultipliers: true, balletDuration: 1.4, balletBulletCount: 2, balletSpeed: 1.0,
        gunKataEnabled: false, gunKataDuration: 1.5, gunKataTargets: 4, gunKataSpeed: 1.0,
        autoReload: false, fogOfWarEnabled: false, fogOfWarRadius: 8, largeBullets: false,
      }),
    }),
    { name: 'covert-ops-mutators-v3' }
  )
)
