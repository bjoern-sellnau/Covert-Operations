import { useEffect, useRef } from 'react'

export function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const el  = canvas  // narrowed non-null ref for closures

    function resize() {
      el.width  = window.innerWidth
      el.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const pts = Array.from({ length: 55 }, () => ({
      x:     Math.random(),
      y:     Math.random(),
      size:  0.5 + Math.random() * 1.2,
      maxOp: 0.08 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      born:  performance.now() - Math.random() * 12000,
      life:  10000 + Math.random() * 14000,
      col:   Math.random() < 0.3 ? 'rgba(224,84,24,' : 'rgba(200,196,170,',
    }))

    let rafId: number
    function draw(now: number) {
      ctx.clearRect(0, 0, el.width, el.height)
      for (const p of pts) {
        const age = (now - p.born) % p.life
        const t   = age / p.life
        const op  = t < 0.15 ? (t / 0.15) * p.maxOp
                  : t > 0.75  ? ((1 - t) / 0.25) * p.maxOp
                  : p.maxOp
        const y = (p.y - t * 0.18 + 1) % 1
        const x = p.x + Math.sin(t * Math.PI * 2 + p.phase) * 0.015
        ctx.beginPath()
        ctx.arc(x * el.width, y * el.height, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.col + op + ')'
        ctx.fill()
      }
      rafId = requestAnimationFrame(draw)
    }
    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    />
  )
}
