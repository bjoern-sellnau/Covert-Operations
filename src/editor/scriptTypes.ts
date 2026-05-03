import type { EnemyType } from '../game/types'

// ── Action types ─────────────────────────────────────────────────────────────

export type ScriptAction =
  | { type: 'open_door';           targetId: string }
  | { type: 'close_door';          targetId: string }
  | { type: 'camera_pan';          targetId: string }
  | { type: 'show_message';        text: string; duration: number }
  | { type: 'activate_emitter';    targetId: string }
  | { type: 'deactivate_emitter';  targetId: string }
  | { type: 'spawn_enemies';       count: number; enemyType: EnemyType }
  | { type: 'load_level';          levelId: string }

// ── Entity types ─────────────────────────────────────────────────────────────

export interface TriggerEntity {
  type: 'trigger'
  id: string
  x: number; z: number
  w: number; d: number
  label: string
  oneShot: boolean
  actions: ScriptAction[]
}

export interface DoorEntity {
  type: 'door'
  id: string
  x: number; z: number
  angle: number       // rotation Y of door panel (radians)
  w: number           // door panel width
  label: string
  keyId: string       // '' = no key required
  startOpen: boolean
}

export interface KeyEntity {
  type: 'key'
  id: string
  x: number; z: number
  keyId: string
  color: string
  label: string
}

export interface DeathZoneEntity {
  type: 'death_zone'
  id: string
  x: number; z: number
  w: number; d: number
  label: string
  instantKill: boolean
  damagePerSec: number
}

export interface EmitterEntity {
  type: 'emitter'
  id: string
  x: number; z: number
  particleType: 'spark' | 'explosion' | 'blood'
  rate: number        // particles per second
  startActive: boolean
  label: string
}

export interface CameraNodeEntity {
  type: 'camera_node'
  id: string
  x: number; z: number
  camY: number
  lookX: number; lookY: number; lookZ: number
  travelDuration: number
  holdDuration: number
  label: string
}

export interface PortalEntity {
  type: 'portal'
  id: string
  x: number; z: number
  w: number; d: number
  targetLevelId: string
  color: string
  label: string
}

export interface ElevatorEntity {
  type: 'elevator'
  id: string
  x: number; z: number
  w: number; d: number
  targetLevelId: string
  direction: 'up' | 'down'
  travelDuration: number
  label: string
}

export type ScriptEntity =
  | TriggerEntity
  | DoorEntity
  | KeyEntity
  | DeathZoneEntity
  | EmitterEntity
  | CameraNodeEntity
  | PortalEntity
  | ElevatorEntity

export type ScriptEntityType = ScriptEntity['type']

// ── Default factories ────────────────────────────────────────────────────────

let _seq = Date.now()
export const newScriptId = (type: ScriptEntityType) => `${type[0]}-${_seq++}`

export function defaultEntity(type: ScriptEntityType, x: number, z: number): ScriptEntity {
  const base = { id: newScriptId(type), x, z }
  switch (type) {
    case 'trigger':     return { ...base, type, w: 3, d: 3, label: 'Trigger', oneShot: true, actions: [] }
    case 'door':        return { ...base, type, angle: 0, w: 2, label: 'Tür', keyId: '', startOpen: false }
    case 'key':         return { ...base, type, keyId: 'key1', color: '#ffcc00', label: 'Schlüssel' }
    case 'death_zone':  return { ...base, type, w: 4, d: 4, label: 'Todeszone', instantKill: false, damagePerSec: 20 }
    case 'emitter':     return { ...base, type, particleType: 'spark', rate: 5, startActive: true, label: 'Emitter' }
    case 'camera_node': return { ...base, type, camY: 18, lookX: 0, lookY: 0, lookZ: 0, travelDuration: 2, holdDuration: 3, label: 'Kamera' }
    case 'portal':      return { ...base, type, w: 2, d: 0.3, targetLevelId: '', color: '#aa44ff', label: 'Portal' }
    case 'elevator':    return { ...base, type, w: 3, d: 3, targetLevelId: '', direction: 'up', travelDuration: 2, label: 'Fahrstuhl' }
  }
}

// ── Entity display config ────────────────────────────────────────────────────

export const ENTITY_CFG: Record<ScriptEntityType, { label: string; color: string; icon: string }> = {
  trigger:     { label: 'Trigger',      color: '#ffcc00', icon: '⚡' },
  door:        { label: 'Tür',          color: '#ff8800', icon: '🚪' },
  key:         { label: 'Schlüssel',    color: '#ffee44', icon: '🔑' },
  death_zone:  { label: 'Todeszone',    color: '#ff2200', icon: '☠' },
  emitter:     { label: 'Emitter',      color: '#00ccff', icon: '✦' },
  camera_node: { label: 'Kamera',       color: '#4488ff', icon: '📷' },
  portal:      { label: 'Portal',       color: '#cc44ff', icon: '◈' },
  elevator:    { label: 'Fahrstuhl',    color: '#44ffcc', icon: '▲' },
}
