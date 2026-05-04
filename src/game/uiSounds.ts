import { getCtx } from './audioCore'

export function playHover() {
  try {
    const ctx = getCtx()
    if (ctx.state !== 'running') return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 1100
    gain.gain.setValueAtTime(0.02, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.045)
  } catch {}
}

export function playClick() {
  try {
    const ctx = getCtx()
    if (ctx.state !== 'running') return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(760, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.09)
    gain.gain.setValueAtTime(0.055, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.09)
  } catch {}
}
