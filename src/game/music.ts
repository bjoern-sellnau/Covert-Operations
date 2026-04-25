// Procedural Web Audio music — no audio files

let _ctx: AudioContext | null = null
let _master: GainNode | null = null
let _scheduler: ReturnType<typeof setInterval> | null = null
let _padOscs: OscillatorNode[] = []
let _nextBar = 0
let _track: 'menu' | 'game' | null = null

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') void _ctx.resume()
  return _ctx
}

function master(): GainNode {
  if (!_master) {
    const c = ctx()
    _master = c.createGain()
    _master.gain.value = 0
    _master.connect(c.destination)
  }
  return _master
}

// ── Primitive builders ────────────────────────────────────────────────────────

function kick(when: number, vol = 0.55) {
  const c = ctx()
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.frequency.setValueAtTime(120, when)
  osc.frequency.exponentialRampToValueAtTime(45, when + 0.12)
  env.gain.setValueAtTime(vol, when)
  env.gain.exponentialRampToValueAtTime(0.001, when + 0.28)
  osc.connect(env); env.connect(master())
  osc.start(when); osc.stop(when + 0.3)
}

function hihat(when: number, vol = 0.07, decay = 0.04) {
  const c = ctx()
  const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src  = c.createBufferSource()
  const filt = c.createBiquadFilter()
  const env  = c.createGain()
  src.buffer = buf
  filt.type = 'highpass'; filt.frequency.value = 6000
  env.gain.setValueAtTime(vol, when)
  env.gain.exponentialRampToValueAtTime(0.0001, when + decay)
  src.connect(filt); filt.connect(env); env.connect(master())
  src.start(when)
}

function note(freq: number, when: number, dur: number, vol: number, type: OscillatorType = 'sine', filterHz = 4000) {
  const c = ctx()
  const osc  = c.createOscillator()
  const filt = c.createBiquadFilter()
  const env  = c.createGain()
  osc.type = type; osc.frequency.value = freq
  filt.type = 'lowpass'; filt.frequency.value = filterHz
  env.gain.setValueAtTime(0, when)
  env.gain.linearRampToValueAtTime(vol, when + 0.015)
  env.gain.exponentialRampToValueAtTime(0.0001, when + dur)
  osc.connect(filt); filt.connect(env); env.connect(master())
  osc.start(when); osc.stop(when + dur + 0.02)
}

function startPad(freqs: number[], type: OscillatorType, cutoff: number, vol: number) {
  stopPad()
  const c = ctx()
  for (const f of freqs) {
    for (const det of [-6, 0, 6]) {
      const osc  = c.createOscillator()
      const filt = c.createBiquadFilter()
      const g    = c.createGain()
      const lfo  = c.createOscillator()
      const lfog = c.createGain()
      osc.type = type
      osc.frequency.value = f * Math.pow(2, det / 1200)
      filt.type = 'lowpass'; filt.frequency.value = cutoff; filt.Q.value = 1.5
      lfo.frequency.value = 0.18; lfog.gain.value = cutoff * 0.5
      g.gain.value = vol
      lfo.connect(lfog); lfog.connect(filt.frequency)
      osc.connect(filt); filt.connect(g); g.connect(master())
      lfo.start(); osc.start()
      _padOscs.push(osc, lfo)
    }
  }
}

function stopPad() {
  for (const o of _padOscs) { try { o.stop() } catch { /* already stopped */ } }
  _padOscs = []
}

// ── Menu music (A minor, 80 BPM) ─────────────────────────────────────────────

const MENU_BPM    = 80
const MENU_BEAT   = 60 / MENU_BPM          // 0.75 s
const MENU_EIGHTH = MENU_BEAT / 2           // 0.375 s
const MENU_BAR    = MENU_BEAT * 4           // 3 s

// A minor Am7 arpeggio: A3 C4 E4 G4
const MENU_ARP = [220, 261.63, 329.63, 392, 329.63, 261.63]

