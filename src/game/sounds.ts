// Web Audio API procedural sound synthesis

let _ctx: AudioContext | null = null

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function masterGain(volume = 1.0): GainNode {
  const g = ctx().createGain()
  g.gain.value = volume
  g.connect(ctx().destination)
  return g
}

function noise(duration: number, color: 'white' | 'pink' = 'white'): AudioBufferSourceNode {
  const ac = ctx()
  const frames = Math.ceil(ac.sampleRate * duration)
  const buf = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buf.getChannelData(0)
  if (color === 'white') {
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
  } else {
    // Pink noise (Paul Kellet's method)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < frames; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520
      b3 = 0.86650 * b3 + w * 0.3104856
      b4 = 0.55000 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  }
  const src = ac.createBufferSource()
  src.buffer = buf
  return src
}

function osc(freq: number, type: OscillatorType = 'sine'): OscillatorNode {
  const o = ctx().createOscillator()
  o.type = type
  o.frequency.value = freq
  return o
}

// ── Pistol / generic handgun ──────────────────────────────────────────────────
export function playPistol(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.5)
  const t = ac.currentTime

  const n = noise(0.15)
  const filt = ac.createBiquadFilter()
  filt.type = 'bandpass'
  filt.frequency.value = 2200
  filt.Q.value = 0.6
  n.connect(filt)

  const g = ac.createGain()
  filt.connect(g)
  g.connect(out)
  g.gain.setValueAtTime(1, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.13)

  const body = osc(90, 'sawtooth')
  const bg = ac.createGain()
  body.connect(bg)
  bg.connect(out)
  bg.gain.setValueAtTime(0.5, t)
  bg.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  body.frequency.exponentialRampToValueAtTime(30, t + 0.08)

  n.start(t); n.stop(t + 0.15)
  body.start(t); body.stop(t + 0.1)
}

// ── SMG (fast rapid fire, lighter) ───────────────────────────────────────────
export function playSmg(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.35)
  const t = ac.currentTime

  const n = noise(0.08)
  const filt = ac.createBiquadFilter()
  filt.type = 'bandpass'
  filt.frequency.value = 3000
  filt.Q.value = 0.8
  n.connect(filt)

  const g = ac.createGain()
  filt.connect(g)
  g.connect(out)
  g.gain.setValueAtTime(1, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08)

  n.start(t); n.stop(t + 0.09)
}

// ── Shotgun (boom + spread crackle) ──────────────────────────────────────────
export function playShotgun(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.7)
  const t = ac.currentTime

  // Low boom
  const boom = osc(60, 'sine')
  const bg = ac.createGain()
  boom.connect(bg); bg.connect(out)
  bg.gain.setValueAtTime(1, t)
  bg.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
  boom.frequency.exponentialRampToValueAtTime(20, t + 0.3)
  boom.start(t); boom.stop(t + 0.35)

  // Crack
  const crack = noise(0.2)
  const cf = ac.createBiquadFilter()
  cf.type = 'highpass'; cf.frequency.value = 1000
  crack.connect(cf)
  const cg = ac.createGain()
  cf.connect(cg); cg.connect(out)
  cg.gain.setValueAtTime(1, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  crack.start(t); crack.stop(t + 0.2)
}

// ── Rifle (sharp crack) ───────────────────────────────────────────────────────
export function playRifle(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.55)
  const t = ac.currentTime

  const n = noise(0.18)
  const filt = ac.createBiquadFilter()
  filt.type = 'bandpass'; filt.frequency.value = 1800; filt.Q.value = 0.5
  n.connect(filt)
  const g = ac.createGain()
  filt.connect(g); g.connect(out)
  g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)

  const crack = osc(120, 'sawtooth')
  const cg = ac.createGain()
  crack.connect(cg); cg.connect(out)
  cg.gain.setValueAtTime(0.6, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  crack.frequency.exponentialRampToValueAtTime(30, t + 0.06)
  crack.start(t); crack.stop(t + 0.07); n.start(t); n.stop(t + 0.2)
}

