import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'
import { useCustomTracksStore } from '../store/customTracksStore'
import { previewTrack, stopMusic, startMenuMusic, playCustomTrack } from '../game/music'
import { getCtx, getBus, startAudioRecording, stopAudioRecording } from '../game/audioCore'
import { Particles } from './TitleScreen/Particles'
import { playHover, playClick } from '../game/uiSounds'

// ── Types ────────────────────────────────────────────────────────────────────

type PreviewId = 'game1' | 'game2' | 'game3' | 'game4' | 'game5' | 'game6' | 'game7' | 'game8' | 'game9' | 'game10' | 'game11' | 'game12' | 'game13' | 'game14' | 'game15' | 'game16' | 'game17' | 'game18' | 'game19' | 'game20' | 'game21' | 'game22' | 'game23' | 'game24' | 'game25' | 'game26' | 'game27' | 'game28' | 'game29' | 'game30' | 'game31' | 'game32' | 'game33' | 'game34'

type ChannelId = 'kick' | 'snare' | 'hihat' | 'clap' | 'open'
type Pattern = Record<ChannelId, boolean[]>
type Tab = 'studio' | 'music_box'

// ── Built-in track list ───────────────────────────────────────────────────────

const TRACKS: Array<[PreviewId, string, string]> = [
  ['game1',  'TRACK 01', 'D-Moll  138 BPM'],
  ['game2',  'TRACK 02', 'F#-Moll 150 BPM Industrial'],
  ['game3',  'TRACK 03', 'C-Moll  105 BPM Suspense'],
  ['game4',  'TRACK 04', 'H-Moll  175 BPM Techno'],
  ['game5',  'TRACK 05', 'E-Moll  120 BPM Action Rock'],
  ['game6',  'TRACK 06', 'E-Moll  180 BPM Heavy Metal'],
  ['game7',  'TRACK 07', 'A-Moll  138 BPM Trance'],
  ['game8',  'TRACK 08', 'H-Moll  112 BPM Spy Jazz'],
  ['game9',  'TRACK 09', 'D-Moll  174 BPM Drum & Bass'],
  ['game10', 'TRACK 10', 'A-Moll  100 BPM Synthwave'],
  ['game11', 'TRACK 11', 'G-Moll  128 BPM Cyberpunk'],
  ['game12', 'TRACK 12', 'A-Moll  150 BPM Hardstyle'],
  ['game13', 'TRACK 13', 'C-Moll  140 BPM Dark Electro'],
  ['game14', 'TRACK 14', 'E-Moll  132 BPM Breakbeat'],
  ['game15', 'TRACK 15', 'D-Moll   90 BPM Orchestral War'],
  ['game16', 'TRACK 16', 'D-Moll  170 BPM Neurofunk'],
  ['game17', 'TRACK 17', 'H-Moll  160 BPM Industrial March'],
  ['game18', 'TRACK 18', 'C-Dur    85 BPM Lo-Fi'],
  ['game19', 'TRACK 19', 'A-Moll  148 BPM Psytrance'],
  ['game20', 'TRACK 20', 'D-Moll  155 BPM Speedcore'],
  ['game21', 'TRACK 21', 'E-Moll  140 BPM Cinematic'],
  ['game22', 'TRACK 22', 'H-Moll  125 BPM Hybrid'],
  ['game23', 'TRACK 23', 'G-Moll  165 BPM Techno-Industrial'],
  ['game24', 'TRACK 24', 'D-Moll  145 BPM Darkstep'],
  ['game25', 'TRACK 25', 'A-Moll  130 BPM Electronica'],
  ['game26', 'TRACK 26', 'C-Moll  158 BPM Darksynth'],
  ['game27', 'TRACK 27', 'A-Moll  140 BPM Trap'],
  ['game28', 'TRACK 28', 'C-Moll  110 BPM Retrowave'],
  ['game29', 'TRACK 29', 'D-Moll  165 BPM Jungle'],
  ['game30', 'TRACK 30', 'E-Moll  125 BPM Hybrid Orchestral'],
  ['game31', 'TRACK 31', 'E-Moll  128 BPM Agent Techno'],
  ['game32', 'TRACK 32', 'D-Moll  138 BPM Classic Menu'],
  ['game33', 'TRACK 33', 'C-Dur    76 BPM MGS2 Hymn'],
  ['game34', 'TRACK 34', 'D-Moll  152 BPM MGS1 Alert'],
]

