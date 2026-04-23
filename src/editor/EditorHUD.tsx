import { useState, useRef } from 'react'
import { useEditorStore, OBJECT_TYPE_CFGS, type ObjectType, type ViewMode, type ToolMode, type Level } from './editorStore'
import { useGameStore } from '../store/gameStore'

const C = {
  bg: '#08080f',
  panel: '#0d0d1a',
  border: '#1a1a2e',
  borderHi: '#00aaff',
  text: '#aaaacc',
  textDim: '#445566',
  accent: '#00aaff',
  accentGlow: '#00aaff44',
  danger: '#ff3333',
  success: '#00ff88',
} as const

const btn = (active = false, danger = false): React.CSSProperties => ({
  background: active ? (danger ? '#330000' : '#001a33') : 'transparent',
  border: `1px solid ${active ? (danger ? C.danger : C.borderHi) : C.border}`,
  color: active ? (danger ? C.danger : C.accent) : C.textDim,
  padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
  borderRadius: 2, transition: 'all 0.12s',
})

// ── Small input ──────────────────────────────────────────────────────────────
function PropInput({ label, value, onChange, step = 0.5 }: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <div style={{ color: C.textDim, fontSize: 10, letterSpacing: 1, width: 30 }}>{label}</div>
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{
          flex: 1, background: '#06060e', border: `1px solid ${C.border}`, borderRadius: 2,
          color: C.text, fontFamily: 'inherit', fontSize: 11, padding: '3px 6px',
          outline: 'none', width: 0,
        }}
      />
    </div>
  )
}

// ── Properties panel ─────────────────────────────────────────────────────────
function PropertiesPanel() {
  const { getSelectedObject, selectedObjectId, updateObject, deleteObject } = useEditorStore()
  const obj = getSelectedObject()

  if (!obj || !selectedObjectId) {
    return (
      <div style={{ color: C.textDim, fontSize: 11, lineHeight: 1.7 }}>
        Kein Objekt<br />ausgewählt.<br /><br />
        <span style={{ fontSize: 10 }}>Klick = Auswählen<br />R = Rotieren 45°<br />Entf = Löschen</span>
      </div>
    )
  }

  const toDeg = (r: number) => Math.round((r * 180) / Math.PI)
  const toRad = (d: number) => (d * Math.PI) / 180

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ color: C.accent, fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 }}>
        {OBJECT_TYPE_CFGS[obj.type].label.toUpperCase()}
      </div>

      <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>POSITION</div>
      <PropInput label="X" value={obj.x} onChange={(v) => updateObject(selectedObjectId, { x: v })} />
      <PropInput label="Z" value={obj.z} onChange={(v) => updateObject(selectedObjectId, { z: v })} />

      <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 2, margin: '10px 0 6px' }}>ROTATION</div>
      <PropInput
        label="°Y"
        value={toDeg(obj.rotY)}
        step={45}
        onChange={(v) => updateObject(selectedObjectId, { rotY: toRad(v) })}
      />

      <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 2, margin: '10px 0 6px' }}>GRÖSSE</div>
      <PropInput label="SX" value={obj.sx} onChange={(v) => updateObject(selectedObjectId, { sx: Math.max(0.1, v) })} />
      <PropInput label="SZ" value={obj.sz} onChange={(v) => updateObject(selectedObjectId, { sz: Math.max(0.1, v) })} />

      <button
        style={{ ...btn(false, true), marginTop: 16, width: '100%', padding: '7px' }}
        onClick={() => deleteObject(selectedObjectId)}
      >
        Löschen (Entf)
      </button>
    </div>
  )
}

