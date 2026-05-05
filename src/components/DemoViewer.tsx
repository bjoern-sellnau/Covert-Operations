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

  const btn = (label: string, onClick: () => void, active = false, col = '#e05418') => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px', background: active ? `${col}18` : 'transparent',
        border: `1px solid ${active ? col : 'rgba(138,154,98,0.2)'}`,
        color: active ? col : 'rgba(138,154,98,0.5)',
        fontSize: 9, letterSpacing: '0.2em', cursor: 'pointer',
        fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      fontFamily: "'Share Tech Mono', monospace", color: 'rgba(220,216,200,0.8)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(224,84,24,0.8), transparent)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 20px',
        paddingTop: 'max(14px, calc(env(safe-area-inset-top, 0px) + 14px))',
        borderBottom: '1px solid rgba(138,154,98,0.12)', flexShrink: 0,
      }}>
        <button
          onClick={() => setPhase(viewerReturnTo)}
          style={{
            padding: '6px 14px', background: 'transparent',
            border: '1px solid rgba(138,154,98,0.2)', color: 'rgba(138,154,98,0.5)',
            fontSize: 9, letterSpacing: '0.2em', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase',
            transition: 'all 0.12s',
          }}
        >
          {viewerReturnTo === 'editor' ? '← EDITOR' : '← ZURÜCK'}
        </button>
        <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: '0.2em', color: '#e05418', textShadow: '0 0 12px rgba(224,84,24,0.4)' }}>
          DEMOS
        </div>
        <div style={{ flex: 1 }} />
        {btn('⬆ IMPORTIEREN', handleImport)}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Demo list */}
        <div style={{
          width: 260, flexShrink: 0, borderRight: '1px solid rgba(138,154,98,0.1)',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          {demos.length === 0 && (
            <div style={{ padding: '32px 20px', color: 'rgba(106,112,72,0.35)', fontSize: 10, textAlign: 'center', lineHeight: 2, letterSpacing: '0.05em' }}>
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
                background: selected?.id === d.id ? 'rgba(224,84,24,0.06)' : 'transparent',
                borderBottom: '1px solid rgba(138,154,98,0.08)',
                borderLeft: `2px solid ${selected?.id === d.id ? '#e05418' : 'transparent'}`,
                transition: 'all 0.12s',
              }}
            >
              <div style={{ color: selected?.id === d.id ? '#e05418' : 'rgba(220,216,200,0.7)', fontSize: 11, marginBottom: 4, letterSpacing: '0.05em' }}>
                {d.name}
              </div>
              <div style={{ display: 'flex', gap: 12, color: 'rgba(106,112,72,0.45)', fontSize: 9, letterSpacing: '0.1em' }}>
                <span>⏱ {fmtMs(d.duration)}</span>
                <span>WAVE {d.wave}</span>
                <span>{String(d.score).padStart(6, '0')}</span>
              </div>
              {selected?.id === d.id && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {btn('⬇ EXPORT', () => exportDemo(d))}
                  {btn('✕ LÖSCHEN', () => { if (selected?.id === d.id) setSelected(null); deleteDemo(d.id) }, false, '#ff5544')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Playback area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 24px))' }}>
          {!selected ? (
            <div style={{ color: 'rgba(106,112,72,0.3)', fontSize: 11, letterSpacing: '0.3em' }}>
              ← DEMO AUSWÄHLEN
            </div>
          ) : (
            <>
              {/* Canvas */}
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                style={{ border: '1px solid rgba(138,154,98,0.2)', borderRadius: 2, maxWidth: '100%' }}
              />

              {/* Timeline */}
              <div style={{ width: 'min(400px, 90vw)' }}>
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
                  style={{ width: '100%', accentColor: '#e05418' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(106,112,72,0.45)', fontSize: 9, letterSpacing: '0.1em' }}>
                  <span>{fmtMs(elapsed)}</span>
                  <span>{fmtMs(selected.duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                {btn(playing ? '⏸ PAUSE' : '▶ PLAY', togglePlay, playing)}
                {btn('⏮ RESET', () => { setPlaying(false); setElapsed(0) })}
                <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                  {SPEEDS.map((s, i) => btn(`${s}×`, () => setSpeed(i), speed === i))}
                </div>
              </div>

              {/* Meta */}
              <div style={{ color: 'rgba(106,112,72,0.4)', fontSize: 9, letterSpacing: '0.2em', textAlign: 'center' }}>
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
                        background: isSet ? 'rgba(224,84,24,0.15)' : 'transparent',
                        border: `1px solid ${isSet ? '#e05418' : 'rgba(138,154,98,0.2)'}`,
                        color: isSet ? '#e05418' : 'rgba(138,154,98,0.45)',
                        fontSize: 9, letterSpacing: '0.2em', padding: '5px 10px',
                        cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace",
                        textTransform: 'uppercase', transition: 'all 0.12s',
                      }}
                    >
                      {isSet ? `✓ ${label}` : `+ ${label}`}
                    </button>
                  )
                })}
                <div style={{ color: 'rgba(106,112,72,0.3)', fontSize: 8, letterSpacing: '0.1em', width: '100%', textAlign: 'center' }}>
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
