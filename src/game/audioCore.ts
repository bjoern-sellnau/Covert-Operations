// Shared AudioContext and master bus for sounds + music.
// All audio nodes connect to getBus() instead of destination directly,
// so recording can tap the full mix via MediaStreamDestination.

let _ctx: AudioContext | null = null
let _bus: GainNode | null = null

export function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') void _ctx.resume()
  return _ctx
}

export function getBus(): GainNode {
  const c = getCtx()
  if (!_bus) {
    _bus = c.createGain()
    _bus.connect(c.destination)
  }
  return _bus
}

// ── Audio recording ──────────────────────────────────────────────────────────

let _recorder: MediaRecorder | null = null
let _chunks: Blob[] = []
let _dest: MediaStreamAudioDestinationNode | null = null

export function isAudioRecording(): boolean {
  return _recorder?.state === 'recording'
}

export function startAudioRecording(): boolean {
  if (typeof MediaRecorder === 'undefined') return false
  if (_recorder?.state === 'recording') return true
  const c = getCtx()
  _dest = c.createMediaStreamDestination()
  getBus().connect(_dest)
  _chunks = []
  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(m =>
    MediaRecorder.isTypeSupported(m)
  ) ?? ''
  _recorder = new MediaRecorder(_dest.stream, mime ? { mimeType: mime } : {})
  _recorder.ondataavailable = (e) => { if (e.data.size > 0) _chunks.push(e.data) }
  _recorder.start(200)
  return true
}

export function stopAudioRecording(): Promise<Blob> {
  return new Promise((resolve) => {
    if (!_recorder || _recorder.state !== 'recording') { resolve(new Blob()); return }
    _recorder.onstop = () => {
      const mime = _recorder?.mimeType ?? 'audio/webm'
      const blob = new Blob(_chunks, { type: mime })
      _chunks = []
      if (_dest) {
        try { getBus().disconnect(_dest) } catch { /* already disconnected */ }
        _dest = null
      }
      resolve(blob)
    }
    _recorder.stop()
  })
}