function scheduleMenuBar(t: number) {
  // Kick on beats 1 + 3
  kick(t, 0.35)
  kick(t + MENU_BEAT * 2, 0.22)

  // Hi-hats on every 1/8 note
  for (let i = 0; i < 8; i++) {
    hihat(t + MENU_EIGHTH * i, i % 2 === 0 ? 0.06 : 0.035)
  }

  // Arpeggio — 6 notes spread across the bar
  for (let i = 0; i < 6; i++) {
    const freq = MENU_ARP[i % MENU_ARP.length]
    note(freq, t + (MENU_BAR / 6) * i, MENU_BEAT * 0.9, 0.12, 'sine')
    // Octave below ghost note
    note(freq / 2, t + (MENU_BAR / 6) * i, MENU_BEAT * 1.4, 0.04, 'triangle')
  }

  // Sub bass — root A1 on beat 1, E1 on beat 3
  note(55,   t,                  MENU_BEAT * 1.8, 0.28, 'sine', 200)
  note(82.4, t + MENU_BEAT * 2,  MENU_BEAT * 1.4, 0.20, 'sine', 200)
}

// ── Game music (D minor, 138 BPM) ────────────────────────────────────────────

const GAME_BPM    = 138
const GAME_BEAT   = 60 / GAME_BPM
const GAME_EIGHTH = GAME_BEAT / 2
const GAME_BAR    = GAME_BEAT * 4

// D minor bass line (8 steps, 1/8 notes): D2 A1 C2 A1 Bb1 A1 C2 D2
const GAME_BASS = [73.42, 55, 65.41, 55, 58.27, 55, 65.41, 73.42]
// Melody (16 steps): D4 F4 A4 C5 A4 F4 E4 D4 — 2 bars
const GAME_MEL1 = [293.66, 349.23, 440, 523.25, 440, 349.23, 329.63, 293.66]
const GAME_MEL2 = [261.63, 349.23, 440, 392,    349.23, 261.63, 293.66, 0]

let _gameMelBar = 0

function scheduleGameBar(t: number) {
  // Kick every beat
  for (let b = 0; b < 4; b++) kick(t + GAME_BEAT * b, 0.5 + (b === 0 ? 0.1 : 0))

  // Hi-hats
  for (let i = 0; i < 8; i++) hihat(t + GAME_EIGHTH * i, i % 2 === 0 ? 0.08 : 0.045, 0.03)

  // Bass line
  for (let i = 0; i < 8; i++) {
    note(GAME_BASS[i], t + GAME_EIGHTH * i, GAME_EIGHTH * 0.85, 0.22, 'sawtooth', 380)
  }

  // Melody (alternates 2 bars)
  const mel = _gameMelBar % 2 === 0 ? GAME_MEL1 : GAME_MEL2
  for (let i = 0; i < 8; i++) {
    if (mel[i] > 0)
      note(mel[i], t + GAME_EIGHTH * i, GAME_EIGHTH * 0.75, 0.10, 'square', 1800)
  }
  _gameMelBar++
}

// ── Public API ────────────────────────────────────────────────────────────────

function startScheduler(barLen: number, scheduleFn: (t: number) => void) {
  stopMusic()
  const c = ctx()
  _nextBar = c.currentTime + 0.05

  // Fade master in
  master().gain.cancelScheduledValues(c.currentTime)
  master().gain.setValueAtTime(0, c.currentTime)
  master().gain.linearRampToValueAtTime(0.4, c.currentTime + 1.5)

  // Schedule first bar immediately
  scheduleFn(_nextBar)
  _nextBar += barLen

  _scheduler = setInterval(() => {
    const now = ctx().currentTime
    while (_nextBar < now + 0.4) {
      scheduleFn(_nextBar)
      _nextBar += barLen
    }
  }, 80)
}

export function startMenuMusic() {
  if (_track === 'menu') return
  _track = 'menu'
  startPad([110, 130.81, 164.81], 'sawtooth', 500, 0.022)
  startScheduler(MENU_BAR, scheduleMenuBar)
}

export function startGameMusic() {
  if (_track === 'game') return
  _track = 'game'
  _gameMelBar = 0
  startPad([73.42, 110, 146.83], 'sawtooth', 420, 0.018)
  startScheduler(GAME_BAR, scheduleGameBar)
}

export function stopMusic() {
  _track = null
  if (_scheduler) { clearInterval(_scheduler); _scheduler = null }
  stopPad()
  if (_master) {
    const c = ctx()
    _master.gain.cancelScheduledValues(c.currentTime)
    _master.gain.setTargetAtTime(0, c.currentTime, 0.4)
  }
}
