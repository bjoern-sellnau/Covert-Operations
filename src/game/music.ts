// Procedural Web Audio music — no audio files

let _ctx: AudioContext | null = null
let _master: GainNode | null = null
let _trackGain: GainNode | null = null
let _scheduler: ReturnType<typeof setInterval> | null = null
let _padOscs: OscillatorNode[] = []
let _nextBar = 0
let _track: 'menu' | 'game' | 'game2' | 'game3' | 'game4' | 'skydive' | 'game5' | 'game6' | 'game7' | 'game8' | 'game9' | 'game10' | 'game11' | 'game12' | 'game13' | 'game14' | 'game15' | 'game16' | 'game17' | 'game18' | 'game19' | 'game20' | 'game21' | 'game22' | 'game23' | 'game24' | null = null
let _previewTimer: ReturnType<typeof setTimeout> | null = null

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

// Per-track gain node — disconnected on track switch to silence pre-scheduled notes
function tgain(): GainNode {
  if (!_trackGain) {
    _trackGain = ctx().createGain()
    _trackGain.gain.value = 1
    _trackGain.connect(master())
  }
  return _trackGain
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
  osc.connect(env); env.connect(tgain())
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
  src.connect(filt); filt.connect(env); env.connect(tgain())
  src.start(when)
}

function snare(when: number, vol = 0.18) {
  const c = ctx()
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.12), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource(); const env = c.createGain()
  src.buffer = buf
  env.gain.setValueAtTime(vol, when); env.gain.exponentialRampToValueAtTime(0.001, when + 0.11)
  src.connect(env); env.connect(tgain()); src.start(when)
  const body = c.createOscillator(); const benv = c.createGain()
  body.frequency.setValueAtTime(190, when); body.frequency.exponentialRampToValueAtTime(90, when + 0.05)
  benv.gain.setValueAtTime(vol * 0.5, when); benv.gain.exponentialRampToValueAtTime(0.001, when + 0.05)
  body.connect(benv); benv.connect(tgain()); body.start(when); body.stop(when + 0.06)
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
  osc.connect(filt); filt.connect(env); env.connect(tgain())
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
      osc.connect(filt); filt.connect(g); g.connect(tgain())
      lfo.start(); osc.start()
      _padOscs.push(osc, lfo)
    }
  }
}

function stopPad() {
  for (const o of _padOscs) { try { o.stop() } catch { /* already stopped */ } }
  _padOscs = []
}

function clearAudio() {
  if (_previewTimer) { clearTimeout(_previewTimer); _previewTimer = null }
  if (_scheduler) { clearInterval(_scheduler); _scheduler = null }
  stopPad()
  if (_trackGain) { try { _trackGain.disconnect() } catch { /**/ }; _trackGain = null }
  if (_master) {
    const c = ctx()
    _master.gain.cancelScheduledValues(c.currentTime)
    _master.gain.setTargetAtTime(0, c.currentTime, 0.4)
  }
}

// ── Menu music (A minor, 90 BPM — EPIC orchestral) ───────────────────────────

const MENU_BPM    = 90
const MENU_BEAT   = 60 / MENU_BPM
const MENU_EIGHTH = MENU_BEAT / 2
const MENU_BAR    = MENU_BEAT * 4

// Flowing A-minor arpeggio for epic feel: A3 C4 E4 A4 G4 E4 C4 E4
const MENU_ARP = [220, 261.63, 329.63, 440, 392, 329.63, 261.63, 329.63]

// Heroic melody phrase A (Am: A4 C5 E5 D5 C5 B4 A4 0)
const MENU_MEL_A = [440, 523.25, 659.26, 587.33, 523.25, 493.88, 440, 0]
// Heroic melody phrase B (resolution: G4 A4 C5 E5 D5 C5 B4 A4)
const MENU_MEL_B = [392, 440, 523.25, 659.26, 587.33, 523.25, 493.88, 440]

// Counter-melody (triangle, lower register)
const MENU_COUNTER = [220, 0, 261.63, 0, 246.94, 0, 220, 0]

let _menuMelBar = 0

