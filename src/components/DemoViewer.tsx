import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useDemoStore, type Demo, type DemoFrame } from '../store/demoStore'

const ARENA_HALF = 18

// ── Canvas drawing ─────────────────────────────────────────────────────────

const ENEMY_COLOR: Record<string, string> = {
  basic:      '#cc2222',
  fast:       '#cc6600',
  tank:       '#6600cc',
  berserker:  '#cc0066',
  flanker:    '#cc8800',
  juggernaut: '#334455',
}

function drawFrame(canvas: HTMLCanvasElement, frame: DemoFrame) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const toX = (wx: number) => ((wx / ARENA_HALF + 1) / 2) * W
  const toZ = (wz: number) => ((wz / ARENA_HALF + 1) / 2) * H

  ctx.fillStyle = '#03050c'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#1a2a3a'
  ctx.lineWidth = 1
  ctx.strokeRect(1, 1, W - 2, H - 2)

  // Enemies
  for (const e of frame.e) {
    ctx.fillStyle = ENEMY_COLOR[e.tp] ?? '#cc2222'
    ctx.beginPath()
    ctx.arc(toX(e.x), toZ(e.z), 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // Player
  const px = toX(frame.px), pz = toZ(frame.pz)
  ctx.fillStyle = '#00ff88'
  ctx.beginPath()
  ctx.arc(px, pz, 5, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#00ff88'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(px, pz)
  ctx.lineTo(px + Math.sin(frame.pa) * 12, pz - Math.cos(frame.pa) * 12)
  ctx.stroke()

  // HUD overlay
  ctx.fillStyle = '#00aaff'
  ctx.font = 'bold 11px monospace'
  ctx.fillText(`WAVE ${frame.w}`, 6, 16)
  ctx.fillStyle = '#ffee00'
  ctx.fillText(`${String(frame.s).padStart(6, '0')}`, 6, 30)
  ctx.fillStyle = frame.php > 50 ? '#00ff88' : frame.php > 25 ? '#ffaa00' : '#ff3300'
  ctx.fillText(`HP ${frame.php}`, 6, 44)

  // Enemy count
  ctx.fillStyle = '#445566'
  ctx.fillText(`${frame.e.length} FEINDE`, W - 76, 16)
}

function interpolateFrame(frames: DemoFrame[], elapsed: number): DemoFrame | null {
  if (!frames.length) return null
  if (elapsed <= frames[0].t) return frames[0]
  if (elapsed >= frames[frames.length - 1].t) return frames[frames.length - 1]
  // Binary search for surrounding frames
  let lo = 0, hi = frames.length - 1
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1
    if (frames[mid].t <= elapsed) lo = mid; else hi = mid
  }
  return frames[lo]
}

// ── Duration formatter ─────────────────────────────────────────────────────

function fmtMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── Main component ─────────────────────────────────────────────────────────

const SPEEDS = [0.25, 0.5, 1, 2, 4]

export function DemoViewer() {
  const setPhase = useGameStore((s) => s.setPhase)
  const { demos, deleteDemo, importDemo, viewerReturnTo, cutsceneMap, setCutscene } = useDemoStore()

  const [selected, setSelected] = useState<Demo | null>(null)
  const [playing,  setPlaying]  = useState(false)
  const [elapsed,  setElapsed]  = useState(0)
  const [speed,    setSpeed]    = useState(2)   // index into SPEEDS

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(-1)
  const startRef  = useRef<number>(0)   // performance.now() when play began
  const baseRef   = useRef<number>(0)   // elapsed ms at play-start

  // Draw whenever elapsed changes
  useEffect(() => {
    if (!selected || !canvasRef.current) return
    const frame = interpolateFrame(selected.frames, elapsed)
    if (frame) drawFrame(canvasRef.current, frame)
  }, [elapsed, selected])

  // Playback RAF loop
  useEffect(() => {
    if (!playing || !selected) return
    startRef.current = performance.now()
    baseRef.current  = elapsed

    const loop = (now: number) => {
      const dt = (now - startRef.current) * SPEEDS[speed]
      const next = baseRef.current + dt
      if (next >= selected.duration) {
        setElapsed(selected.duration)
        setPlaying(false)
        return
      }
      setElapsed(next)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, selected, speed])

  const selectDemo = (d: Demo) => {
    setSelected(d)
    setPlaying(false)
    setElapsed(0)
    cancelAnimationFrame(rafRef.current)
  }

  const togglePlay = () => {
    if (elapsed >= (selected?.duration ?? 0)) setElapsed(0)
    setPlaying(p => !p)
  }

  // Export
  const exportDemo = (d: Demo) => {
    const blob = new Blob([JSON.stringify(d)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${d.name.replace(/[^a-z0-9]/gi, '_')}.demo.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // Import
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.demo.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const demo = JSON.parse(ev.target?.result as string) as Demo
          if (!demo.frames || !demo.id) { alert('Ungültige Demo-Datei'); return }
          importDemo(demo)
        } catch { alert('Fehler beim Laden der Demo') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const btn = (label: string, onClick: () => void, active = false, col = '#00aaff') => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px', background: active ? `${col}22` : 'transparent',
        border: `1px solid ${active ? col : '#1a2a3a'}`,
        color: active ? col : '#445566',
        fontSize: 9, letterSpacing: 2, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#04060e',
      fontFamily: "'Courier New', monospace", color: '#aabbcc',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 20px', borderBottom: '1px solid #0e1825', flexShrink: 0,
      }}>
        <button
          onClick={() => setPhase(viewerReturnTo)}
          style={{
            padding: '6px 14px', background: 'transparent',
            border: '1px solid #1a2a3a', color: '#445566',
            fontSize: 10, letterSpacing: 2, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {viewerReturnTo === 'editor' ? '← EDITOR' : '← ZURÜCK'}
        </button>
        <div style={{ color: '#00aaff', fontSize: 18, fontWeight: 'bold', letterSpacing: 6, textShadow: '0 0 12px #00aaff66' }}>
          DEMOS
        </div>
        <div style={{ flex: 1 }} />
        {btn('⬆ IMPORTIEREN', handleImport)}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Demo list */}
        <div style={{
          width: 280, flexShrink: 0, borderRight: '1px solid #0e1825',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          {demos.length === 0 && (
            <div style={{ padding: '32px 20px', color: '#223344', fontSize: 11, textAlign: 'center', lineHeight: 2 }}>
              Noch keine Demos vorhanden.<br />
              Nimm eine Runde auf (● REC im HUD)<br />
              oder importiere eine .json Datei.
            </div>
          )}
          {demos.map(d => (
            <div
              key={d.id}
              onClick={() => selectDemo(d)}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                background: selected?.id === d.id ? '#00aaff11' : 'transparent',
                borderBottom: '1px solid #0a1018',
                borderLeft: `3px solid ${selected?.id === d.id ? '#00aaff' : 'transparent'}`,
                transition: 'all 0.12s',
              }}
            >
              <div style={{ color: selected?.id === d.id ? '#00aaff' : '#667788', fontSize: 11, marginBottom: 4 }}>
                {d.name}
              </div>
              <div style={{ display: 'flex', gap: 12, color: '#334455', fontSize: 9, letterSpacing: 1 }}>
                <span>⏱ {fmtMs(d.duration)}</span>
                <span>WAVE {d.wave}</span>
                <span>{String(d.score).padStart(6, '0')}</span>
              </div>
              {selected?.id === d.id && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {btn('⬇ EXPORT', () => exportDemo(d))}
                  {btn('✕ LÖSCHEN', () => { if (selected?.id === d.id) setSelected(null); deleteDemo(d.id) }, false, '#ff3322')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Playback area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          {!selected ? (
            <div style={{ color: '#223344', fontSize: 13, letterSpacing: 3 }}>
              ← DEMO AUSWÄHLEN
            </div>
          ) : (
            <>
              {/* Canvas */}
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                style={{ border: '1px solid #0e1825', borderRadius: 4 }}
              />

              {/* Timeline */}
              <div style={{ width: 400 }}>
                <input
                  type="range"
                  min={0}
                  max={selected.duration}
                  value={elapsed}
                  onChange={e => {
                    setPlaying(false)
                    cancelAnimationFrame(rafRef.current)
                    setElapsed(Number(e.target.value))
                  }}
                  style={{ width: '100%', accentColor: '#00aaff' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334455', fontSize: 9 }}>
                  <span>{fmtMs(elapsed)}</span>
                  <span>{fmtMs(selected.duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {btn(playing ? '⏸ PAUSE' : '▶ PLAY', togglePlay, playing)}
                {btn('⏮ RESET', () => { setPlaying(false); setElapsed(0) })}
                <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                  {SPEEDS.map((s, i) => btn(`${s}×`, () => setSpeed(i), speed === i))}
                </div>
              </div>

              {/* Meta */}
              <div style={{ color: '#334455', fontSize: 9, letterSpacing: 2, textAlign: 'center' }}>
                {selected.name} · {selected.frames.length} FRAMES · {fmtMs(selected.duration)}
              </div>

              {/* Cutscene assignment */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {(['arena', 'skydive', 'shooting_range'] as const).map((mode) => {
                  const label = { arena: 'ARENA', skydive: 'SKYDIVE', shooting_range: 'SCHIESSTAND' }[mode]
                  const isSet = cutsceneMap[mode] === selected.id
                  return (
                    <button
                      key={mode}
                      onClick={() => setCutscene(mode, isSet ? null : selected.id)}
                      style={{
                        background: isSet ? '#00aaff22' : 'transparent',
                        border: `1px solid ${isSet ? '#00aaff' : '#1a2a3a'}`,
                        color: isSet ? '#00aaff' : '#334455',
                        fontSize: 9, letterSpacing: 2, padding: '5px 10px',
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                      }}
                    >
                      {isSet ? `✓ ${label}` : `+ ${label}`}
                    </button>
                  )
                })}
                <div style={{ color: '#223344', fontSize: 8, letterSpacing: 1, width: '100%', textAlign: 'center' }}>
                  Als Cutscene für Mission setzen
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
