import { useEffect, useRef, useState } from 'react'
import { useDemoStore, type Demo, type DemoFrame } from '../store/demoStore'
import type { CutsceneMode } from '../store/demoStore'

const ARENA_HALF = 18

const ENEMY_COLOR: Record<string, string> = {
  basic: '#cc2222', fast: '#cc6600', tank: '#6600cc',
  berserker: '#cc0066', flanker: '#cc8800', juggernaut: '#334455',
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

  for (const e of frame.e) {
    ctx.fillStyle = ENEMY_COLOR[e.tp] ?? '#cc2222'
    ctx.beginPath()
    ctx.arc(toX(e.x), toZ(e.z), 4, 0, Math.PI * 2)
    ctx.fill()
  }

  const px = toX(frame.px), pz = toZ(frame.pz)
  ctx.fillStyle = '#00ff88'
  ctx.beginPath()
  ctx.arc(px, pz, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#00ff88'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(px, pz)
  ctx.lineTo(px + Math.sin(frame.pa) * 14, pz - Math.cos(frame.pa) * 14)
  ctx.stroke()

  ctx.fillStyle = '#00aaff88'
  ctx.font = 'bold 13px monospace'
  ctx.fillText(`WAVE ${frame.w}`, 8, 20)
  ctx.fillStyle = '#ffee0088'
  ctx.fillText(`${String(frame.s).padStart(6, '0')}`, 8, 38)
  ctx.fillStyle = (frame.php > 50 ? '#00ff88' : frame.php > 25 ? '#ffaa00' : '#ff3300') + '88'
  ctx.fillText(`HP ${frame.php}`, 8, 56)
}

function interpolateFrame(frames: DemoFrame[], elapsedMs: number): DemoFrame | null {
  if (frames.length === 0) return null
  if (elapsedMs <= frames[0].t) return frames[0]
  for (let i = 1; i < frames.length; i++) {
    if (elapsedMs <= frames[i].t) {
      const a = frames[i - 1], b = frames[i]
      const t = (elapsedMs - a.t) / (b.t - a.t)
      return { ...b, px: a.px + (b.px - a.px) * t, pz: a.pz + (b.pz - a.pz) * t, pa: a.pa + (b.pa - a.pa) * t }
    }
  }
  return frames[frames.length - 1]
}

interface Props { mode: CutsceneMode; onDone: () => void }

function CutsceneCanvas({ demo, onDone }: { demo: Demo; onDone: () => void }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef(0)
  const startRef   = useRef(performance.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    startRef.current = performance.now()

    const tick = () => {
      const el = performance.now() - startRef.current
      setElapsed(el)
      if (canvasRef.current) {
        const frame = interpolateFrame(demo.frames, el % demo.duration)
        if (frame) drawFrame(canvasRef.current, frame)
      }
      if (el >= demo.duration) {
        // Loop once then auto-advance
        onDone()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [demo, onDone])

  const pct = Math.min(1, elapsed / demo.duration)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <canvas
        ref={canvasRef}
        width={420}
        height={420}
        style={{
          border: '1px solid #0e1825',
          boxShadow: '0 0 40px #00aaff22',
          maxWidth: 'min(90vw, 420px)',
          maxHeight: 'min(90vw, 420px)',
        }}
      />
      {/* Progress bar */}
      <div style={{ width: 'min(90vw, 420px)', height: 2, background: '#0e1825', borderRadius: 1 }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: '#00aaff', transition: 'width 0.05s linear' }} />
      </div>
      <div style={{ color: '#223344', fontSize: 9, letterSpacing: 3 }}>
        {demo.name}
      </div>
    </div>
  )
}

export function CutscenePlayer({ mode, onDone }: Props) {
  const { cutsceneMap, demos } = useDemoStore()
  const demo = demos.find((d) => d.id === cutsceneMap[mode]) ?? null

  // No cutscene configured or no matching demo → skip immediately
  useEffect(() => {
    if (!demo) onDone()
  }, [demo, onDone])

  if (!demo) return null

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#02040a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
      userSelect: 'none',
      zIndex: 100,
    }}>
      <div style={{ color: '#00aaff44', fontSize: 9, letterSpacing: 6, marginBottom: 20 }}>
        INTEL
      </div>

      <CutsceneCanvas demo={demo} onDone={onDone} />

      <button
        onClick={onDone}
        style={{
          marginTop: 20,
          background: 'transparent', border: '1px solid #1a2a3a', color: '#334455',
          fontSize: 10, letterSpacing: 3, padding: '8px 22px', cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all 0.12s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#aabbcc'; e.currentTarget.style.borderColor = '#334455' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#334455'; e.currentTarget.style.borderColor = '#1a2a3a' }}
      >
        ÜBERSPRINGEN →
      </button>
    </div>
  )
}
