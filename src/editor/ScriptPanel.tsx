import { useState } from 'react'
import { useEditorStore } from './editorStore'
import type { ScriptEntity, ScriptEntityType, ScriptAction, TriggerEntity, DoorEntity, KeyEntity, DeathZoneEntity, EmitterEntity, CameraNodeEntity, PortalEntity } from './scriptTypes'
import { ENTITY_CFG } from './scriptTypes'
import type { EnemyType } from '../game/types'

const C = {
  bg: '#08080f',
  panel: '#0d0d1a',
  border: '#1a1a2e',
  borderHi: '#00aaff',
  text: '#aaaacc',
  textDim: '#445566',
  accent: '#00aaff',
  danger: '#ff3333',
  success: '#00ff88',
} as const

const btn = (active = false, danger = false, small = false): React.CSSProperties => ({
  background: active ? (danger ? '#330000' : '#001a33') : 'transparent',
  border: `1px solid ${active ? (danger ? C.danger : C.borderHi) : C.border}`,
  color: active ? (danger ? C.danger : C.accent) : C.textDim,
  padding: small ? '3px 7px' : '5px 10px',
  cursor: 'pointer', fontFamily: 'inherit',
  fontSize: small ? 10 : 11, letterSpacing: 1,
  textTransform: 'uppercase' as const,
  borderRadius: 2, transition: 'all 0.12s',
})

function PropInput({ label, value, onChange, step = 0.5, width = 60 }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; width?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <div style={{ color: C.textDim, fontSize: 10, letterSpacing: 1, minWidth: 56 }}>{label}</div>
      <input
        type="number" value={Math.round(value * 100) / 100} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{
          width, background: '#06060e', border: `1px solid ${C.border}`, borderRadius: 2,
          color: C.text, fontFamily: 'inherit', fontSize: 11, padding: '3px 6px', outline: 'none',
        }}
      />
    </div>
  )
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <div style={{ color: C.textDim, fontSize: 10, letterSpacing: 1, minWidth: 56 }}>{label}</div>
      <input
        type="text" value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, background: '#06060e', border: `1px solid ${C.border}`, borderRadius: 2,
          color: C.text, fontFamily: 'inherit', fontSize: 11, padding: '3px 6px', outline: 'none',
        }}
      />
    </div>
  )
}

function CheckInput({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: C.accent }} />
      <div style={{ color: C.textDim, fontSize: 10, letterSpacing: 1 }}>{label}</div>
    </div>
  )
}

