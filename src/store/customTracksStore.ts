import { create } from 'zustand'

export interface CustomTrack {
  id:   string
  name: string
  url:  string   // Blob object URL — ephemeral, lost on page refresh
}

interface CustomTracksStore {
  tracks: CustomTrack[]
  addTrack:    (name: string, url: string) => string   // returns id
  removeTrack: (id: string) => void
}

let _seq = 0

export const useCustomTracksStore = create<CustomTracksStore>((set, get) => ({
  tracks: [],
  addTrack: (name, url) => {
    const id = `custom_${++_seq}`
    set((s) => ({ tracks: [...s.tracks, { id, name, url }] }))
    return id
  },
  removeTrack: (id) => {
    const t = get().tracks.find((t) => t.id === id)
    if (t) URL.revokeObjectURL(t.url)
    set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) }))
  },
}))