function scheduleMenuBar(t: number) {
  // Powerful kick on beats 1 and 3
  kick(t, 0.5)
  kick(t + MENU_BEAT * 2, 0.5)

  // Snare on beats 2 and 4
  snare(t + MENU_BEAT, 0.20)
  snare(t + MENU_BEAT * 3, 0.20)

  // Hi-hats on every 1/8 note
  for (let i = 0; i < 8; i++) {
    hihat(t + MENU_EIGHTH * i, i % 2 === 0 ? 0.07 : 0.04, 0.035)
  }

  // Flowing arpeggio with longer notes
  for (let i = 0; i < 8; i++) {
    note(MENU_ARP[i], t + MENU_EIGHTH * i, MENU_BEAT * 1.1, 0.10, 'sine')
  }

  // Heroic melody — alternates between 2-bar phrases
  const mel = _menuMelBar % 2 === 0 ? MENU_MEL_A : MENU_MEL_B
  for (let i = 0; i < 8; i++) {
    if (mel[i] > 0)
      note(mel[i], t + MENU_EIGHTH * i, MENU_BEAT * 0.85, 0.13, 'sine', 3200)
  }

  // Counter-melody (triangle wave)
  for (let i = 0; i < 8; i++) {
    if (MENU_COUNTER[i] > 0)
      note(MENU_COUNTER[i], t + MENU_EIGHTH * i, MENU_BEAT * 1.5, 0.07, 'triangle', 1600)
  }

  // Rich bass — alternating A1=55Hz and E1=41.2Hz
  note(55,   t,                 MENU_BEAT * 1.9, 0.32, 'sine', 200)
  note(41.2, t + MENU_BEAT * 2, MENU_BEAT * 1.6, 0.28, 'sine', 200)

  _menuMelBar++
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
  clearAudio()  // disconnects old _trackGain, silencing pre-scheduled notes; does NOT reset _track
  const c = ctx()
  _nextBar = c.currentTime + 0.05

  // Fresh track gain — old one was disconnected by clearAudio
  _trackGain = c.createGain()
  _trackGain.gain.value = 1
  _trackGain.connect(master())

  // Fade master in
  master().gain.cancelScheduledValues(c.currentTime)
  master().gain.setValueAtTime(0, c.currentTime)
  master().gain.linearRampToValueAtTime(0.4, c.currentTime + 1.5)

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
  _menuMelBar = 0
  startScheduler(MENU_BAR, scheduleMenuBar)
  startPad([110, 130.81, 164.81, 196], 'sine', 1800, 0.018)
  _track = 'menu'
}

export function startGameMusic() {
  if (_track === 'game') return
  _gameMelBar = 0
  startScheduler(GAME_BAR, scheduleGameBar)
  startPad([73.42, 110, 146.83], 'sawtooth', 420, 0.018)
  _track = 'game'
}

// ── Skydive music (E minor, 160 BPM, aggressive) ─────────────────────────────

const SKY_BPM    = 160
const SKY_BEAT   = 60 / SKY_BPM
const SKY_EIGHTH = SKY_BEAT / 2
const SKY_BAR    = SKY_BEAT * 4

// E minor driving bass: E2 B1 D2 B1 G2 B1 D2 E2
const SKY_BASS = [82.41, 61.74, 73.42, 61.74, 98, 61.74, 73.42, 82.41]
// Lead riff (8 steps): E4 G4 B4 E5 D5 B4 G4 E4
const SKY_LEAD = [329.63, 392, 493.88, 659.25, 587.33, 493.88, 392, 329.63]

function scheduleSkydiveBar(t: number) {
  // Hard kick on every beat
  for (let b = 0; b < 4; b++) kick(t + SKY_BEAT * b, 0.65)
  // Fast open hihats
  for (let i = 0; i < 8; i++) hihat(t + SKY_EIGHTH * i, 0.10, 0.025)
  // Driving bass
  for (let i = 0; i < 8; i++)
    note(SKY_BASS[i], t + SKY_EIGHTH * i, SKY_EIGHTH * 0.9, 0.28, 'sawtooth', 450)
  // Aggressive lead riff
  for (let i = 0; i < 8; i++)
    note(SKY_LEAD[i], t + SKY_EIGHTH * i, SKY_EIGHTH * 0.7, 0.13, 'square', 2400)
}

export function startSkydiveMusic() {
  if (_track === 'skydive') return
  startScheduler(SKY_BAR, scheduleSkydiveBar)
  startPad([82.41, 123.47, 164.81], 'sawtooth', 600, 0.025)
  _track = 'skydive'
}

// ── Game track 2 — Industrial metal (F# minor, 150 BPM) ──────────────────────

const G2_BPM    = 150
const G2_BEAT   = 60 / G2_BPM
const G2_EIGHTH = G2_BEAT / 2
const G2_BAR    = G2_BEAT * 4

const G2_BASS = [92.5, 92.5, 138.59, 92.5, 110, 92.5, 123.47, 92.5]
const G2_RIFF = [185, 185, 277.18, 185, 220, 185, 246.94, 369.99]

function scheduleGame2Bar(t: number) {
  // Hard double kick
  kick(t, 0.6); kick(t + G2_BEAT * 0.5, 0.35)
  kick(t + G2_BEAT * 2, 0.6); kick(t + G2_BEAT * 2.5, 0.35)
  // Industrial snare (noise burst on 2 and 4)
  hihat(t + G2_BEAT, 0.25, 0.08); hihat(t + G2_BEAT * 3, 0.25, 0.08)
  // Tight hi-hats
  for (let i = 0; i < 8; i++) hihat(t + G2_EIGHTH * i, 0.06, 0.02)
  // Chunky bass
  for (let i = 0; i < 8; i++)
    note(G2_BASS[i], t + G2_EIGHTH * i, G2_EIGHTH * 0.7, 0.30, 'sawtooth', 320)
  // Aggressive riff
  for (let i = 0; i < 8; i++)
    note(G2_RIFF[i], t + G2_EIGHTH * i, G2_EIGHTH * 0.55, 0.12, 'square', 2200)
}