function SelectInput({ label, value, options, onChange }: {
  label: string; value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <div style={{ color: C.textDim, fontSize: 10, letterSpacing: 1, minWidth: 56 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, background: '#06060e', border: `1px solid ${C.border}`, borderRadius: 2,
          color: C.text, fontFamily: 'inherit', fontSize: 11, padding: '3px 6px', outline: 'none',
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── Action editor for triggers ───────────────────────────────────────────────

const ACTION_TYPES: { value: ScriptAction['type']; label: string }[] = [
  { value: 'open_door',           label: 'Tür öffnen' },
  { value: 'close_door',          label: 'Tür schließen' },
  { value: 'camera_pan',          label: 'Kamera schwenken' },
  { value: 'show_message',        label: 'Nachricht zeigen' },
  { value: 'activate_emitter',    label: 'Emitter aktivieren' },
  { value: 'deactivate_emitter',  label: 'Emitter deaktivieren' },
  { value: 'spawn_enemies',       label: 'Gegner spawnen' },
  { value: 'load_level',          label: 'Level laden' },
]

const ENEMY_TYPES: { value: EnemyType; label: string }[] = [
  { value: 'basic', label: 'Soldat' },
  { value: 'fast',  label: 'Schneller' },
  { value: 'tank',  label: 'Schwerer' },
]

function defaultAction(type: ScriptAction['type']): ScriptAction {
  switch (type) {
    case 'open_door':          return { type, targetId: '' }
    case 'close_door':         return { type, targetId: '' }
    case 'camera_pan':         return { type, targetId: '' }
    case 'show_message':       return { type, text: 'Nachricht', duration: 3 }
    case 'activate_emitter':   return { type, targetId: '' }
    case 'deactivate_emitter': return { type, targetId: '' }
    case 'spawn_enemies':      return { type, count: 3, enemyType: 'basic' }
    case 'load_level':         return { type, levelId: '' }
  }
}

function ActionRow({ action, onChange, onDelete }: {
  action: ScriptAction
  onChange: (a: ScriptAction) => void
  onDelete: () => void
}) {
  return (
    <div style={{ background: '#0a0a18', border: `1px solid ${C.border}`, borderRadius: 2, padding: '6px 8px', marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <select
          value={action.type}
          onChange={(e) => onChange(defaultAction(e.target.value as ScriptAction['type']))}
          style={{ flex: 1, background: '#06060e', border: `1px solid ${C.border}`, color: C.text, fontFamily: 'inherit', fontSize: 10, padding: '2px 4px', outline: 'none', borderRadius: 2 }}
        >
          {ACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button style={btn(false, true, true)} onClick={onDelete}>✕</button>
      </div>

      {(action.type === 'open_door' || action.type === 'close_door' || action.type === 'camera_pan' || action.type === 'activate_emitter' || action.type === 'deactivate_emitter') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ color: C.textDim, fontSize: 10, minWidth: 40 }}>Ziel-ID</div>
          <input value={action.targetId} onChange={(e) => onChange({ ...action, targetId: e.target.value } as ScriptAction)}
            style={{ flex: 1, background: '#06060e', border: `1px solid ${C.border}`, color: C.text, fontFamily: 'inherit', fontSize: 10, padding: '2px 5px', outline: 'none', borderRadius: 2 }}
            placeholder="Entity-ID"
          />
        </div>
      )}

      {action.type === 'show_message' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ color: C.textDim, fontSize: 10, minWidth: 40 }}>Text</div>
            <input value={action.text} onChange={(e) => onChange({ ...action, text: e.target.value })}
              style={{ flex: 1, background: '#06060e', border: `1px solid ${C.border}`, color: C.text, fontFamily: 'inherit', fontSize: 10, padding: '2px 5px', outline: 'none', borderRadius: 2 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ color: C.textDim, fontSize: 10, minWidth: 40 }}>Dauer</div>
            <input type="number" value={action.duration} step={0.5}
              onChange={(e) => onChange({ ...action, duration: parseFloat(e.target.value) || 1 })}
              style={{ width: 60, background: '#06060e', border: `1px solid ${C.border}`, color: C.text, fontFamily: 'inherit', fontSize: 10, padding: '2px 5px', outline: 'none', borderRadius: 2 }}
            />
          </div>
        </div>
      )}

      {action.type === 'spawn_enemies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ color: C.textDim, fontSize: 10, minWidth: 40 }}>Anzahl</div>
            <input type="number" value={action.count} min={1} max={20} step={1}
              onChange={(e) => onChange({ ...action, count: Math.max(1, parseInt(e.target.value) || 1) })}
              style={{ width: 60, background: '#06060e', border: `1px solid ${C.border}`, color: C.text, fontFamily: 'inherit', fontSize: 10, padding: '2px 5px', outline: 'none', borderRadius: 2 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ color: C.textDim, fontSize: 10, minWidth: 40 }}>Typ</div>
            <select value={action.enemyType} onChange={(e) => onChange({ ...action, enemyType: e.target.value as EnemyType })}
              style={{ flex: 1, background: '#06060e', border: `1px solid ${C.border}`, color: C.text, fontFamily: 'inherit', fontSize: 10, padding: '2px 4px', outline: 'none', borderRadius: 2 }}
            >
              {ENEMY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {action.type === 'load_level' && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ color: C.textDim, fontSize: 10, minWidth: 40 }}>Level-ID</div>
          <input value={action.levelId} onChange={(e) => onChange({ ...action, levelId: e.target.value })}
            style={{ flex: 1, background: '#06060e', border: `1px solid ${C.border}`, color: C.text, fontFamily: 'inherit', fontSize: 10, padding: '2px 5px', outline: 'none', borderRadius: 2 }}
            placeholder="lvl-..."
          />
        </div>
      )}
    </div>
  )
}

// ── Per-entity property forms ────────────────────────────────────────────────