// ── Level list ───────────────────────────────────────────────────────────────
function LevelList() {
  const { levels, currentLevelId, setCurrentLevel, deleteLevel, renameLevel } = useEditorStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  if (levels.length === 0) {
    return <div style={{ color: C.textDim, fontSize: 10 }}>Noch keine Level.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {levels.map((l) => {
        const active = l.id === currentLevelId
        return (
          <div key={l.id} style={{
            background: active ? '#001a33' : 'transparent',
            border: `1px solid ${active ? C.borderHi : C.border}`,
            borderRadius: 2, padding: '5px 8px',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {editingId === l.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => { renameLevel(l.id, draft || l.name); setEditingId(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { renameLevel(l.id, draft || l.name); setEditingId(null) } }}
                style={{ flex: 1, background: '#06060e', border: 'none', color: C.text, fontFamily: 'inherit', fontSize: 11, outline: 'none' }}
              />
            ) : (
              <span
                style={{ flex: 1, color: active ? C.accent : C.text, fontSize: 11, cursor: 'pointer' }}
                onClick={() => setCurrentLevel(l.id)}
                onDoubleClick={() => { setEditingId(l.id); setDraft(l.name) }}
              >
                {l.name}
              </span>
            )}
            <span
              style={{ color: C.textDim, fontSize: 9, cursor: 'pointer', padding: '0 2px' }}
              onClick={() => { if (confirm(`"${l.name}" löschen?`)) deleteLevel(l.id) }}
            >✕</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main HUD ─────────────────────────────────────────────────────────────────
export function EditorHUD() {
  const {
    viewMode, toolMode, placeType,
    currentLevelId, getCurrentLevel,
    setViewMode, setToolMode, setPlaceType,
    createLevel, importLevel, setActivePlayLevel,
  } = useEditorStore()

  const setPhase = useGameStore((s) => s.setPhase)
  const setPlaytesting = useGameStore((s) => s.setPlaytesting)
  const [fpsCursor, setFpsCursor] = useState(false)
  const lockedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const level = getCurrentLevel()
    if (!level) return
    const blob = new Blob([JSON.stringify(level, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${level.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Level
        if (!data.name || !Array.isArray(data.objects)) throw new Error('invalid')
        importLevel(data)
      } catch {
        alert('Ungültige Level-Datei.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const viewModes: [ViewMode, string][] = [['topdown', 'Top'], ['perspective', 'Perspektive'], ['fps', 'Ego']]
  const toolModes: [ToolMode, string][] = [['select', 'Auswahl'], ['place', 'Platzieren'], ['delete', 'Löschen']]
  const objectTypes = Object.keys(OBJECT_TYPE_CFGS) as ObjectType[]

  const handlePlayTest = () => {
    const level = getCurrentLevel()
    if (!level) { alert('Kein Level ausgewählt!'); return }
    setActivePlayLevel(level)
    setPlaytesting(true)
    setPhase('playing')
  }

  // FPS click-to-lock hint
  const handleCanvasClick = () => {
    if (viewMode === 'fps' && !lockedRef.current) {
      lockedRef.current = true
      setFpsCursor(true)
    }
  }

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    background: `${C.panel}ee`,
    border: `1px solid ${C.border}`,
    backdropFilter: 'blur(4px)',
  }

  const topH = 48
  const leftW = 168
  const rightW = 192

  return (
    <div
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: "'Courier New', monospace" }}
      onClick={handleCanvasClick}
    >
      {/* ── Top toolbar ── */}
      <div style={{
        ...panelStyle,
        top: 0, left: 0, right: 0, height: topH,
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
        pointerEvents: 'auto',
      }}>
        {/* View mode */}
        <div style={{ display: 'flex', gap: 4 }}>
          {viewModes.map(([m, label]) => (
            <button key={m} style={btn(viewMode === m)} onClick={() => setViewMode(m)}>{label}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 28, background: C.border }} />

        {/* Tool mode */}
        <div style={{ display: 'flex', gap: 4 }}>
          {toolModes.map(([m, label]) => (
            <button key={m} style={btn(toolMode === m, m === 'delete')} onClick={() => setToolMode(m)}>{label}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 28, background: C.border }} />

        {/* New level */}
        <button style={btn()} onClick={() => createLevel()}>+ Level</button>

        {/* Import */}
        <button style={btn()} onClick={() => fileInputRef.current?.click()}>↑ Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

        <div style={{ flex: 1 }} />

        {/* Current level name + export */}
        {currentLevelId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: C.textDim, fontSize: 11 }}>{getCurrentLevel()?.name ?? '—'}</div>
            <button style={btn()} onClick={handleExport}>↓ Export</button>
          </div>
        )}

        <div style={{ width: 1, height: 28, background: C.border }} />

        {/* Play test */}
        <button
          style={{
            ...btn(),
            background: currentLevelId ? '#003300' : 'transparent',
            border: `1px solid ${currentLevelId ? C.success : C.border}`,
            color: currentLevelId ? C.success : C.textDim,
            padding: '5px 16px', fontWeight: 'bold', letterSpacing: 2,
          }}
          onClick={handlePlayTest}
          disabled={!currentLevelId}
        >
          ▶ TESTEN
        </button>
      </div>

      {/* ── Left panel: palette + levels ── */}
      <div style={{
        ...panelStyle,
        top: topH, left: 0, bottom: 0, width: leftW,
        padding: '12px 10px', overflowY: 'auto',
        pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 3, marginBottom: 8 }}>OBJEKTE</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {objectTypes.map((t) => {
            const cfg = OBJECT_TYPE_CFGS[t]
            const active = toolMode === 'place' && placeType === t
            return (
              <button
                key={t}
                style={{
                  ...btn(active),
                  display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                  padding: '7px 10px',
                }}
                onClick={() => { setToolMode('place'); setPlaceType(t) }}
              >
                <div style={{ width: 10, height: 10, borderRadius: cfg.isCylinder ? '50%' : 2, background: cfg.color, flexShrink: 0 }} />
                {cfg.label}
              </button>
            )
          })}
        </div>

        <div style={{ height: 1, background: C.border, margin: '4px 0 12px' }} />
        <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 3, marginBottom: 8 }}>LEVEL</div>
        <LevelList />
      </div>

      {/* ── Right panel: properties ── */}
      <div style={{
        ...panelStyle,
        top: topH, right: 0, bottom: 0, width: rightW,
        padding: '12px', overflowY: 'auto', pointerEvents: 'auto',
      }}>
        <div style={{ color: C.textDim, fontSize: 9, letterSpacing: 3, marginBottom: 12 }}>EIGENSCHAFTEN</div>
        <PropertiesPanel />
      </div>

      {/* ── FPS hints ── */}
      {viewMode === 'fps' && !fpsCursor && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#00000088', border: `1px solid ${C.border}`,
          padding: '16px 28px', color: C.text, fontSize: 13, letterSpacing: 2,
          textAlign: 'center', pointerEvents: 'none',
        }}>
          KLICKEN um Egoperspektive zu aktivieren<br />
          <span style={{ color: C.textDim, fontSize: 10 }}>WASD bewegen · Escape beenden</span>
        </div>
      )}

      {/* ── Center crosshair info strip ── */}
      <div style={{
        position: 'absolute',
        bottom: 12, left: '50%', transform: 'translateX(-50%)',
        color: C.textDim, fontSize: 10, letterSpacing: 1,
        pointerEvents: 'none', textAlign: 'center',
      }}>
        {toolMode === 'place' && `Klick = ${OBJECT_TYPE_CFGS[placeType].label} platzieren`}
        {toolMode === 'select' && 'Klick = Auswählen · Ziehen = Bewegen · R = Rotieren 45°'}
        {toolMode === 'delete' && 'Klick auf Objekt = Löschen'}
        {viewMode !== 'topdown' && toolMode === 'select' && ' · Rechte Maustaste = Kamera'}
      </div>
    </div>
  )
}