export function startGameMusic2() {
  if (_track === 'game2') return
  startScheduler(G2_BAR, scheduleGame2Bar)
  startPad([92.5, 138.59, 185], 'sawtooth', 380, 0.020)
  _track = 'game2'
}

// ── Game track 3 — Dark suspense (C minor, 105 BPM) ──────────────────────────

const G3_BPM    = 105
const G3_BEAT   = 60 / G3_BPM
const G3_EIGHTH = G3_BEAT / 2
const G3_BAR    = G3_BEAT * 4

const G3_BASS = [65.41, 65.41, 77.78, 65.41, 87.31, 65.41, 77.78, 58.27]
const G3_MEL  = [261.63, 0, 311.13, 261.63, 0, 349.23, 311.13, 0]

function scheduleGame3Bar(t: number) {
  kick(t, 0.45); kick(t + G3_BEAT * 2, 0.30)
  hihat(t + G3_BEAT, 0.10, 0.06); hihat(t + G3_BEAT * 3, 0.08, 0.06)
  for (let i = 0; i < 8; i++) {
    note(G3_BASS[i], t + G3_EIGHTH * i, G3_EIGHTH * 0.9, 0.20, 'sine', 280)
    if (G3_MEL[i] > 0)
      note(G3_MEL[i], t + G3_EIGHTH * i, G3_EIGHTH * 1.1, 0.07, 'triangle', 1200)
  }
}

export function startGameMusic3() {
  if (_track === 'game3') return
  startScheduler(G3_BAR, scheduleGame3Bar)
  startPad([65.41, 97.99, 130.81], 'triangle', 350, 0.025)
  _track = 'game3'
}

// ── Game track 4 — Intense techno (B minor, 175 BPM) ─────────────────────────

const G4_BPM    = 175
const G4_BEAT   = 60 / G4_BPM
const G4_EIGHTH = G4_BEAT / 2
const G4_BAR    = G4_BEAT * 4

const G4_BASS = [61.74, 61.74, 92.5, 61.74, 73.42, 92.5, 61.74, 82.41]
const G4_LEAD = [246.94, 369.99, 246.94, 493.88, 369.99, 246.94, 369.99, 493.88]

function scheduleGame4Bar(t: number) {
  for (let b = 0; b < 4; b++) kick(t + G4_BEAT * b, 0.55 + (b === 0 ? 0.1 : 0))
  for (let i = 0; i < 8; i++) {
    hihat(t + G4_EIGHTH * i, i % 2 === 0 ? 0.09 : 0.05, 0.018)
    note(G4_BASS[i], t + G4_EIGHTH * i, G4_EIGHTH * 0.8, 0.26, 'sawtooth', 400)
    note(G4_LEAD[i], t + G4_EIGHTH * i, G4_EIGHTH * 0.6, 0.11, 'square', 2600)
  }
}

export function startGameMusic4() {
  if (_track === 'game4') return
  startScheduler(G4_BAR, scheduleGame4Bar)
  startPad([61.74, 92.5, 123.47], 'sawtooth', 500, 0.022)
  _track = 'game4'
}

export function stopMusic() {
  _track = null
  clearAudio()
}

// ── Game track 5 — Action Rock (E minor, 120 BPM) ────────────────────────────

const G5_BPM    = 120
const G5_BEAT   = 60 / G5_BPM
const G5_EIGHTH = G5_BEAT / 2
const G5_16TH   = G5_BEAT / 4
const G5_BAR    = G5_BEAT * 4

const G5_BASS = [82.41, 61.74, 82.41, 98, 110, 123.47, 110, 98]
const G5_LEAD = [329.63, 392, 440, 493.88, 587.33, 493.88, 440, 392]

function scheduleGame5Bar(t: number) {
  kick(t, 0.55); kick(t + G5_BEAT * 2, 0.50)
  snare(t + G5_BEAT, 0.22); snare(t + G5_BEAT * 3, 0.22)
  for (let i = 0; i < 16; i++)
    hihat(t + G5_16TH * i, i % 4 === 0 ? 0.07 : i % 2 === 0 ? 0.05 : 0.03, 0.025)
  for (let i = 0; i < 8; i++) {
    note(G5_BASS[i], t + G5_EIGHTH * i, G5_EIGHTH * 0.8, 0.24, 'sawtooth', 500)
    note(G5_LEAD[i], t + G5_EIGHTH * i, G5_EIGHTH * 0.7, 0.10, 'square', 2000)
  }
}

export function startGameMusic5() {
  if (_track === 'game5') return
  startScheduler(G5_BAR, scheduleGame5Bar)
  startPad([82.41, 123.47, 164.81], 'sawtooth', 600, 0.020)
  _track = 'game5'
}