function TriggerProps({ entity, update }: { entity: TriggerEntity; update: (c: Partial<TriggerEntity>) => void }) {
  const changeAction = (i: number, a: ScriptAction) => {
    const actions = entity.actions.map((x, j) => j === i ? a : x)
    update({ actions })
  }
  const removeAction = (i: number) => {
    update({ actions: entity.actions.filter((_, j) => j !== i) })
  }
  const addAction = () => {
    update({ actions: [...entity.actions, defaultAction('open_door')] })
  }

  return (
    <div>
      <TextInput label="Label" value={entity.label} onChange={(v) => update({ label: v })} />
      <PropInput label="Breite" value={entity.w} onChange={(v) => update({ w: Math.max(0.5, v) })} />
      <PropInput label="Tiefe" value={entity.d} onChange={(v) => update({ d: Math.max(0.5, v) })} />
      <CheckInput label="Einmalig" value={entity.oneShot} onChange={(v) => update({ oneShot: v })} />
      <div style={{ height: 1, background: C.border, margin: '8px 0 6px' }} />
      <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>AKTIONEN ({entity.actions.length})</div>
      {entity.actions.map((a, i) => (
        <ActionRow key={i} action={a} onChange={(na) => changeAction(i, na)} onDelete={() => removeAction(i)} />
      ))}
      <button style={{ ...btn(), width: '100%', padding: '5px' }} onClick={addAction}>+ Aktion</button>
    </div>
  )
}

function DoorProps({ entity, update }: { entity: DoorEntity; update: (c: Partial<DoorEntity>) => void }) {
  return (
    <div>
      <TextInput label="Label" value={entity.label} onChange={(v) => update({ label: v })} />
      <PropInput label="Breite" value={entity.w} onChange={(v) => update({ w: Math.max(0.5, v) })} />
      <PropInput label="Winkel°" value={Math.round(entity.angle * 180 / Math.PI)} step={15}
        onChange={(v) => update({ angle: v * Math.PI / 180 })} />
      <TextInput label="Schlüssel-ID" value={entity.keyId} onChange={(v) => update({ keyId: v })} />
      <CheckInput label="Offen beim Start" value={entity.startOpen} onChange={(v) => update({ startOpen: v })} />
    </div>
  )
}

function KeyProps({ entity, update }: { entity: KeyEntity; update: (c: Partial<KeyEntity>) => void }) {
  return (
    <div>
      <TextInput label="Label" value={entity.label} onChange={(v) => update({ label: v })} />
      <TextInput label="Schlüssel-ID" value={entity.keyId} onChange={(v) => update({ keyId: v })} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ color: C.textDim, fontSize: 10, minWidth: 56 }}>Farbe</div>
        <input type="color" value={entity.color} onChange={(e) => update({ color: e.target.value })}
          style={{ width: 40, height: 22, padding: 1, background: 'none', border: `1px solid ${C.border}`, cursor: 'pointer', borderRadius: 2 }}
        />
        <span style={{ color: C.text, fontSize: 10 }}>{entity.color}</span>
      </div>
    </div>
  )
}

function DeathZoneProps({ entity, update }: { entity: DeathZoneEntity; update: (c: Partial<DeathZoneEntity>) => void }) {
  return (
    <div>
      <TextInput label="Label" value={entity.label} onChange={(v) => update({ label: v })} />
      <PropInput label="Breite" value={entity.w} onChange={(v) => update({ w: Math.max(0.5, v) })} />
      <PropInput label="Tiefe" value={entity.d} onChange={(v) => update({ d: Math.max(0.5, v) })} />
      <CheckInput label="Sofortiger Tod" value={entity.instantKill} onChange={(v) => update({ instantKill: v })} />
      {!entity.instantKill && (
        <PropInput label="Schaden/Sek" value={entity.damagePerSec} step={5}
          onChange={(v) => update({ damagePerSec: Math.max(1, v) })} />
      )}
    </div>
  )
}

function EmitterProps({ entity, update }: { entity: EmitterEntity; update: (c: Partial<EmitterEntity>) => void }) {
  return (
    <div>
      <TextInput label="Label" value={entity.label} onChange={(v) => update({ label: v })} />
      <SelectInput label="Partikel" value={entity.particleType}
        options={[{ value: 'spark', label: 'Funken' }, { value: 'explosion', label: 'Explosion' }, { value: 'blood', label: 'Blut' }]}
        onChange={(v) => update({ particleType: v as EmitterEntity['particleType'] })}
      />
      <PropInput label="Rate/Sek" value={entity.rate} step={1} onChange={(v) => update({ rate: Math.max(0.1, v) })} />
      <CheckInput label="Aktiv beim Start" value={entity.startActive} onChange={(v) => update({ startActive: v })} />
    </div>
  )
}

