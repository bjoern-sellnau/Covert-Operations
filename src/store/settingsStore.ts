import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SkinId } from '../game/skins'

export type MusicTrack = 'auto' | 'custom' | 'game1' | 'game2' | 'game3' | 'game4' | 'game5' | 'game6' | 'game7' | 'game8' | 'game9' | 'game10' | 'game11' | 'game12' | 'game13' | 'game14' | 'game15' | 'game16' | 'game17' | 'game18' | 'game19' | 'game20' | 'game21' | 'game22' | 'game23' | 'game24' | 'game25' | 'game26' | 'game27' | 'game28' | 'game29' | 'game30' | 'game31' | 'game32'
export type Difficulty = 'ultra_easy' | 'very_easy' | 'easy' | 'normal' | 'hard' | 'hardcore' | 'nightmare'
export type GraphicsQuality = 'low' | 'medium' | 'high'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  ultra_easy: 'Ultra Leicht',
  very_easy:  'Sehr Leicht',
  easy:       'Leicht',
  normal:     'Normal',
  hard:       'Schwer',
  hardcore:   'Hardcore',
  nightmare:  'Nightmare',
}

// enemy_hp_mult, enemy_dmg_mult, enemy_speed_mult, player_hp_mult
export const DIFFICULTY_MULTS: Record<Difficulty, [number, number, number, number]> = {
  ultra_easy: [0.30, 0.25, 0.60, 2.0],
  very_easy:  [0.55, 0.45, 0.75, 1.6],
  easy:       [0.75, 0.65, 0.85, 1.3],
  normal:     [1.00, 1.00, 1.00, 1.0],
  hard:       [1.40, 1.40, 1.15, 0.85],
  hardcore:   [2.00, 2.00, 1.30, 0.65],
  nightmare:  [3.50, 3.50, 1.50, 0.40],
}

interface SettingsStore {
  bloodIntensity: 0 | 1 | 2 | 3
  mobileControls: boolean
  musicEnabled: boolean
  skyFPV: boolean
  musicTrack: MusicTrack
  cameraFollow: boolean
  difficulty: Difficulty
  graphicsQuality: GraphicsQuality
  charScale: number          // 0.5 – 2.0, player and enemy visual scale
  showFPSWeapon: boolean     // show weapon arm in FPS mode
  showEnemyMarkers: boolean  // show off-screen enemy direction arrows
  showMinimap: boolean       // show minimap overlay
  showBoundingBoxes: boolean // debug: render entity collision rings
  playerSkin: SkinId
  customTrackId: string           // id from customTracksStore when musicTrack === 'custom'
  setPlayerSkin: (v: SkinId) => void
  setCustomTrackId: (v: string) => void
  setBloodIntensity: (v: 0 | 1 | 2 | 3) => void
  setMobileControls: (v: boolean) => void
  setMusicEnabled: (v: boolean) => void
  setSkyFPV: (v: boolean) => void
  setMusicTrack: (v: MusicTrack) => void
  setCameraFollow: (v: boolean) => void
  setDifficulty: (v: Difficulty) => void
  setGraphicsQuality: (v: GraphicsQuality) => void
  setCharScale: (v: number) => void
  setShowFPSWeapon: (v: boolean) => void
  setShowEnemyMarkers: (v: boolean) => void
  setShowMinimap: (v: boolean) => void
  setShowBoundingBoxes: (v: boolean) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      bloodIntensity:  2,
      mobileControls:  false,
      musicEnabled:    true,
      skyFPV:          false,
      musicTrack:      'auto',
      cameraFollow:    false,
      difficulty:      'normal',
      graphicsQuality: 'medium',
      charScale:           1.0,
      showFPSWeapon:       true,
      showEnemyMarkers:    true,
      showMinimap:         false,
      playerSkin:          'palantir' as SkinId,
      customTrackId:       '',
      setPlayerSkin:       (playerSkin) => set({ playerSkin }),
      setCustomTrackId:    (customTrackId) => set({ customTrackId }),
      setBloodIntensity:  (bloodIntensity)  => set({ bloodIntensity }),
      setMobileControls:  (mobileControls)  => set({ mobileControls }),
      setMusicEnabled:    (musicEnabled)    => set({ musicEnabled }),
      setSkyFPV:          (skyFPV)          => set({ skyFPV }),
      setMusicTrack:      (musicTrack)      => set({ musicTrack }),
      setCameraFollow:    (cameraFollow)    => set({ cameraFollow }),
      setDifficulty:      (difficulty)      => set({ difficulty }),
      setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
      setCharScale:       (charScale)       => set({ charScale: Math.round(charScale * 10) / 10 }),
      showBoundingBoxes:       false,
      setShowFPSWeapon:        (showFPSWeapon)        => set({ showFPSWeapon }),
      setShowEnemyMarkers:     (showEnemyMarkers)     => set({ showEnemyMarkers }),
      setShowMinimap:          (showMinimap)          => set({ showMinimap }),
      setShowBoundingBoxes:    (showBoundingBoxes)    => set({ showBoundingBoxes }),
      resetSettings: () => set({
        bloodIntensity: 2, mobileControls: false, musicEnabled: true, skyFPV: false,
        musicTrack: 'auto', cameraFollow: false, difficulty: 'normal', graphicsQuality: 'medium',
        charScale: 1.0, showFPSWeapon: true, showEnemyMarkers: true, showMinimap: false,
        showBoundingBoxes: false, playerSkin: 'palantir' as SkinId, customTrackId: '',
      }),
    }),
    { name: 'covert-ops-settings-v2' },
  ),
)

export const BLOOD_COUNTS  = [0,  5, 15, 80] as const
export const EXPL_COUNTS   = [0,  8, 25, 60] as const
export const SPARK_COUNTS  = [0,  3,  6, 12] as const