// ── Game track 6 — Heavy Metal (E minor, 180 BPM) ────────────────────────────

const G6_BPM    = 180
const G6_BEAT   = 60 / G6_BPM
const G6_EIGHTH = G6_BEAT / 2
const G6_BAR    = G6_BEAT * 4

const G6_BASS = [82.41, 82.41, 98, 82.41, 73.42, 82.41, 110, 82.41]
const G6_LEAD = [329.63, 293.66, 261.63, 246.94, 220, 246.94, 261.63, 293.66]

function scheduleGame6Bar(t: number) {
  for (let i = 0; i < 8; i++) kick(t + G6_EIGHTH * i, 0.42 + (i === 0 ? 0.15 : 0))
  snare(t + G6_BEAT, 0.26); snare(t + G6_BEAT * 3, 0.26)
  const g6_16 = G6_BEAT / 4
  for (let i = 0; i < 16; i++) hihat(t + g6_16 * i, 0.05, 0.015)
  for (let i = 0; i < 8; i++) {
    note(G6_BASS[i], t + G6_EIGHTH * i, G6_EIGHTH * 0.55, 0.28, 'sawtooth', 350)
    note(G6_LEAD[i], t + G6_EIGHTH * i, G6_EIGHTH * 0.5, 0.12, 'square', 2800)
  }
}

export function startGameMusic6() {
  if (_track === 'game6') return
  startScheduler(G6_BAR, scheduleGame6Bar)
  startPad([82.41, 110, 138.59], 'sawtooth', 350, 0.018)
  _track = 'game6'
}

// ── Game track 7 — Trance (A minor, 138 BPM) ─────────────────────────────────

const G7_BPM    = 138
const G7_BEAT   = 60 / G7_BPM
const G7_16TH   = G7_BEAT / 4
const G7_BAR    = G7_BEAT * 4

const G7_ARP  = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63]
const G7_BASS = [55, 55, 55, 82.41, 55, 55, 55, 65.41]

function scheduleGame7Bar(t: number) {
  for (let b = 0; b < 4; b++) kick(t + G7_BEAT * b, 0.55)
  snare(t + G7_BEAT, 0.18); snare(t + G7_BEAT * 3, 0.18)
  for (let i = 0; i < 16; i++) hihat(t + G7_16TH * i, i % 4 === 0 ? 0.08 : 0.04, 0.02)
  for (let i = 0; i < 16; i++)
    note(G7_ARP[i % 8], t + G7_16TH * i, G7_16TH * 1.1, 0.08, 'sine', 4000)
  for (let i = 0; i < 8; i++)
    note(G7_BASS[i], t + (G7_BEAT / 2) * i, (G7_BEAT / 2) * 0.9, 0.28, 'sine', 160)
}

export function startGameMusic7() {
  if (_track === 'game7') return
  startScheduler(G7_BAR, scheduleGame7Bar)
  startPad([55, 82.41, 110, 164.81], 'sine', 3000, 0.015)
  _track = 'game7'
}

// ── Game track 8 — Spy Jazz (B minor, 112 BPM) ───────────────────────────────

const G8_BPM    = 112
const G8_BEAT   = 60 / G8_BPM
const G8_EIGHTH = G8_BEAT / 2
const G8_BAR    = G8_BEAT * 4

const G8_BASS    = [61.74, 58.27, 55, 51.91, 49, 51.91, 55, 58.27]
const G8_LEAD    = [493.88, 554.37, 587.33, 659.26, 698.46, 659.26, 587.33, 554.37]
const G8_COUNTER = [246.94, 220, 196, 185, 164.81, 185, 196, 220]

function scheduleGame8Bar(t: number) {
  kick(t, 0.40); kick(t + G8_BEAT * 2, 0.35)
  hihat(t + G8_BEAT, 0.12, 0.08); hihat(t + G8_BEAT * 3, 0.12, 0.08)
  for (let i = 0; i < 4; i++) {
    hihat(t + G8_BEAT * i, 0.04, 0.03)
    hihat(t + G8_BEAT * i + G8_BEAT * 0.67, 0.03, 0.02)
  }
  for (let i = 0; i < 8; i++) {
    note(G8_BASS[i],    t + G8_EIGHTH * i, G8_EIGHTH * 0.8, 0.22, 'sawtooth', 1200)
    note(G8_LEAD[i],    t + G8_EIGHTH * i, G8_EIGHTH * 0.65, 0.11, 'sawtooth', 2200)
    note(G8_COUNTER[i], t + G8_EIGHTH * i, G8_EIGHTH * 1.0,  0.06, 'triangle', 1600)
  }
}

export function startGameMusic8() {
  if (_track === 'game8') return
  startScheduler(G8_BAR, scheduleGame8Bar)
  startPad([61.74, 92.5, 123.47, 185], 'sawtooth', 1400, 0.015)
  _track = 'game8'
}

