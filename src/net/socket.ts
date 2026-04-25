/// <reference types="vite/client" />
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from './netTypes'

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? ''   // empty = same origin (via Vite proxy)

export const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1500,
  transports: ['websocket'],
}) as Socket<ServerToClientEvents, ClientToServerEvents>

export function connectSocket() {
  if (!socket.connected) socket.connect()
}

export function disconnectSocket() {
  socket.disconnect()
}
