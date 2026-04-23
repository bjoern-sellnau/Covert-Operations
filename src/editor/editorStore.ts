import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ObjectType = 'wall' | 'pillar' | 'cover' | 'crate' | 'spawn'
export type ViewMode = 'topdown' | 'perspective' | 'fps'
export type ToolMode = 'select' | 'place' | 'delete'

export interface LevelObject {
  id: string
  type: ObjectType
  x: number
  z: number
  rotY: number  // radians, snapped to 45° increments
  sx: number    // scale X (width / diameter)
  sz: number    // scale Z (depth)
}

export interface Level {
  id: string
  name: string
  objects: LevelObject[]
}

export interface ObjectTypeCfg {
  label: string
  color: string
  emissive: string
  height: number
  defSX: number
  defSZ: number
  isCylinder: boolean
  collisionRadius: number   // 0 = AABB, >0 = circle override
  isSpawn: boolean
}

export const OBJECT_TYPE_CFGS: Record<ObjectType, ObjectTypeCfg> = {
  wall:   { label: 'Mauer',   color: '#2a3a5a', emissive: '#0a1020', height: 2.2, defSX: 4,   defSZ: 0.5, isCylinder: false, collisionRadius: 0,   isSpawn: false },
  pillar: { label: 'Säule',   color: '#1a1a33', emissive: '#08080f', height: 3.0, defSX: 0.8, defSZ: 0.8, isCylinder: true,  collisionRadius: 0.5, isSpawn: false },
  cover:  { label: 'Deckung', color: '#334455', emissive: '#112233', height: 0.9, defSX: 2,   defSZ: 1.5, isCylinder: false, collisionRadius: 0,   isSpawn: false },
  crate:  { label: 'Kiste',   color: '#443322', emissive: '#1a0e00', height: 1.0, defSX: 1,   defSZ: 1,   isCylinder: false, collisionRadius: 0,   isSpawn: false },
  spawn:  { label: 'Spawn',   color: '#ff3333', emissive: '#ff0000', height: 0.1, defSX: 1,   defSZ: 1,   isCylinder: true,  collisionRadius: 0,   isSpawn: true  },
}

let _oidSeq = Date.now()
const newOid = () => `obj-${_oidSeq++}`

let _lidSeq = Date.now() + 100000
const newLid = () => `lvl-${_lidSeq++}`

interface EditorStore {
  levels: Level[]
  currentLevelId: string | null
  selectedObjectId: string | null
  viewMode: ViewMode
  toolMode: ToolMode
  placeType: ObjectType
  activePlayLevel: Level | null   // level sent to game for playtesting

  createLevel: (name?: string) => string
  importLevel: (level: Level) => void
  renameLevel: (id: string, name: string) => void
  deleteLevel: (id: string) => void
  setCurrentLevel: (id: string | null) => void
  getCurrentLevel: () => Level | null

  addObject: (type: ObjectType, x: number, z: number) => LevelObject
  updateObject: (id: string, changes: Partial<Omit<LevelObject, 'id' | 'type'>>) => void
  deleteObject: (id: string) => void
  selectObject: (id: string | null) => void
  getSelectedObject: () => LevelObject | null

  setViewMode: (m: ViewMode) => void
  setToolMode: (m: ToolMode) => void
  setPlaceType: (t: ObjectType) => void
  setActivePlayLevel: (level: Level | null) => void
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      levels: [],
      currentLevelId: null,
      selectedObjectId: null,
      viewMode: 'topdown',
      toolMode: 'select',
      placeType: 'wall',
      activePlayLevel: null,

      createLevel: (name = 'Neues Level') => {
        const id = newLid()
        set((s) => ({ levels: [...s.levels, { id, name, objects: [] }], currentLevelId: id }))
        return id
      },

      importLevel: (level) => {
        const id = newLid()
        const imported: Level = {
          ...level,
          id,
          objects: level.objects.map((o) => ({ ...o, id: newOid() })),
        }
        set((s) => ({ levels: [...s.levels, imported], currentLevelId: id }))
      },

      renameLevel: (id, name) =>
        set((s) => ({ levels: s.levels.map((l) => (l.id === id ? { ...l, name } : l)) })),

      deleteLevel: (id) =>
        set((s) => ({
          levels: s.levels.filter((l) => l.id !== id),
          currentLevelId: s.currentLevelId === id ? (s.levels.find((l) => l.id !== id)?.id ?? null) : s.currentLevelId,
        })),

      setCurrentLevel: (id) => set({ currentLevelId: id, selectedObjectId: null }),

      getCurrentLevel: () => {
        const { levels, currentLevelId } = get()
        return levels.find((l) => l.id === currentLevelId) ?? null
      },

      addObject: (type, x, z) => {
        const cfg = OBJECT_TYPE_CFGS[type]
        const obj: LevelObject = { id: newOid(), type, x, z, rotY: 0, sx: cfg.defSX, sz: cfg.defSZ }
        set((s) => ({
          levels: s.levels.map((l) =>
            l.id === s.currentLevelId ? { ...l, objects: [...l.objects, obj] } : l,
          ),
          selectedObjectId: obj.id,
        }))
        return obj
      },

      updateObject: (id, changes) =>
        set((s) => ({
          levels: s.levels.map((l) =>
            l.id === s.currentLevelId
              ? { ...l, objects: l.objects.map((o) => (o.id === id ? { ...o, ...changes } : o)) }
              : l,
          ),
        })),

      deleteObject: (id) =>
        set((s) => ({
          levels: s.levels.map((l) =>
            l.id === s.currentLevelId ? { ...l, objects: l.objects.filter((o) => o.id !== id) } : l,
          ),
          selectedObjectId: s.selectedObjectId === id ? null : s.selectedObjectId,
        })),

      selectObject: (id) => set({ selectedObjectId: id }),

      getSelectedObject: () => {
        const { getCurrentLevel, selectedObjectId } = get()
        return getCurrentLevel()?.objects.find((o) => o.id === selectedObjectId) ?? null
      },

      setViewMode: (viewMode) => set({ viewMode }),
      setToolMode: (toolMode) => set({ toolMode }),
      setPlaceType: (placeType) => set({ placeType }),
      setActivePlayLevel: (activePlayLevel) => set({ activePlayLevel }),
    }),
    { name: 'covert-ops-editor-v1', partialize: (s) => ({ levels: s.levels, currentLevelId: s.currentLevelId }) },
  ),
)