// ── Game track 9 — Drum & Bass (D minor, 174 BPM) ────────────────────────────

const G9_BPM    = 174
const G9_BEAT   = 60 / G9_BPM
const G9_16TH   = G9_BEAT / 4
const G9_BAR    = G9_BEAT * 4

const G9_KICK_OFFSETS  = [0, 0.5, 2.75, 3]
const G9_SNARE_OFFSETS = [2, 3.5]
const G9_BASS = [36.71, 36.71, 36.71, 55, 36.71, 36.71, 55, 36.71]
const G9_LEAD = [293.66, 349.23, 440, 523.25, 440, 392, 349.23, 329.63]

function scheduleGame9Bar(t: number) {
  for (const pos of G9_KICK_OFFSETS) kick(t + G9_BEAT * pos, 0.55)
  for (const pos of G9_SNARE_OFFSETS) snare(t + G9_BEAT * pos, 0.22)
  for (let i = 0; i < 16; i++) hihat(t + G9_16TH * i, i % 4 === 0 ? 0.07 : 0.03, 0.015)
  for (let i = 0; i < 8; i++) {
    note(G9_BASS[i], t + (G9_BEAT / 2) * i, (G9_BEAT / 2) * 0.95, 0.35, 'sine', 140)
    note(G9_LEAD[i], t + (G9_BEAT / 2) * i, (G9_BEAT / 2) * 0.6, 0.10, 'square', 2400)
  }
}

export function startGameMusic9() {
  if (_track === 'game9') return
  startScheduler(G9_BAR, scheduleGame9Bar)
  startPad([36.71, 55, 73.42], 'sine', 200, 0.020)
  _track = 'game9'
}

// ── Game track 10 — Synthwave (A minor, 100 BPM) ─────────────────────────────

const G10_BPM    = 100
const G10_BEAT   = 60 / G10_BPM
const G10_EIGHTH = G10_BEAT / 2
const G10_16TH   = G10_BEAT / 4
const G10_BAR    = G10_BEAT * 4

const G10_ARP  = [220, 261.63, 329.63, 392, 493.88, 392, 329.63, 261.63]
const G10_MEL  = [440, 392, 349.23, 329.63, 293.66, 329.63, 349.23, 392]
const G10_BASS = [55, 55, 82.41, 55, 65.41, 55, 82.41, 55]

function scheduleGame10Bar(t: number) {
  kick(t, 0.50); kick(t + G10_BEAT * 0.5, 0.25)
  kick(t + G10_BEAT * 2, 0.50); kick(t + G10_BEAT * 2.5, 0.25)
  snare(t + G10_BEAT, 0.20); snare(t + G10_BEAT * 3, 0.20)
  for (let i = 0; i < 16; i++) hihat(t + G10_16TH * i, i % 2 === 0 ? 0.06 : 0.03, 0.02)
  for (let i = 0; i < 8; i++) {
    note(G10_ARP[i],  t + G10_EIGHTH * i, G10_EIGHTH * 1.2, 0.09, 'sine', 5000)
    note(G10_MEL[i],  t + G10_EIGHTH * i, G10_EIGHTH * 0.8, 0.12, 'sawtooth', 2800)
    note(G10_BASS[i], t + G10_EIGHTH * i, G10_EIGHTH * 0.9, 0.26, 'sine', 180)
  }
}

export function startGameMusic10() {
  if (_track === 'game10') return
  startScheduler(G10_BAR, scheduleGame10Bar)
  startPad([55, 82.41, 110, 164.81], 'sine', 4000, 0.018)
  _track = 'game10'
}

// ── Game track 11 — Cyberpunk (G minor, 128 BPM) ─────────────────────────────

const G11_BPM = 128, G11_BEAT = 60/G11_BPM, G11_16T = G11_BEAT/4, G11_BAR = G11_BEAT*4
const G11_BASS = [49, 49, 73.42, 49, 58.27, 49, 65.41, 73.42]
const G11_LEAD = [392, 349.23, 392, 440, 392, 349.23, 311.13, 349.23]

function scheduleGame11Bar(t: number) {
  kick(t, 0.52); kick(t+G11_BEAT*2, 0.48)
  snare(t+G11_BEAT, 0.20); snare(t+G11_BEAT*3, 0.20)
  for (let i=0;i<16;i++) hihat(t+G11_16T*i, i%4===0?0.07:i%2===0?0.04:0.02, 0.018)
  for (let i=0;i<8;i++) {
    note(G11_BASS[i], t+(G11_BEAT/2)*i, (G11_BEAT/2)*0.85, 0.28, 'sawtooth', 320)
    note(G11_LEAD[i], t+(G11_BEAT/2)*i, (G11_BEAT/2)*0.6, 0.11, 'square', 3000)
  }
}

export function startGameMusic11() {
  if (_track === 'game11') return
  startScheduler(G11_BAR, scheduleGame11Bar)
  startPad([49, 73.42, 98, 146.83], 'sawtooth', 600, 0.018)
  _track = 'game11'
}