// ── Uzi (very fast, bright) ───────────────────────────────────────────────────
export function playUzi(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.28)
  const t = ac.currentTime

  const n = noise(0.06)
  const filt = ac.createBiquadFilter()
  filt.type = 'bandpass'; filt.frequency.value = 3500; filt.Q.value = 1.0
  n.connect(filt)
  const g = ac.createGain()
  filt.connect(g); g.connect(out)
  g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
  n.start(t); n.stop(t + 0.07)
}

// ── MP5 (punchy, medium) ──────────────────────────────────────────────────────
export function playMp5(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.4)
  const t = ac.currentTime

  const n = noise(0.1)
  const filt = ac.createBiquadFilter()
  filt.type = 'bandpass'; filt.frequency.value = 2600; filt.Q.value = 0.7
  n.connect(filt)
  const g = ac.createGain()
  filt.connect(g); g.connect(out)
  g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1)

  const punch = osc(80, 'square')
  const pg = ac.createGain()
  punch.connect(pg); pg.connect(out)
  pg.gain.setValueAtTime(0.3, t); pg.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  punch.frequency.exponentialRampToValueAtTime(40, t + 0.05)
  punch.start(t); punch.stop(t + 0.06); n.start(t); n.stop(t + 0.1)
}

// ── M16 (burst rifle, sharp crack + punch) ────────────────────────────────────
export function playM16(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.5)
  const t = ac.currentTime

  const n = noise(0.2)
  const filt = ac.createBiquadFilter()
  filt.type = 'bandpass'; filt.frequency.value = 2000; filt.Q.value = 0.55
  n.connect(filt)
  const g = ac.createGain()
  filt.connect(g); g.connect(out)
  g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)

  const body = osc(100, 'sawtooth')
  const bg = ac.createGain()
  body.connect(bg); bg.connect(out)
  bg.gain.setValueAtTime(0.7, t); bg.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  body.frequency.exponentialRampToValueAtTime(35, t + 0.1)
  body.start(t); body.stop(t + 0.12); n.start(t); n.stop(t + 0.22)
}

// ── Blaster (sci-fi energy zap) ───────────────────────────────────────────────
export function playBlaster(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.4)
  const t = ac.currentTime

  const o = osc(800, 'sawtooth')
  const g = ac.createGain()
  o.connect(g); g.connect(out)
  o.frequency.setValueAtTime(800, t)
  o.frequency.exponentialRampToValueAtTime(120, t + 0.18)
  g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  o.start(t); o.stop(t + 0.2)

  // Bright shimmer
  const o2 = osc(2400, 'sine')
  const g2 = ac.createGain()
  o2.connect(g2); g2.connect(out)
  g2.gain.setValueAtTime(0.2, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
  o2.start(t); o2.stop(t + 0.08)
}

// ── Plasma (deep thump + charge whine) ────────────────────────────────────────
export function playPlasma(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.55)
  const t = ac.currentTime

  // Charge up whine
  const whine = osc(300, 'sawtooth')
  const wg = ac.createGain()
  whine.connect(wg); wg.connect(out)
  whine.frequency.setValueAtTime(300, t)
  whine.frequency.exponentialRampToValueAtTime(1200, t + 0.12)
  wg.gain.setValueAtTime(0.3, t); wg.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
  whine.start(t); whine.stop(t + 0.15)

  // Deep bass thump
  const thump = osc(55, 'sine')
  const tg = ac.createGain()
  thump.connect(tg); tg.connect(out)
  tg.gain.setValueAtTime(1, t + 0.1); tg.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
  thump.frequency.setValueAtTime(55, t + 0.1); thump.frequency.exponentialRampToValueAtTime(25, t + 0.4)
  thump.start(t + 0.1); thump.stop(t + 0.45)

  // Noise burst at launch
  const burst = noise(0.08)
  const bf = ac.createBiquadFilter(); bf.type = 'lowpass'; bf.frequency.value = 600
  burst.connect(bf)
  const bg = ac.createGain(); bf.connect(bg); bg.connect(out)
  bg.gain.setValueAtTime(0.5, t + 0.1); bg.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  burst.start(t + 0.1); burst.stop(t + 0.22)
}

