import { useEffect } from 'react'
import { getCtx } from '../../game/audioCore'

const LINES: { text: string; color?: string; fontWeight?: number }[] = [
  { text: '> SYSTEM BOOT // CO-Δ KERNEL v0.1.0' },
  { text: '> LOADING CRYPTO MODULES.....OK' },
  { text: '> SYNCING SECURE CHANNEL........OK' },
  { text: '> AUTHENTICATING OPERATOR ID' },
  { text: '> BIOMETRIC SCAN........VERIFIED',              color: '#e05418' },
  { text: '> CLEARANCE LEVEL........TS//SCI',              color: '#e05418' },
  { text: '> ACCESS GRANTED — INITIALIZING TACTICAL DISPLAY', color: '#e0dcc8', fontWeight: 600 },
]
const DELAYS = [0.2, 0.7, 1.2, 1.7, 2.2, 2.7, 3.2]
const BEEP_FREQS = [440, 520, 460, 500, 440, 580, 880]

function bootBeep(freq: number, vol = 0.045, dur = 0.035) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const env = c.createGain()
    osc.type = 'square'; osc.frequency.value = freq
    env.gain.setValueAtTime(vol, c.currentTime)
    env.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur)
    osc.connect(env); env.connect(c.destination)
    osc.start(); osc.stop(c.currentTime + dur + 0.01)
  } catch { /* AudioContext not yet unlocked — silent boot */ }
}

function readyChime() {
  try {
    const c = getCtx()
    const now = c.currentTime
    // D minor ascending: D4 F4 A4 D5
    ;[293.66, 349.23, 440, 587.33].forEach((freq, i) => {
      const osc = c.createOscillator()
      const env = c.createGain()
      osc.type = 'sine'; osc.frequency.value = freq
      const t = now + i * 0.09
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.055, t + 0.02)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      osc.connect(env); env.connect(c.destination)
      osc.start(t); osc.stop(t + 0.6)
    })
  } catch { /**/ }
}

export function BootSequence() {
  useEffect(() => {
    const timers = DELAYS.map((delay, i) =>
      setTimeout(() => bootBeep(BEEP_FREQS[i]), delay * 1000)
    )
    timers.push(setTimeout(readyChime, 3450))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <>
      <div style={{
        position: 'absolute', inset: 0,
        background: '#000',
        zIndex: 50,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 13,
        color: '#8aaa30',
        padding: '60px 80px',
        letterSpacing: '0.05em',
        lineHeight: 1.9,
        animation: 'tsBootFade 0.5s 3.6s forwards',
        pointerEvents: 'none',
      }}>
        {LINES.map((line, i) => (
          <div key={i} style={{
            opacity: 0,
            animation: `tsBootType 0.3s ${DELAYS[i]}s forwards`,
            color: line.color,
            fontWeight: line.fontWeight,
          }}>
            {line.text}
          </div>
        ))}
      </div>

      {/* green scanline sweeps 2× */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(138,170,48,0.6), transparent)',
        zIndex: 51,
        pointerEvents: 'none',
        animation: 'tsScanLine 1.5s linear 0s 2',
      }} />
    </>
  )
}