// ── Game track 12 — Hardstyle (A minor, 150 BPM) ─────────────────────────────

const G12_BPM = 150, G12_BEAT = 60/G12_BPM, G12_16T = G12_BEAT/4, G12_BAR = G12_BEAT*4
const G12_BASS = [55, 55, 55, 82.41, 55, 55, 82.41, 55]

function scheduleGame12Bar(t: number) {
  kick(t, 0.70); kick(t+G12_BEAT*2, 0.65)
  snare(t+G12_BEAT, 0.30); snare(t+G12_BEAT*3, 0.30)
  for (let i=0;i<16;i++) hihat(t+G12_16T*i, 0.05, 0.015)
  for (let i=0;i<8;i++)
    note(G12_BASS[i], t+(G12_BEAT/2)*i, (G12_BEAT/2)*0.7, 0.32, 'sawtooth', 280)
  note(220, t, G12_BEAT*2, 0.08, 'sine', 1800)
  note(196, t+G12_BEAT*2, G12_BEAT*2, 0.08, 'sine', 1800)
}

export function startGameMusic12() {
  if (_track === 'game12') return
  startScheduler(G12_BAR, scheduleGame12Bar)
  startPad([55, 82.41, 110], 'sawtooth', 300, 0.020)
  _track = 'game12'
}

// ── Game track 13 — Dark Electro (C minor, 140 BPM) ──────────────────────────

const G13_BPM = 140, G13_BEAT = 60/G13_BPM, G13_16T = G13_BEAT/4, G13_BAR = G13_BEAT*4
const G13_BASS = [65.41, 65.41, 77.78, 65.41, 65.41, 87.31, 77.78, 65.41]
const G13_LEAD = [261.63, 311.13, 349.23, 311.13, 261.63, 233.08, 246.94, 261.63]

function scheduleGame13Bar(t: number) {
  kick(t, 0.55); kick(t+G13_BEAT, 0.30); kick(t+G13_BEAT*2, 0.55); kick(t+G13_BEAT*3, 0.30)
  snare(t+G13_BEAT, 0.22); snare(t+G13_BEAT*3, 0.22)
  for (let i=0;i<16;i++) hihat(t+G13_16T*i, i%2===0?0.06:0.03, 0.016)
  for (let i=0;i<8;i++) {
    note(G13_BASS[i], t+(G13_BEAT/2)*i, (G13_BEAT/2)*0.8, 0.25, 'sawtooth', 350)
    note(G13_LEAD[i], t+(G13_BEAT/2)*i, (G13_BEAT/2)*0.65, 0.09, 'square', 2400)
  }
}

export function startGameMusic13() {
  if (_track === 'game13') return
  startScheduler(G13_BAR, scheduleGame13Bar)
  startPad([65.41, 97.99, 130.81], 'sawtooth', 400, 0.018)
  _track = 'game13'
}

// ── Game track 14 — Breakbeat (E minor, 132 BPM) ─────────────────────────────

const G14_BPM = 132, G14_BEAT = 60/G14_BPM, G14_16T = G14_BEAT/4, G14_BAR = G14_BEAT*4
const G14_KICK = [0, 0.75, 2, 2.5, 3.25]
const G14_BASS = [82.41, 82.41, 98, 82.41, 73.42, 82.41, 98, 110]
const G14_LEAD = [329.63, 392, 440, 392, 329.63, 293.66, 329.63, 392]

function scheduleGame14Bar(t: number) {
  for (const p of G14_KICK) kick(t+G14_BEAT*p, 0.55)
  snare(t+G14_BEAT, 0.24); snare(t+G14_BEAT*3, 0.20)
  for (let i=0;i<16;i++) hihat(t+G14_16T*i, i%4===0?0.07:0.035, 0.020)
  for (let i=0;i<8;i++) {
    note(G14_BASS[i], t+(G14_BEAT/2)*i, (G14_BEAT/2)*0.8, 0.26, 'sawtooth', 450)
    note(G14_LEAD[i], t+(G14_BEAT/2)*i, (G14_BEAT/2)*0.6, 0.10, 'square', 2200)
  }
}

export function startGameMusic14() {
  if (_track === 'game14') return
  startScheduler(G14_BAR, scheduleGame14Bar)
  startPad([82.41, 123.47, 164.81], 'sawtooth', 500, 0.016)
  _track = 'game14'
}

// ── Game track 15 — Orchestral War (D minor, 90 BPM) ─────────────────────────

const G15_BPM = 90, G15_BEAT = 60/G15_BPM, G15_8TH = G15_BEAT/2, G15_BAR = G15_BEAT*4
const G15_BASS = [73.42, 55, 65.41, 73.42, 58.27, 55, 61.74, 73.42]
const G15_MEL  = [293.66, 349.23, 440, 392, 349.23, 311.13, 329.63, 293.66]
const G15_CTR  = [146.83, 130.81, 146.83, 164.81, 146.83, 130.81, 123.47, 130.81]

