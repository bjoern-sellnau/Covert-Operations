import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import type {
  ServerToClientEvents, ClientToServerEvents,
  NetRoom, NetPlayer, NetGameState, NetPlayerInput,
  NetBulletSpawn, NetChatMessage,
} from '../../src/net/netTypes'

const app    = express()
const http   = createServer(app)
const io     = new Server<ClientToServerEvents, ServerToClientEvents>(http, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

app.get('/health', (_, res) => res.json({ ok: true, rooms: rooms.size }))

// ── Room storage ──────────────────────────────────────────────────────────────

interface Room extends NetRoom {
  chatHistory: NetChatMessage[]
}

const rooms = new Map<string, Room>()
const playerRoom = new Map<string, string>()  // socketId → roomId

function genRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return rooms.has(id) ? genRoomId() : id
}

function getRoomForSocket(socketId: string): Room | null {
  const roomId = playerRoom.get(socketId)
  return roomId ? (rooms.get(roomId) ?? null) : null
}

// ── Connection ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`)

  // ── Ping/Pong ─────────────────────────────────────────────────────────────
  const pingInterval = setInterval(() => {
    socket.emit('ping', Date.now())
  }, 3000)

  socket.on('pong', (_ts) => { /* could measure latency here */ })

  // ── Create room ───────────────────────────────────────────────────────────
  socket.on('create_room', (name, cb) => {
    if (playerRoom.has(socket.id)) {
      return cb({ error: 'Bereits in einem Raum.' })
    }
    const roomId = genRoomId()
    const player: NetPlayer = { id: socket.id, name: name || 'Spieler 1', isHost: true }
    const room: Room = {
      id: roomId, hostId: socket.id,
      players: [player],
      gameStarted: false,
      chatHistory: [],
    }
    rooms.set(roomId, room)
    playerRoom.set(socket.id, roomId)
    socket.join(roomId)
    console.log(`[room] Created ${roomId} by ${socket.id}`)
    cb({ roomId })
    io.to(roomId).emit('room_updated', sanitize(room))
  })

  // ── Join room ─────────────────────────────────────────────────────────────
  socket.on('join_room', (roomId, name, cb) => {
    if (playerRoom.has(socket.id)) {
      return cb({ error: 'Bereits in einem Raum.' })
    }
    const room = rooms.get(roomId.toUpperCase())
    if (!room) return cb({ error: `Raum "${roomId.toUpperCase()}" nicht gefunden.` })
    if (room.gameStarted) return cb({ error: 'Spiel bereits gestartet.' })
    if (room.players.length >= 2) return cb({ error: 'Raum ist voll (2/2).' })

    const player: NetPlayer = { id: socket.id, name: name || 'Spieler 2', isHost: false }
    room.players.push(player)
    playerRoom.set(socket.id, roomId.toUpperCase())
    socket.join(roomId.toUpperCase())
    console.log(`[room] ${socket.id} joined ${roomId.toUpperCase()}`)
    cb({ room: sanitize(room) })
    io.to(room.id).emit('room_updated', sanitize(room))
  })

  // ── Leave room ────────────────────────────────────────────────────────────
  socket.on('leave_room', () => leaveRoom(socket.id))

  // ── Start game (host only) ────────────────────────────────────────────────
  socket.on('start_game', () => {
    const room = getRoomForSocket(socket.id)
    if (!room || room.hostId !== socket.id) return
    if (room.players.length < 1) return
    room.gameStarted = true
    io.to(room.id).emit('game_started')
    console.log(`[room] Game started in ${room.id}`)
  })

  // ── Relay: host game state → all guests ───────────────────────────────────
  socket.on('host_state', (state: NetGameState) => {
    const room = getRoomForSocket(socket.id)
    if (!room || room.hostId !== socket.id) return
    socket.to(room.id).emit('game_state', state)
  })

  // ── Relay: guest player input → host ─────────────────────────────────────
  socket.on('player_input', (input: NetPlayerInput) => {
    const room = getRoomForSocket(socket.id)
    if (!room || room.hostId === socket.id) return   // only guests send this
    socket.to(room.id).emit('player_input', { ...input, playerId: socket.id })
  })

  // ── Relay: bullet spawn/remove ────────────────────────────────────────────
  socket.on('bullet_spawn', (bullet: NetBulletSpawn) => {
    const room = getRoomForSocket(socket.id)
    if (!room) return
    socket.to(room.id).emit('bullet_spawn', bullet)
  })

  socket.on('bullet_remove', (id: string) => {
    const room = getRoomForSocket(socket.id)
    if (!room) return
    socket.to(room.id).emit('bullet_remove', id)
  })

  // ── Relay: game over (host → guest) ──────────────────────────────────────
  socket.on('game_over', (score, wave) => {
    const room = getRoomForSocket(socket.id)
    if (!room || room.hostId !== socket.id) return
    socket.to(room.id).emit('game_over', score, wave)
  })

  // ── Chat ──────────────────────────────────────────────────────────────────
  socket.on('chat_message', (text: string) => {
    const room = getRoomForSocket(socket.id)
    if (!room) return
    const player = room.players.find((p) => p.id === socket.id)
    const msg: NetChatMessage = {
      playerId: socket.id,
      name:     player?.name ?? 'Unbekannt',
      text:     text.slice(0, 200),
      ts:       Date.now(),
    }
    room.chatHistory.push(msg)
    if (room.chatHistory.length > 100) room.chatHistory.shift()
    io.to(room.id).emit('chat_message', msg)
  })

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    clearInterval(pingInterval)
    console.log(`[-] ${socket.id}`)
    leaveRoom(socket.id)
  })

  // ── Helper ────────────────────────────────────────────────────────────────
  function leaveRoom(socketId: string) {
    const roomId = playerRoom.get(socketId)
    if (!roomId) return
    const room = rooms.get(roomId)
    playerRoom.delete(socketId)
    if (!room) return

    room.players = room.players.filter((p) => p.id !== socketId)
    io.to(roomId).emit('player_left', socketId)

    if (room.players.length === 0) {
      rooms.delete(roomId)
      console.log(`[room] Deleted empty room ${roomId}`)
    } else if (room.hostId === socketId) {
      // Transfer host to next player
      room.hostId = room.players[0].id
      room.players[0].isHost = true
      room.gameStarted = false
      io.to(roomId).emit('room_updated', sanitize(room))
      console.log(`[room] Host transferred in ${roomId}`)
    } else {
      io.to(roomId).emit('room_updated', sanitize(room))
    }
  }
})

function sanitize(room: Room): NetRoom {
  return { id: room.id, hostId: room.hostId, players: room.players, gameStarted: room.gameStarted }
}

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10)
http.listen(PORT, () => {
  console.log(`Covert Operations server listening on :${PORT}`)
})