// ── Bazooka (big boom with reverb tail) ───────────────────────────────────────
export function playBazooka(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.75)
  const t = ac.currentTime

  // Launch whoosh
  const whoosh = noise(0.15, 'pink')
  const wf = ac.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 800; wf.Q.value = 0.4
  whoosh.connect(wf)
  const wg = ac.createGain(); wf.connect(wg); wg.connect(out)
  wg.gain.setValueAtTime(0.4, t); wg.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
  whoosh.start(t); whoosh.stop(t + 0.16)

  // Boom (detonation)
  const boom = osc(40, 'sine')
  const bg = ac.createGain()
  boom.connect(bg); bg.connect(out)
  bg.gain.setValueAtTime(1.5, t + 0.14); bg.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
  boom.frequency.setValueAtTime(40, t + 0.14); boom.frequency.exponentialRampToValueAtTime(18, t + 0.7)
  boom.start(t + 0.14); boom.stop(t + 0.75)

  // Rumble
  const rumble = noise(0.6, 'pink')
  const rf = ac.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 300
  rumble.connect(rf)
  const rg = ac.createGain(); rf.connect(rg); rg.connect(out)
  rg.gain.setValueAtTime(0.8, t + 0.14); rg.gain.exponentialRampToValueAtTime(0.001, t + 0.75)
  rumble.start(t + 0.14); rumble.stop(t + 0.8)
}

// ── Flak (metallic bang + ricochet shards) ────────────────────────────────────
export function playFlak(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.6)
  const t = ac.currentTime

  // Initial metallic bang
  const bang = noise(0.1)
  const bf = ac.createBiquadFilter(); bf.type = 'highpass'; bf.frequency.value = 1500
  bang.connect(bf)
  const bg = ac.createGain(); bf.connect(bg); bg.connect(out)
  bg.gain.setValueAtTime(1, t); bg.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  bang.start(t); bang.stop(t + 0.12)

  // Metallic body tone
  const metal = osc(320, 'square')
  const mg = ac.createGain()
  metal.connect(mg); mg.connect(out)
  mg.gain.setValueAtTime(0.4, t); mg.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  metal.frequency.exponentialRampToValueAtTime(80, t + 0.08)
  metal.start(t); metal.stop(t + 0.09)
}

// ── Flak ricochet (each bounce) ───────────────────────────────────────────────
export function playFlakBounce(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.3)
  const t = ac.currentTime

  const ping = osc(1200 + Math.random() * 600, 'sine')
  const pg = ac.createGain()
  ping.connect(pg); pg.connect(out)
  pg.gain.setValueAtTime(0.4, t); pg.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
  ping.frequency.exponentialRampToValueAtTime(400, t + 0.09)
  ping.start(t); ping.stop(t + 0.1)
}

// ── Banana bounce ─────────────────────────────────────────────────────────────
export function playBananaBounce(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.2)
  const t = ac.currentTime

  const boing = osc(220, 'sine')
  const bg = ac.createGain()
  boing.connect(bg); bg.connect(out)
  boing.frequency.setValueAtTime(220, t); boing.frequency.exponentialRampToValueAtTime(80, t + 0.12)
  bg.gain.setValueAtTime(0.5, t); bg.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  boing.start(t); boing.stop(t + 0.14)
}

// ── Explosion (small — plasma/flak impact) ────────────────────────────────────
export function playExplosionSmall(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.55)
  const t = ac.currentTime

  const boom = osc(60, 'sine')
  const bg = ac.createGain()
  boom.connect(bg); bg.connect(out)
  bg.gain.setValueAtTime(0.8, t); bg.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
  boom.frequency.setValueAtTime(60, t); boom.frequency.exponentialRampToValueAtTime(22, t + 0.35)
  boom.start(t); boom.stop(t + 0.4)

  const crack = noise(0.12)
  const cf = ac.createBiquadFilter(); cf.type = 'bandpass'; cf.frequency.value = 1200; cf.Q.value = 0.5
  crack.connect(cf)
  const cg = ac.createGain(); cf.connect(cg); cg.connect(out)
  cg.gain.setValueAtTime(0.6, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
  crack.start(t); crack.stop(t + 0.16)
}