function scheduleGame15Bar(t: number) {
  kick(t, 0.60); kick(t+G15_BEAT*2, 0.55)
  snare(t+G15_BEAT, 0.28); snare(t+G15_BEAT*3, 0.28)
  for (let i=0;i<8;i++) hihat(t+G15_8TH*i, i%2===0?0.06:0.03, 0.03)
  for (let i=0;i<8;i++) {
    note(G15_BASS[i], t+G15_8TH*i, G15_8TH*0.9, 0.30, 'sine', 200)
    note(G15_MEL[i],  t+G15_8TH*i, G15_8TH*0.8, 0.13, 'sine', 2800)
    note(G15_CTR[i],  t+G15_8TH*i, G15_8TH*1.2, 0.07, 'triangle', 1200)
  }
}

export function startGameMusic15() {
  if (_track === 'game15') return
  startScheduler(G15_BAR, scheduleGame15Bar)
  startPad([73.42, 110, 146.83, 220], 'sine', 1600, 0.022)
  _track = 'game15'
}

// ── Game track 16 — Neurofunk (D minor, 170 BPM) ─────────────────────────────

const G16_BPM = 170, G16_BEAT = 60/G16_BPM, G16_16T = G16_BEAT/4, G16_BAR = G16_BEAT*4
const G16_KICK = [0, 0.5, 3]
const G16_SNARE = [2, 3.5]
const G16_BASS = [36.71, 36.71, 55, 36.71, 43.65, 36.71, 49, 55]

function scheduleGame16Bar(t: number) {
  for (const p of G16_KICK) kick(t+G16_BEAT*p, 0.60)
  for (const p of G16_SNARE) snare(t+G16_BEAT*p, 0.26)
  for (let i=0;i<16;i++) hihat(t+G16_16T*i, i%4===0?0.08:0.03, 0.015)
  for (let i=0;i<8;i++)
    note(G16_BASS[i], t+(G16_BEAT/2)*i, (G16_BEAT/2)*0.85, 0.38, 'sine', 130)
  note(293.66, t, G16_BEAT, 0.08, 'square', 2000)
  note(311.13, t+G16_BEAT*2, G16_BEAT, 0.08, 'square', 2000)
}

export function startGameMusic16() {
  if (_track === 'game16') return
  startScheduler(G16_BAR, scheduleGame16Bar)
  startPad([36.71, 55, 73.42], 'sine', 150, 0.025)
  _track = 'game16'
}

// ── Game track 17 — Industrial March (B minor, 160 BPM) ──────────────────────

const G17_BPM = 160, G17_BEAT = 60/G17_BPM, G17_16T = G17_BEAT/4, G17_BAR = G17_BEAT*4
const G17_BASS = [61.74, 61.74, 61.74, 73.42, 61.74, 61.74, 82.41, 61.74]
const G17_RIFF = [246.94, 293.66, 246.94, 369.99, 246.94, 329.63, 246.94, 277.18]

function scheduleGame17Bar(t: number) {
  for (let b=0;b<4;b++) { kick(t+G17_BEAT*b, 0.60); kick(t+G17_BEAT*(b+0.5), 0.35) }
  snare(t+G17_BEAT, 0.28); snare(t+G17_BEAT*3, 0.28)
  for (let i=0;i<16;i++) hihat(t+G17_16T*i, 0.04, 0.012)
  for (let i=0;i<8;i++) {
    note(G17_BASS[i], t+(G17_BEAT/2)*i, (G17_BEAT/2)*0.65, 0.30, 'sawtooth', 300)
    note(G17_RIFF[i], t+(G17_BEAT/2)*i, (G17_BEAT/2)*0.5, 0.13, 'square', 2600)
  }
}

export function startGameMusic17() {
  if (_track === 'game17') return
  startScheduler(G17_BAR, scheduleGame17Bar)
  startPad([61.74, 92.5, 123.47], 'sawtooth', 350, 0.018)
  _track = 'game17'
}

// ── Game track 18 — Lo-Fi Hip Hop (C major, 85 BPM) ──────────────────────────

const G18_BPM = 85, G18_BEAT = 60/G18_BPM, G18_8TH = G18_BEAT/2, G18_BAR = G18_BEAT*4
const G18_BASS = [65.41, 65.41, 77.78, 65.41, 87.31, 65.41, 77.78, 73.42]
const G18_MEL  = [523.25, 493.88, 440, 392, 440, 493.88, 523.25, 587.33]

function scheduleGame18Bar(t: number) {
  kick(t, 0.45)
  hihat(t+G18_BEAT, 0.15, 0.10); hihat(t+G18_BEAT*3+G18_BEAT*0.5, 0.10, 0.08)
  for (let i=0;i<8;i++) hihat(t+G18_8TH*i, 0.04, 0.04)
  for (let i=0;i<8;i++) {
    note(G18_BASS[i], t+G18_8TH*i, G18_8TH*1.1, 0.18, 'sine', 350)
    if (i%2===0) note(G18_MEL[i], t+G18_8TH*i, G18_8TH*1.5, 0.07, 'triangle', 2500)
  }
}