const CHANNEL_LABELS: Record<ChannelId, string> = {
  kick:  'KICK',
  snare: 'SNARE',
  hihat: 'HIHAT',
  open:  'OPEN HH',
  clap:  'CLAP',
}

const CHANNEL_COLORS: Record<ChannelId, string> = {
  kick:  '#e05418',
  snare: '#cc44ff',
  hihat: '#44aaff',
  open:  '#44ddcc',
  clap:  '#ffcc00',
}

const DEFAULT_PATTERN: Pattern = {
  kick:  [true, false,false,false, false,false,false,false, true, false,false,false, false,false,false,false],
  snare: [false,false,false,false, true, false,false,false, false,false,false,false, true, false,false,false],
  hihat: [true, false,true, false, true, false,true, false, true, false,true, false, true, false,true, false],
  open:  Array(16).fill(false),
  clap:  Array(16).fill(false),
}

function makeEmpty(): Pattern {
  const empty: Pattern = { kick: [], snare: [], hihat: [], open: [], clap: [] }
  for (const k of Object.keys(empty) as ChannelId[]) empty[k] = Array(16).fill(false)
  return empty
}

// ── Drum synthesis ────────────────────────────────────────────────────────────

function synthKick(when: number, vol = 0.8) {
  const ctx = getCtx()
  const bus = getBus()
  const osc = ctx.createOscillator()
  const g   = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, when)
  osc.frequency.exponentialRampToValueAtTime(40, when + 0.12)
  g.gain.setValueAtTime(vol, when)
  g.gain.exponentialRampToValueAtTime(0.001, when + 0.45)
  osc.connect(g); g.connect(bus)
  osc.start(when); osc.stop(when + 0.5)
}

function synthSnare(when: number, vol = 0.5) {
  const ctx = getCtx()
  const bus = getBus()
  // Tone
  const osc = ctx.createOscillator()
  const g1  = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(200, when)
  g1.gain.setValueAtTime(vol * 0.5, when)
  g1.gain.exponentialRampToValueAtTime(0.001, when + 0.12)
  osc.connect(g1); g1.connect(bus)
  osc.start(when); osc.stop(when + 0.15)
  // Noise
  const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  const bpf   = ctx.createBiquadFilter()
  const g2    = ctx.createGain()
  noise.buffer = buf
  bpf.type = 'bandpass'; bpf.frequency.value = 3500; bpf.Q.value = 0.8
  g2.gain.setValueAtTime(vol, when)
  g2.gain.exponentialRampToValueAtTime(0.001, when + 0.14)
  noise.connect(bpf); bpf.connect(g2); g2.connect(bus)
  noise.start(when)
}