function CameraNodeProps({ entity, update }: { entity: CameraNodeEntity; update: (c: Partial<CameraNodeEntity>) => void }) {
  return (
    <div>
      <TextInput label="Label" value={entity.label} onChange={(v) => update({ label: v })} />
      <PropInput label="Kamera Y" value={entity.camY} onChange={(v) => update({ camY: v })} />
      <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 2, margin: '6px 0 4px' }}>BLICKRICHTUNG</div>
      <PropInput label="LookX" value={entity.lookX} onChange={(v) => update({ lookX: v })} />
      <PropInput label="LookY" value={entity.lookY} onChange={(v) => update({ lookY: v })} />
      <PropInput label="LookZ" value={entity.lookZ} onChange={(v) => update({ lookZ: v })} />
      <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 2, margin: '6px 0 4px' }}>TIMING</div>
      <PropInput label="Reise (s)" value={entity.travelDuration} step={0.5} onChange={(v) => update({ travelDuration: Math.max(0.1, v) })} />
      <PropInput label="Halt (s)" value={entity.holdDuration} step={0.5} onChange={(v) => update({ holdDuration: Math.max(0, v) })} />
    </div>
  )
}

function PortalProps({ entity, update }: { entity: PortalEntity; update: (c: Partial<PortalEntity>) => void }) {
  const { levels } = useEditorStore()
  return (
    <div>
      <TextInput label="Label" value={entity.label} onChange={(v) => update({ label: v })} />
      <PropInput label="Breite" value={entity.w} onChange={(v) => update({ w: Math.max(0.5, v) })} />
      <PropInput label="Tiefe" value={entity.d} onChange={(v) => update({ d: Math.max(0.1, v) })} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ color: C.textDim, fontSize: 10, minWidth: 56 }}>Farbe</div>
        <input type="color" value={entity.color} onChange={(e) => update({ color: e.target.value })}
          style={{ width: 40, height: 22, padding: 1, background: 'none', border: `1px solid ${C.border}`, cursor: 'pointer', borderRadius: 2 }}
        />
      </div>
      <SelectInput label="Ziel-Level" value={entity.targetLevelId}
        options={[{ value: '', label: '— kein —' }, ...levels.map((l) => ({ value: l.id, label: l.name }))]}
        onChange={(v) => update({ targetLevelId: v })}
      />
    </div>
  )
}

// ── Selected entity panel ────────────────────────────────────────────────────

function SelectedEntityProps() {
  const { getSelectedScriptEntity, selectedScriptId, updateScriptEntity, deleteScriptEntity } = useEditorStore()
  const entity = getSelectedScriptEntity()

  if (!entity || !selectedScriptId) {
    return (
      <div style={{ color: C.textDim, fontSize: 11, lineHeight: 1.7 }}>
        Kein Script-Entity<br />ausgewählt.
      </div>
    )
  }

  const cfg = ENTITY_CFG[entity.type]
  const update = (changes: Partial<ScriptEntity>) => updateScriptEntity(selectedScriptId, changes)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>{cfg.icon}</span>
        <div style={{ color: cfg.color, fontSize: 12, fontWeight: 'bold', letterSpacing: 2, flex: 1 }}>
          {cfg.label.toUpperCase()}
        </div>
      </div>
      <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>POSITION</div>
      <PropInput label="X" value={entity.x} onChange={(v) => update({ x: v })} />
      <PropInput label="Z" value={entity.z} onChange={(v) => update({ z: v })} />
      <div style={{ height: 1, background: C.border, margin: '8px 0 8px' }} />
      <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>EIGENSCHAFTEN</div>

      {entity.type === 'trigger'     && <TriggerProps     entity={entity} update={update as (c: Partial<TriggerEntity>) => void} />}
      {entity.type === 'door'        && <DoorProps        entity={entity} update={update as (c: Partial<DoorEntity>) => void} />}
      {entity.type === 'key'         && <KeyProps         entity={entity} update={update as (c: Partial<KeyEntity>) => void} />}
      {entity.type === 'death_zone'  && <DeathZoneProps   entity={entity} update={update as (c: Partial<DeathZoneEntity>) => void} />}
      {entity.type === 'emitter'     && <EmitterProps     entity={entity} update={update as (c: Partial<EmitterEntity>) => void} />}
      {entity.type === 'camera_node' && <CameraNodeProps  entity={entity} update={update as (c: Partial<CameraNodeEntity>) => void} />}
      {entity.type === 'portal'      && <PortalProps      entity={entity} update={update as (c: Partial<PortalEntity>) => void} />}

      <button
        style={{ ...btn(false, true), marginTop: 12, width: '100%', padding: '7px' }}
        onClick={() => deleteScriptEntity(selectedScriptId)}
      >
        Löschen (Entf)
      </button>
    </div>
  )
}