export function startGameMusic18() {
  if (_track === 'game18') return
  startScheduler(G18_BAR, scheduleGame18Bar)
  startPad([65.41, 97.99, 130.81, 196], 'triangle', 1500, 0.020)
  _track = 'game18'
}

// ── Game track 19 — Psytrance (A minor, 148 BPM) ─────────────────────────────

const G19_BPM = 148, G19_BEAT = 60/G19_BPM, G19_16T = G19_BEAT/4, G19_BAR = G19_BEAT*4
const G19_ARP  = [220, 261.63, 329.63, 440, 523.25, 440, 329.63, 261.63]
const G19_BASS = [55, 55, 55, 82.41, 55, 55, 55, 65.41]

function scheduleGame19Bar(t: number) {
  for (let b=0;b<4;b++) kick(t+G19_BEAT*b, 0.60)
  snare(t+G19_BEAT, 0.16); snare(t+G19_BEAT*3, 0.16)
  for (let i=0;i<16;i++) hihat(t+G19_16T*i, i%4===0?0.09:0.04, 0.018)
  for (let i=0;i<16;i++)
    note(G19_ARP[i%8], t+G19_16T*i, G19_16T*1.2, 0.09, 'sine', 5000)
  for (let i=0;i<8;i++)
    note(G19_BASS[i], t+(G19_BEAT/2)*i, (G19_BEAT/2)*0.85, 0.28, 'sine', 160)
}

export function startGameMusic19() {
  if (_track === 'game19') return
  startScheduler(G19_BAR, scheduleGame19Bar)
  startPad([55, 82.41, 110, 164.81], 'sine', 3500, 0.016)
  _track = 'game19'
}

// ── Game track 20 — Minimal Techno (F minor, 135 BPM) ────────────────────────

const G20_BPM = 135, G20_BEAT = 60/G20_BPM, G20_16T = G20_BEAT/4, G20_BAR = G20_BEAT*4
const G20_BASS = [43.65, 43.65, 65.41, 43.65, 58.27, 43.65, 65.41, 43.65]
const G20_LEAD = [174.61, 207.65, 174.61, 261.63, 174.61, 207.65, 233.08, 174.61]

function scheduleGame20Bar(t: number) {
  for (let b=0;b<4;b++) kick(t+G20_BEAT*b, 0.52)
  snare(t+G20_BEAT*2, 0.18)
  for (let i=0;i<16;i++) hihat(t+G20_16T*i, i%2===0?0.07:0.03, 0.016)
  for (let i=0;i<8;i++) {
    note(G20_BASS[i], t+(G20_BEAT/2)*i, (G20_BEAT/2)*0.8, 0.30, 'sawtooth', 280)
    note(G20_LEAD[i], t+(G20_BEAT/2)*i, (G20_BEAT/2)*0.55, 0.09, 'square', 1800)
  }
}

export function startGameMusic20() {
  if (_track === 'game20') return
  startScheduler(G20_BAR, scheduleGame20Bar)
  startPad([43.65, 65.41, 87.31], 'sawtooth', 420, 0.018)
  _track = 'game20'
}

// ── Preview ───────────────────────────────────────────────────────────────────

export function previewTrack(track: 'game1' | 'game2' | 'game3' | 'game4' | 'game5' | 'game6' | 'game7' | 'game8' | 'game9' | 'game10' | 'game11' | 'game12' | 'game13' | 'game14' | 'game15' | 'game16' | 'game17' | 'game18' | 'game19' | 'game20', durationMs = 7000) {
  stopMusic()  // clears _track so the start guards pass, cancels any existing preview timer
  if      (track === 'game1')  startGameMusic()
  else if (track === 'game2')  startGameMusic2()
  else if (track === 'game3')  startGameMusic3()
  else if (track === 'game4')  startGameMusic4()
  else if (track === 'game5')  startGameMusic5()
  else if (track === 'game6')  startGameMusic6()
  else if (track === 'game7')  startGameMusic7()
  else if (track === 'game8')  startGameMusic8()
  else if (track === 'game9')  startGameMusic9()
  else if (track === 'game10') startGameMusic10()
  else if (track === 'game11') startGameMusic11()
  else if (track === 'game12') startGameMusic12()
  else if (track === 'game13') startGameMusic13()
  else if (track === 'game14') startGameMusic14()
  else if (track === 'game15') startGameMusic15()
  else if (track === 'game16') startGameMusic16()
  else if (track === 'game17') startGameMusic17()
  else if (track === 'game18') startGameMusic18()
  else if (track === 'game19') startGameMusic19()
  else                         startGameMusic20()
  _previewTimer = setTimeout(() => {
    _previewTimer = null
    stopMusic()
  }, durationMs)
}
