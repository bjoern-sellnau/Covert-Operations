import { create } from 'zustand'
import type { EnemyType } from '../game/types'

export interface DemoFrame {
  t:   number   // ms from recording start
  px:  number   // player world X
  pz:  number   // player world Z (stored as y in Vector2)
  pa:  number   // player angle
  php: number   // player health
  e:   Array<{ id: string; x: number; z: number; tp: EnemyType }>
  s:   number   // score
  w:   number   // wave
}

export interface Demo {
  id:       string
  name:     string
  created:  number   // unix ms
  duration: number   // ms
  wave:     number
  score:    number
  frames:   DemoFrame[]
}

interface DemoState {
  isRecording:      boolean
  viewerReturnTo:   'menu' | 'editor'
  demos:            Demo[]
  startRecording:      () => void
  finishRecording:     (frames: DemoFrame[], score: number, wave: number, duration: number) => void
  setViewerReturnTo:   (to: 'menu' | 'editor') => void
  deleteDemo:          (id: string) => void
  importDemo:          (demo: Demo) => void
}

export const useDemoStore = create<DemoState>()((set, get) => ({
  isRecording:    false,
  viewerReturnTo: 'menu',
  demos:          [],

  startRecording: () => set({ isRecording: true }),

  finishRecording: (frames, score, wave, duration) => {
    if (frames.length < 2) { set({ isRecording: false }); return }
    const d = new Date()
    const demo: Demo = {
      id:       Date.now().toString(),
      name:     `${d.toLocaleDateString('de-DE')} ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} W${wave}`,
      created:  Date.now(),
      duration,
      wave,
      score,
      frames,
    }
    set({ isRecording: false, demos: [demo, ...get().demos].slice(0, 20) })
  },

  setViewerReturnTo: (to) => set({ viewerReturnTo: to }),

  deleteDemo: (id) => set({ demos: get().demos.filter(d => d.id !== id) }),

  importDemo: (demo) => set({ demos: [demo, ...get().demos].slice(0, 20) }),
}))