// ── Entity list ──────────────────────────────────────────────────────────────

const ENTITY_TYPES: ScriptEntityType[] = ['trigger', 'door', 'key', 'death_zone', 'emitter', 'camera_node', 'portal']

export function ScriptPanel() {
  const {
    getCurrentLevel, selectedScriptId, selectScriptEntity,
    scriptPlaceType, setScriptPlaceType, toggleFogOfWar,
  } = useEditorStore()
  const level = getCurrentLevel()
  const [tab, setTab] = useState<'list' | 'props'>('list')

  if (!level) {
    return <div style={{ color: C.textDim, fontSize: 11 }}>Kein Level ausgewählt.</div>
  }

  const entities = level.scriptEntities ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Fog of war toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 2 }}>KRIEGSNEBEL</div>
        <button
          style={{
            ...btn(level.fogOfWar),
            padding: '3px 10px', fontSize: 10,
            borderColor: level.fogOfWar ? '#6644aa' : C.border,
            color: level.fogOfWar ? '#cc88ff' : C.textDim,
            background: level.fogOfWar ? '#1a0033' : 'transparent',
          }}
          onClick={toggleFogOfWar}
        >
          {level.fogOfWar ? '■ AN' : '□ AUS'}
        </button>
      </div>

      <div style={{ height: 1, background: C.border, marginBottom: 10 }} />

      {/* Add entity buttons */}
      <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>HINZUFÜGEN</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>
        {ENTITY_TYPES.map((t) => {
          const cfg = ENTITY_CFG[t]
          const isActive = scriptPlaceType === t
          return (
            <button
              key={t}
              style={{
                background: isActive ? cfg.color + '22' : 'transparent',
                border: `1px solid ${isActive ? cfg.color : C.border}`,
                color: isActive ? cfg.color : C.textDim,
                padding: '3px 6px', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 10, borderRadius: 2, transition: 'all 0.1s',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
              onClick={() => setScriptPlaceType(isActive ? null : t)}
              title={`${cfg.label} platzieren`}
            >
              <span>{cfg.icon}</span>
              <span style={{ letterSpacing: 0.5 }}>{cfg.label}</span>
            </button>
          )
        })}
      </div>

      {scriptPlaceType && (
        <div style={{
          background: '#0a0f1a', border: `1px solid ${ENTITY_CFG[scriptPlaceType].color}44`,
          borderRadius: 2, padding: '5px 8px', marginBottom: 8, fontSize: 10,
          color: ENTITY_CFG[scriptPlaceType].color,
        }}>
          {ENTITY_CFG[scriptPlaceType].icon} {ENTITY_CFG[scriptPlaceType].label} platzieren — Klick auf Boden
        </div>
      )}

      <div style={{ height: 1, background: C.border, marginBottom: 10 }} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
        <button style={{ ...btn(tab === 'list', false, true), flex: 1 }} onClick={() => setTab('list')}>
          Liste ({entities.length})
        </button>
        <button style={{ ...btn(tab === 'props', false, true), flex: 1 }} onClick={() => setTab('props')}>
          Eigenschaften
        </button>
      </div>

      {tab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', flex: 1 }}>
          {entities.length === 0 && (
            <div style={{ color: C.textDim, fontSize: 10 }}>Keine Script-Entities.</div>
          )}
          {entities.map((e) => {
            const cfg = ENTITY_CFG[e.type]
            const active = e.id === selectedScriptId
            return (
              <div
                key={e.id}
                style={{
                  background: active ? cfg.color + '18' : 'transparent',
                  border: `1px solid ${active ? cfg.color + '88' : C.border}`,
                  borderRadius: 2, padding: '5px 8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.1s',
                }}
                onClick={() => { selectScriptEntity(active ? null : e.id); if (!active) setTab('props') }}
              >
                <span style={{ fontSize: 12 }}>{cfg.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: active ? cfg.color : C.text, fontSize: 10, letterSpacing: 1 }}>
                    {'label' in e ? (e as { label: string }).label : cfg.label}
                  </div>
                  <div style={{ color: C.textDim, fontSize: 9 }}>
                    {cfg.label} · ({Math.round(e.x)}, {Math.round(e.z)})
                  </div>
                </div>
                <div style={{ color: C.textDim, fontSize: 8, fontFamily: 'monospace' }}>
                  {e.id.slice(0, 8)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'props' && (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <SelectedEntityProps />
        </div>
      )}
    </div>
  )
}
