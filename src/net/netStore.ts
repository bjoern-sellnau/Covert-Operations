import { create } from 'zustand'
import type { NetRoom, NetChatMessage } from './netTypes'

export type NetRole = 'offline' | 'host' | 'guest'

interface NetStore {
  connected:  boolean
  role:       NetRole
  room:       NetRoom | null
  playerName: string
  ping:       number
  chatMessages: NetChatMessage[]

  setConnected:   (v: boolean) => void
  setRole:        (r: NetRole) => void
  setRoom:        (r: NetRoom | null) => void
  setPlayerName:  (n: string) => void
  setPing:        (ms: number) => void
  addChat:        (msg: NetChatMessage) => void
  clearChat:      () => void
}

export const useNetStore = create<NetStore>((set) => ({
  connected:    false,
  role:         'offline',
  room:         null,
  playerName:   'Spieler',
  ping:         0,
  chatMessages: [],

  setConnected:  (connected)  => set({ connected }),
  setRole:       (role)       => set({ role }),
  setRoom:       (room)       => set({ room }),
  setPlayerName: (playerName) => set({ playerName }),
  setPing:       (ping)       => set({ ping }),
  addChat:       (msg)        => set((s) => ({ chatMessages: [...s.chatMessages.slice(-49), msg] })),
  clearChat:     ()           => set({ chatMessages: [] }),
}))
