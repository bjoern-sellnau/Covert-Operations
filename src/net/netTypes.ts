// ── Shared network protocol types ─────────────────────────────────────────────

export interface NetPlayer {
  id: string
  name: string
  isHost: boolean
}

export interface NetRoom {
  id: string
  hostId: string
  players: NetPlayer[]
  gameStarted: boolean
}

// Compact player snapshot (sent at 20 Hz by host)
export interface NetPlayerSnap {
  id: string
  x: number
  z: number
  a: number    // angle
  h: number    // health
  ammo: number
}

// Compact enemy snapshot
export interface NetEnemySnap {
  id: string
  x: number
  z: number
  h: number
  type: string
}

// Full game state broadcast by host at 20 Hz
export interface NetGameState {
  seq: number
  players: NetPlayerSnap[]
  enemies: NetEnemySnap[]
  wave: number
  score: number
  inBreak: boolean
  waveMsg: string
  p1GrenCount: number
}

// Guest input sent every frame
export interface NetPlayerInput {
  seq: number
  x: number
  z: number
  a: number
  h: number
  ammo: number
  grenCount: number
}

// Bullet spawn event (dead-reckoning — both sides simulate from initial state)
export interface NetBulletSpawn {
  id: string
  x: number
  z: number
  vx: number
  vz: number
  damage: number
  maxBounces: number
  isEnergy: boolean
  isFlak: boolean
  owner: 'host' | 'guest'
}

export interface NetChatMessage {
  playerId: string
  name: string
  text: string
  ts: number
}

// Socket event map
export interface ServerToClientEvents {
  room_updated:   (room: NetRoom) => void
  game_started:   () => void
  game_state:     (state: NetGameState) => void
  player_input:   (input: NetPlayerInput & { playerId: string }) => void
  bullet_spawn:   (bullet: NetBulletSpawn) => void
  bullet_remove:  (id: string) => void
  chat_message:   (msg: NetChatMessage) => void
  player_left:    (playerId: string) => void
  error_msg:      (msg: string) => void
  game_over:      (score: number, wave: number) => void
  ping:           (ts: number) => void
}

export interface ClientToServerEvents {
  create_room:    (name: string, cb: (result: { roomId?: string; error?: string }) => void) => void
  join_room:      (roomId: string, name: string, cb: (result: { room?: NetRoom; error?: string }) => void) => void
  leave_room:     () => void
  start_game:     () => void
  host_state:     (state: NetGameState) => void
  player_input:   (input: NetPlayerInput) => void
  bullet_spawn:   (bullet: NetBulletSpawn) => void
  bullet_remove:  (id: string) => void
  chat_message:   (text: string) => void
  game_over:      (score: number, wave: number) => void
  pong:           (ts: number) => void
}