function synthHihat(when: number, vol = 0.3, open = false) {
  const ctx  = getCtx()
  const bus  = getBus()
  const buf  = ctx.createBuffer(1, ctx.sampleRate * (open ? 0.4 : 0.05), ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  const hpf   = ctx.createBiquadFilter()
  const g     = ctx.createGain()
  noise.buffer = buf
  hpf.type = 'highpass'; hpf.frequency.value = 8000
  g.gain.setValueAtTime(vol, when)
  g.gain.exponentialRampToValueAtTime(0.001, when + (open ? 0.38 : 0.04))
  noise.connect(hpf); hpf.connect(g); g.connect(bus)
  noise.start(when)
}

function synthClap(when: number, vol = 0.4) {
  const ctx = getCtx()
  const bus = getBus()
  for (let i = 0; i < 3; i++) {
    const t   = when + i * 0.012
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate)
    const d   = buf.getChannelData(0)
    for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    const bpf   = ctx.createBiquadFilter()
    const g     = ctx.createGain()
    noise.buffer = buf
    bpf.type = 'bandpass'; bpf.frequency.value = 1200; bpf.Q.value = 0.6
    g.gain.setValueAtTime(i === 0 ? vol * 0.6 : vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
    noise.connect(bpf); bpf.connect(g); g.connect(bus)
    noise.start(t)
  }
}

// ── Melody synthesis ──────────────────────────────────────────────────────────

function midiToFreq(m: number) { return 440 * Math.pow(2, (m - 69) / 12) }
const NOTE_LABELS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

function makeScaleNotes(rootMidi: number, intervals: number[]) {
  const notes: Array<{ name: string; freq: number }> = []
  for (let oct = 0; oct < 2; oct++) {
    for (const iv of intervals) {
      const m = rootMidi + oct * 12 + iv
      notes.push({ name: NOTE_LABELS[m % 12] + (Math.floor(m / 12) - 1), freq: midiToFreq(m) })
    }
  }
  return notes.reverse()
}

const MINOR = [0, 2, 3, 5, 7, 8, 10]

const SCALES: Record<string, { label: string; root: string; notes: Array<{ name: string; freq: number }> }> = {
  d_minor: { label: 'D-Moll',  root: 'D',  notes: makeScaleNotes(50, MINOR) },
  a_minor: { label: 'A-Moll',  root: 'A',  notes: makeScaleNotes(45, MINOR) },
  e_minor: { label: 'E-Moll',  root: 'E',  notes: makeScaleNotes(52, MINOR) },
  g_minor: { label: 'G-Moll',  root: 'G',  notes: makeScaleNotes(55, MINOR) },
  c_minor: { label: 'C-Moll',  root: 'C',  notes: makeScaleNotes(48, MINOR) },
  b_minor: { label: 'H-Moll',  root: 'B',  notes: makeScaleNotes(47, MINOR) },
}

function synthMelody(when: number, freq: number, dur: number, wave: OscillatorType = 'sawtooth', vol = 0.32) {
  const ctx    = getCtx()
  const bus    = getBus()
  const osc    = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const g      = ctx.createGain()
  osc.type = wave
  osc.frequency.value = freq
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(600, when)
  filter.frequency.exponentialRampToValueAtTime(2800, when + 0.04)
  filter.Q.value = 3.5
  const rel = Math.min(dur * 0.55, 0.2)
  g.gain.setValueAtTime(0, when)
  g.gain.linearRampToValueAtTime(vol, when + 0.015)
  g.gain.setValueAtTime(vol, when + dur - rel)
  g.gain.exponentialRampToValueAtTime(0.001, when + dur)
  osc.connect(filter); filter.connect(g); g.connect(bus)
  osc.start(when); osc.stop(when + dur + 0.05)
}

// ── Studio tab ───────────────────────────────────────────────────────────────

let _studioTrackCount = 0

function StudioTab() {
  const { addTrack } = useCustomTracksStore()

  const [pattern, setPattern]         = useState<Pattern>(structuredClone(DEFAULT_PATTERN))
  const [melodyPattern, setMelodyPattern] = useState<(number | null)[]>(Array(16).fill(null))
  const [scaleName, setScaleName]     = useState('d_minor')
  const [waveType, setWaveType]       = useState<OscillatorType>('sawtooth')
  const [bpm, setBpm]                 = useState(120)
  const [isPlaying, setIsPlaying]     = useState(false)
  const [isRec, setIsRec]             = useState(false)
  const [curStep, setCurStep]         = useState(-1)
  const [savedMsg, setSavedMsg]       = useState<string | null>(null)

  const patternRef      = useRef(pattern)
  const melodyPatRef    = useRef(melodyPattern)
  const scaleNameRef    = useRef(scaleName)
  const waveTypeRef     = useRef(waveType)
  const bpmRef          = useRef(bpm)
  const nextTimeRef     = useRef(0)
  const curStepRef      = useRef(0)
  const schedulerTimer  = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPlayingRef    = useRef(false)

  useEffect(() => { patternRef.current = pattern },         [pattern])
  useEffect(() => { melodyPatRef.current = melodyPattern }, [melodyPattern])
  useEffect(() => { scaleNameRef.current = scaleName },     [scaleName])
  useEffect(() => { waveTypeRef.current = waveType },       [waveType])
  useEffect(() => { bpmRef.current = bpm },                 [bpm])

  const scheduleNext = useCallback(() => {
    const ctx      = getCtx()
    const stepDur  = 60 / bpmRef.current / 4 // 16th note
    const lookAhead = 0.12

    while (nextTimeRef.current < ctx.currentTime + lookAhead) {
      const step = curStepRef.current
      const t    = nextTimeRef.current
      const p    = patternRef.current
      if (p.kick[step])  synthKick(t)
      if (p.snare[step]) synthSnare(t)
      if (p.hihat[step]) synthHihat(t, 0.3)
      if (p.open[step])  synthHihat(t, 0.3, true)
      if (p.clap[step])  synthClap(t)
      const noteIdx = melodyPatRef.current[step]
      if (noteIdx !== null) {
        const note = SCALES[scaleNameRef.current].notes[noteIdx]
        synthMelody(t, note.freq, stepDur * 0.82, waveTypeRef.current)
      }
      const msUntil = Math.max(0, (t - ctx.currentTime) * 1000)
      const s = step
      setTimeout(() => { if (isPlayingRef.current) setCurStep(s) }, msUntil)
      curStepRef.current = (step + 1) % 16
      nextTimeRef.current += stepDur
    }
  }, [])

  const startPlayback = useCallback(() => {
    const ctx = getCtx()
    curStepRef.current  = 0
    nextTimeRef.current = ctx.currentTime + 0.05
    isPlayingRef.current = true
    setIsPlaying(true)
    scheduleNext()
    schedulerTimer.current = setInterval(scheduleNext, 25)
  }, [scheduleNext])

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
    setCurStep(-1)
    if (schedulerTimer.current) { clearInterval(schedulerTimer.current); schedulerTimer.current = null }
  }, [])

  // cleanup on unmount
  useEffect(() => () => stopPlayback(), [stopPlayback])

  async function handleRec() {
    playClick()
    if (isRec) {
      // Stop recording
      setIsRec(false)
      stopPlayback()
      const blob = await stopAudioRecording()
      if (blob.size > 0) {
        _studioTrackCount++
        const url = URL.createObjectURL(blob)
        addTrack(`Studio Track ${_studioTrackCount}`, url)
        setSavedMsg(`GESPEICHERT: Studio Track ${_studioTrackCount}`)
        setTimeout(() => setSavedMsg(null), 3000)
      }
    } else {
      // Start recording + playback
      startAudioRecording()
      setIsRec(true)
      if (!isPlaying) startPlayback()
    }
  }

  function toggleStep(ch: ChannelId, step: number) {
    playClick()
    setPattern((p) => {
      const next = { ...p, [ch]: [...p[ch]] }
      next[ch][step] = !next[ch][step]
      return next
    })
  }

  function clearPattern() {
    playClick()
    setPattern(makeEmpty())
    setMelodyPattern(Array(16).fill(null))
  }

  function loadDefault() {
    playClick()
    setPattern(structuredClone(DEFAULT_PATTERN))
    setMelodyPattern(Array(16).fill(null))
  }

  function toggleMelody(step: number, noteIdx: number) {
    playClick()
    setMelodyPattern((p) => {
      const next = [...p]
      next[step] = next[step] === noteIdx ? null : noteIdx
      return next
    })
  }

  const channels: ChannelId[] = ['kick', 'snare', 'hihat', 'open', 'clap']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>

      {/* BPM + transport */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em', color: 'rgba(106,112,72,0.6)' }}>BPM</span>
        <button style={transpBtn(false)} onClick={() => { playClick(); setBpm((v) => Math.max(60, v - 5)) }}>−</button>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 14, letterSpacing: '0.1em', color: '#e05418', minWidth: 32, textAlign: 'center' }}>{bpm}</span>
        <button style={transpBtn(false)} onClick={() => { playClick(); setBpm((v) => Math.min(220, v + 5)) }}>+</button>

        <div style={{ flex: 1 }} />

        <button
          style={transpBtn(isPlaying && !isRec)}
          onClick={() => { playClick(); isPlaying ? stopPlayback() : startPlayback() }}
        >{isPlaying ? '■ STOP' : '▶ PLAY'}</button>

        <button
          style={transpBtn(isRec, '#ff3333')}
          onClick={handleRec}
        >{isRec ? '■ REC STOP' : '● REC'}</button>

        <button style={transpBtn(false)} onClick={clearPattern} title="Pattern löschen">✕ CLEAR</button>
        <button style={transpBtn(false)} onClick={loadDefault} title="Standard-Pattern laden">↺ RESET</button>
      </div>

      {/* Recording status */}
      {isRec && (
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.25em',
          color: '#ff3333', textAlign: 'center', animation: 'pulse 0.8s infinite alternate',
        }}>⬤ AUFNAHME LÄUFT — REC STOP drücken zum Speichern</div>
      )}
      {savedMsg && (
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.25em',
          color: '#44ff88', textAlign: 'center',
        }}>{savedMsg}</div>
      )}

      {/* Grid */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ minWidth: 540 }}>
          {/* Step numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(16, 1fr)', gap: 2, marginBottom: 4 }}>
            <div />
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} style={{
                fontFamily: "'Share Tech Mono', monospace", fontSize: 8,
                color: curStep === i ? '#e05418' : i % 4 === 0 ? 'rgba(138,154,98,0.5)' : 'rgba(106,112,72,0.25)',
                textAlign: 'center', letterSpacing: 0,
              }}>{i + 1}</div>
            ))}
          </div>

          {/* Channels */}
          {channels.map((ch) => (
            <div key={ch} style={{ display: 'grid', gridTemplateColumns: '64px repeat(16, 1fr)', gap: 2, marginBottom: 3 }}>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace", fontSize: 8,
                letterSpacing: '0.1em', color: CHANNEL_COLORS[ch],
                display: 'flex', alignItems: 'center',
              }}>{CHANNEL_LABELS[ch]}</div>
              {Array.from({ length: 16 }, (_, step) => {
                const active = pattern[ch][step]
                const isCur  = curStep === step
                return (
                  <button
                    key={step}
                    onClick={() => toggleStep(ch, step)}
                    style={{
                      height: 28,
                      background: active
                        ? isCur ? '#ffffff' : CHANNEL_COLORS[ch]
                        : isCur ? 'rgba(255,255,255,0.08)' : step % 4 === 0 ? 'rgba(138,154,98,0.06)' : 'rgba(10,12,7,0.85)',
                      border: `1px solid ${active ? CHANNEL_COLORS[ch] : 'rgba(138,154,98,0.15)'}`,
                      cursor: 'pointer', transition: 'background 0.06s, border 0.06s',
                      boxShadow: active && isCur ? `0 0 8px ${CHANNEL_COLORS[ch]}` : 'none',
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Melody section */}
      <div style={{ borderTop: '1px solid rgba(68,170,255,0.1)', paddingTop: 12 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em', color: 'rgba(68,170,255,0.6)', marginRight: 4 }}>MELODIE</span>
          {Object.entries(SCALES).map(([key, sc]) => (
            <button
              key={key}
              onClick={() => { playClick(); setScaleName(key) }}
              style={{
                background:  key === scaleName ? 'rgba(68,170,255,0.15)' : 'transparent',
                border:      `1px solid ${key === scaleName ? 'rgba(68,170,255,0.7)' : 'rgba(68,170,255,0.18)'}`,
                color:       key === scaleName ? '#44aaff' : 'rgba(68,170,255,0.45)',
                fontFamily:  "'Share Tech Mono', monospace",
                fontSize: 8, letterSpacing: '0.15em', padding: '4px 8px',
                cursor: 'pointer', transition: 'all 0.1s',
              }}
            >{sc.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          {(['sine', 'triangle', 'sawtooth', 'square'] as const).map((w) => (
            <button
              key={w}
              onClick={() => { playClick(); setWaveType(w) }}
              title={w}
              style={{
                background:  w === waveType ? 'rgba(68,170,255,0.15)' : 'transparent',
                border:      `1px solid ${w === waveType ? 'rgba(68,170,255,0.7)' : 'rgba(68,170,255,0.18)'}`,
                color:       w === waveType ? '#44aaff' : 'rgba(68,170,255,0.45)',
                fontFamily:  "'Share Tech Mono', monospace",
                fontSize: 12, padding: '3px 8px',
                cursor: 'pointer', transition: 'all 0.1s',
              }}
            >{w === 'sine' ? '∿' : w === 'triangle' ? '△' : w === 'sawtooth' ? '⟋' : '⊓'}</button>
          ))}
        </div>

        {/* Piano roll */}
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ minWidth: 540 }}>
            {SCALES[scaleName].notes.map((note, noteIdx) => {
              const isRoot = note.name.replace(/\d+$/, '') === SCALES[scaleName].root
              return (
                <div key={noteIdx} style={{ display: 'grid', gridTemplateColumns: '64px repeat(16, 1fr)', gap: 2, marginBottom: 2 }}>
                  <div style={{
                    fontFamily: "'Share Tech Mono', monospace", fontSize: 8,
                    color: isRoot ? '#44aaff' : 'rgba(68,170,255,0.4)',
                    fontWeight: isRoot ? 'bold' : 'normal',
                    display: 'flex', alignItems: 'center',
                  }}>{note.name}</div>
                  {Array.from({ length: 16 }, (_, step) => {
                    const active = melodyPattern[step] === noteIdx
                    const isCur  = curStep === step
                    return (
                      <button
                        key={step}
                        onClick={() => toggleMelody(step, noteIdx)}
                        style={{
                          height: 20,
                          background: active
                            ? isCur ? '#ffffff' : '#44aaff'
                            : isCur ? 'rgba(255,255,255,0.06)' : step % 4 === 0 ? 'rgba(68,170,255,0.04)' : 'rgba(10,12,7,0.7)',
                          border: `1px solid ${active ? '#44aaff' : isRoot ? 'rgba(68,170,255,0.18)' : 'rgba(68,170,255,0.08)'}`,
                          cursor: 'pointer', transition: 'background 0.06s',
                          boxShadow: active && isCur ? '0 0 6px #44aaff' : 'none',
                        }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{
        fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.2em',
        color: 'rgba(106,112,72,0.35)', textAlign: 'center',
      }}>
        Aufnahme stoppt mit REC STOP → wird als Custom Track in der Music Box gespeichert
      </div>
    </div>
  )
}

function transpBtn(active: boolean, color = '#e05418'): React.CSSProperties {
  return {
    background:  active ? `${color}22` : 'rgba(10,12,7,0.85)',
    border:      `1px solid ${active ? color : 'rgba(138,154,98,0.2)'}`,
    color:       active ? color : 'rgba(200,196,176,0.6)',
    fontFamily:  "'Share Tech Mono', monospace",
    fontSize:    9, letterSpacing: '0.2em', padding: '6px 12px',
    cursor:      'pointer', textTransform: 'uppercase', transition: 'all 0.1s',
    boxShadow:   active ? `0 0 8px ${color}44` : 'none',
    flexShrink:  0,
  }
}

// ── Music Box tab ─────────────────────────────────────────────────────────────

function MusicBoxTab() {
  const { musicTrack, setMusicTrack, musicEnabled, setMusicEnabled,
          customTrackId, setCustomTrackId } = useSettingsStore()
  const { tracks: customTracks, addTrack, removeTrack } = useCustomTracksStore()
  const [previewing, setPreviewing] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  function handlePreview(id: PreviewId) {
    if (previewing === id) { stopMusic(); setPreviewing(null); return }
    setPreviewing(id)
    previewTrack(id, 8000)
    setTimeout(() => setPreviewing(null), 8200)
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    addTrack(file.name.replace(/\.[^.]+$/, ''), url)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Music enable + auto */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em', color: 'rgba(106,112,72,0.7)', textTransform: 'uppercase' }}>Musik</span>
        <div onClick={() => { playClick(); setMusicEnabled(!musicEnabled) }} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', cursor: 'pointer',
          border: `1px solid ${musicEnabled ? 'rgba(224,84,24,0.6)' : 'rgba(138,154,98,0.2)'}`,
          background: musicEnabled ? 'rgba(224,84,24,0.08)' : 'transparent', transition: 'all 0.15s',
        }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em', color: musicEnabled ? '#e05418' : 'rgba(106,112,72,0.5)', textTransform: 'uppercase' }}>
            {musicEnabled ? 'EIN' : 'AUS'}
          </span>
        </div>
        <div onClick={() => { playClick(); setMusicTrack('auto') }} style={{
          padding: '6px 14px', cursor: 'pointer',
          border: `1px solid ${musicTrack === 'auto' ? 'rgba(224,84,24,0.6)' : 'rgba(138,154,98,0.2)'}`,
          background: musicTrack === 'auto' ? 'rgba(224,84,24,0.08)' : 'transparent',
          fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em',
          color: musicTrack === 'auto' ? '#e05418' : 'rgba(106,112,72,0.5)', textTransform: 'uppercase', transition: 'all 0.15s',
        }}>AUTO (ZUFÄLLIG)</div>
        <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleFileImport} />
        <button
          onClick={() => fileRef.current?.click()}
          onMouseEnter={() => playHover()}
          style={{
            background: 'transparent', border: '1px dashed rgba(138,154,98,0.3)', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em',
            color: 'rgba(138,154,98,0.6)', padding: '6px 14px', textTransform: 'uppercase', transition: 'all 0.15s',
          }}
        >+ IMPORTIEREN</button>
      </div>

      {/* Track list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {customTracks.length > 0 && (
          <>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.4em', color: 'rgba(106,112,72,0.4)', paddingBottom: 6, paddingTop: 4 }}>EIGENE TRACKS</div>
            {customTracks.map((ct) => (
              <TrackRow
                key={ct.id} id={ct.id} label={ct.name} desc="CUSTOM"
                active={musicTrack === 'custom' && customTrackId === ct.id}
                previewing={previewing === ct.id}
                onSelect={() => { playClick(); setMusicTrack('custom'); setCustomTrackId(ct.id) }}
                onPreview={() => {
                  if (previewing === ct.id) { stopMusic(); setPreviewing(null); return }
                  setPreviewing(ct.id); playCustomTrack(ct.url)
                  setTimeout(() => setPreviewing(null), 8200)
                }}
                onRemove={() => { removeTrack(ct.id); if (customTrackId === ct.id) setMusicTrack('auto') }}
              />
            ))}
            <div style={{ height: 1, background: 'rgba(138,154,98,0.12)', margin: '6px 0' }} />
          </>
        )}
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.4em', color: 'rgba(106,112,72,0.4)', paddingBottom: 6, paddingTop: 4 }}>EINGEBAUTE TRACKS</div>
        {TRACKS.map(([id, label, desc]) => (
          <TrackRow
            key={id} id={id} label={label} desc={desc}
            active={musicTrack === id}
            previewing={previewing === id}
            onSelect={() => { playClick(); setMusicTrack(id) }}
            onPreview={() => handlePreview(id)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TrackPlayer() {
  const setPhase = useGameStore((s) => s.setPhase)
  const musicEnabled = useSettingsStore((s) => s.musicEnabled)
  const [tab, setTab] = useState<Tab>('studio')

  useEffect(() => {
    if (tab === 'studio') {
      stopMusic()
    } else if (musicEnabled) {
      startMenuMusic()
    }
  }, [tab, musicEnabled])

  function handleBack() {
    playClick()
    stopMusic()
    setPhase('title_screen')
  }

  const tabBtn = (t: Tab): React.CSSProperties => ({
    background:  tab === t ? 'rgba(224,84,24,0.12)' : 'transparent',
    border:      `1px solid ${tab === t ? 'rgba(224,84,24,0.7)' : 'rgba(138,154,98,0.2)'}`,
    color:       tab === t ? '#e05418' : 'rgba(200,196,176,0.55)',
    fontFamily:  "'Share Tech Mono', monospace",
    fontSize:    10, letterSpacing: '0.25em', padding: '8px 20px',
    cursor:      'pointer', textTransform: 'uppercase', transition: 'all 0.12s',
  })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', animation: 'menuFadeIn 0.35s cubic-bezier(0.2,0.8,0.3,1) both' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(224,84,24,0.8), transparent)' }} />
      <Particles />

      {([['top','left'],['top','right'],['bottom','left'],['bottom','right']] as const).map(([v,h]) => (
        <div key={v+h} style={{
          position: 'absolute', [v]: 20, [h]: 24, width: 28, height: 28,
          [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]: '1.5px solid #8a9a62',
          [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]: '1.5px solid #8a9a62',
          opacity: 0.5, pointerEvents: 'none',
        }} />
      ))}

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 52, paddingBottom: 16 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: '0.3em', color: '#e05418', marginBottom: 6 }}>
            Δ COVERT OPERATIONS
          </div>
          <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 4.5vw, 44px)', letterSpacing: '0.18em', color: 'rgba(224,220,200,0.9)', textShadow: '0 0 40px rgba(224,84,24,0.15)' }}>
            TRACK PLAYER
          </div>
          <div style={{ width: 260, height: 1, background: 'rgba(224,84,24,0.5)', margin: '10px auto 0' }} />
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20, flexShrink: 0 }}>
          <button style={tabBtn('studio')}   onClick={() => { playClick(); setTab('studio') }}>STUDIO</button>
          <button style={tabBtn('music_box')} onClick={() => { playClick(); setTab('music_box') }}>MUSIC BOX</button>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, width: 'min(96vw, 720px)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {tab === 'studio'    && <StudioTab />}
          {tab === 'music_box' && <MusicBoxTab />}
        </div>

        {/* Back button */}
        <div style={{ marginTop: 16, flexShrink: 0, paddingBottom: 'max(8px, calc(env(safe-area-inset-bottom, 0px) + 8px))' }}>
          <button
            onClick={handleBack}
            onMouseEnter={(e) => { playHover(); (e.currentTarget as HTMLButtonElement).style.color = 'rgba(224,84,24,0.8)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(106,112,72,0.6)' }}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.3em',
              color: 'rgba(106,112,72,0.6)', textTransform: 'uppercase', transition: 'color 0.15s',
            }}
          >← ZURÜCK</button>
        </div>
      </div>
    </div>
  )
}

// ── Track row ─────────────────────────────────────────────────────────────────

interface TrackRowProps {
  id: string; label: string; desc: string
  active: boolean; previewing: boolean
  onSelect: () => void; onPreview: () => void; onRemove?: () => void
}

function TrackRow({ id: _id, label, desc, active, previewing, onSelect, onPreview, onRemove }: TrackRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(138,154,98,0.07)' }}>
      <span style={{
        fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 11,
        color: '#e05418', width: 12, flexShrink: 0, opacity: active ? 1 : 0, transition: 'opacity 0.15s',
      }}>Δ</span>
      <button onClick={onSelect} onMouseEnter={() => playHover()} style={{
        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.28em',
        color: active ? '#e05418' : 'rgba(220,216,200,0.75)',
        textTransform: 'uppercase', transition: 'color 0.15s', flexShrink: 0, width: 90, padding: 0,
      }}>{label}</button>
      <span style={{
        fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.15em',
        color: 'rgba(106,112,72,0.5)', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>{desc}</span>
      <button onClick={onPreview} onMouseEnter={() => playHover()} style={{
        background: previewing ? 'rgba(224,84,24,0.12)' : 'transparent',
        border: `1px solid ${previewing ? 'rgba(224,84,24,0.7)' : 'rgba(138,154,98,0.2)'}`,
        cursor: 'pointer', padding: '4px 10px', flexShrink: 0,
        fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.2em',
        color: previewing ? '#e05418' : 'rgba(106,112,72,0.5)',
        textTransform: 'uppercase', transition: 'all 0.12s',
      }}>{previewing ? '■' : '▶'}</button>
      {onRemove && (
        <button onClick={onRemove} onMouseEnter={() => playHover()} style={{
          background: 'transparent', border: '1px solid rgba(138,154,98,0.15)',
          cursor: 'pointer', padding: '4px 8px', flexShrink: 0,
          fontFamily: "'Share Tech Mono', monospace", fontSize: 8,
          color: 'rgba(138,154,98,0.4)', transition: 'all 0.12s',
        }}>✕</button>
      )}
    </div>
  )
}