// ── Explosion (large — bazooka/banana) ───────────────────────────────────────
export function playExplosionLarge(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.9)
  const t = ac.currentTime

  const boom = osc(35, 'sine')
  const bg = ac.createGain()
  boom.connect(bg); bg.connect(out)
  bg.gain.setValueAtTime(2, t); bg.gain.exponentialRampToValueAtTime(0.001, t + 0.8)
  boom.frequency.setValueAtTime(35, t); boom.frequency.exponentialRampToValueAtTime(15, t + 0.8)
  boom.start(t); boom.stop(t + 0.85)

  const rumble = noise(0.7, 'pink')
  const rf = ac.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 400
  rumble.connect(rf)
  const rg = ac.createGain(); rf.connect(rg); rg.connect(out)
  rg.gain.setValueAtTime(1.2, t); rg.gain.exponentialRampToValueAtTime(0.001, t + 0.8)
  rumble.start(t); rumble.stop(t + 0.85)

  const sharp = noise(0.25)
  const sf = ac.createBiquadFilter(); sf.type = 'highpass'; sf.frequency.value = 2000
  sharp.connect(sf)
  const sg = ac.createGain(); sf.connect(sg); sg.connect(out)
  sg.gain.setValueAtTime(0.5, t); sg.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
  sharp.start(t); sharp.stop(t + 0.16)
}

// ── Melee swing / impact ──────────────────────────────────────────────────────
export function playMelee(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.45)
  const t = ac.currentTime
  // Low thwack
  const n = noise(0.07)
  const filt = ac.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 280; filt.Q.value = 1.5
  n.connect(filt)
  const g = ac.createGain(); filt.connect(g); g.connect(out)
  g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
  n.start(t); n.stop(t + 0.1)
  // Sharp transient crack
  const crack = noise(0.02)
  const cf = ac.createBiquadFilter(); cf.type = 'highpass'; cf.frequency.value = 1800
  crack.connect(cf)
  const cg = ac.createGain(); cf.connect(cg); cg.connect(out)
  cg.gain.setValueAtTime(0.5, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
  crack.start(t); crack.stop(t + 0.04)
}

// ── Hit (flesh impact) ────────────────────────────────────────────────────────
export function playHit(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.3)
  const t = ac.currentTime

  const n = noise(0.06)
  const filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 800
  n.connect(filt)
  const g = ac.createGain(); filt.connect(g); g.connect(out)
  g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  n.start(t); n.stop(t + 0.07)
}

// ── Ricochet (bullet off metal) ───────────────────────────────────────────────
export function playRicochet(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.25)
  const t = ac.currentTime

  const ping = osc(900 + Math.random() * 400, 'sine')
  const pg = ac.createGain()
  ping.connect(pg); pg.connect(out)
  pg.gain.setValueAtTime(0.3, t); pg.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  ping.frequency.exponentialRampToValueAtTime(300, t + 0.08)
  ping.start(t); ping.stop(t + 0.09)
}

// ── Pickup (key / item) ───────────────────────────────────────────────────────
export function playPickup(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.4)
  const t = ac.currentTime

  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    const o = osc(freq, 'sine')
    const g = ac.createGain()
    o.connect(g); g.connect(out)
    const start = t + i * 0.065
    g.gain.setValueAtTime(0.5, start); g.gain.exponentialRampToValueAtTime(0.001, start + 0.12)
    o.start(start); o.stop(start + 0.13)
  })
}

// ── Death / enemy death ───────────────────────────────────────────────────────
export function playDeath(volume = 1) {
  const ac = ctx()
  const out = masterGain(volume * 0.4)
  const t = ac.currentTime

  const o = osc(220, 'sawtooth')
  const g = ac.createGain()
  o.connect(g); g.connect(out)
  o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.5)
  g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
  o.start(t); o.stop(t + 0.55)
}

// ── Map: weaponId → fire sound function ──────────────────────────────────────
type FireFn = (volume?: number) => void
export const WEAPON_SOUNDS: Record<string, FireFn> = {
  pistol:  playPistol,
  smg:     playSmg,
  shotgun: playShotgun,
  rifle:   playRifle,
  uzi:     playUzi,
  mp5:     playMp5,
  m16:     playM16,
  blaster: playBlaster,
  plasma:  playPlasma,
  bazooka: playBazooka,
  flak:    playFlak,
  banana:  playBazooka,
  knife:   playMelee,
  bat:     playMelee,
  stick:   playMelee,
}
