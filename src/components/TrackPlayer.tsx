import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'
import { useCustomTracksStore } from '../store/customTracksStore'
import { previewTrack, stopMusic, playCustomTrack } from '../game/music'
import { Particles } from './TitleScreen/Particles'
import { playHover, playClick } from '../game/uiSounds'

type PreviewId = 'game1' | 'game2' | 'game3' | 'game4' | 'game5' | 'game6' | 'game7' | 'game8' | 'game9' | 'game10' | 'game11' | 'game12' | 'game13' | 'game14' | 'game15' | 'game16' | 'game17' | 'game18' | 'game19' | 'game20' | 'game21' | 'game22' | 'game23' | 'game24' | 'game25' | 'game26' | 'game27' | 'game28' | 'game29' | 'game30' | 'game31' | 'game32' | 'game33' | 'game34'

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

export function TrackPlayer() {
  const setPhase     = useGameStore((s) => s.setPhase)
  const { musicTrack, setMusicTrack, musicEnabled, setMusicEnabled,
          customTrackId, setCustomTrackId } = useSettingsStore()
  const { tracks: customTracks, addTrack, removeTrack } = useCustomTracksStore()
  const [previewing, setPreviewing] = useState<string | null>(null)
  const fileInputRef = useState<HTMLInputElement | null>(null)

  function handlePreview(id: PreviewId) {
    if (previewing === id) { stopMusic(); setPreviewing(null); return }
    setPreviewing(id)
    previewTrack(id, 8000)
    setTimeout(() => setPreviewing(null), 8200)
  }

  function handleBack() {
    playClick()
    stopMusic()
    setPreviewing(null)
    setPhase('title_screen')
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    addTrack(file.name.replace(/\.[^.]+$/, ''), url)
    e.target.value = ''
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', animation: 'menuFadeIn 0.35s cubic-bezier(0.2,0.8,0.3,1) both' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(224,84,24,0.8), transparent)' }} />
      <Particles />

      {/* Corner brackets */}
      {([['top','left'],['top','right'],['bottom','left'],['bottom','right']] as const).map(([v,h]) => (
        <div key={v+h} style={{
          position: 'absolute', [v]: 20, [h]: 24, width: 28, height: 28,
          [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]: '1.5px solid #8a9a62',
          [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]: '1.5px solid #8a9a62',
          opacity: 0.5, pointerEvents: 'none',
        }} />
      ))}

      {/* Stamps */}
      <div style={stamp('left')}>CLASSIFIED</div>
      <div style={{ ...stamp('left'), top: 36, fontSize: 7, letterSpacing: '0.2em', color: 'rgba(106,112,72,0.35)' }}>© 2026 Loona! Designs</div>
      <div style={stamp('right')}>TOP SECRET // CO-Δ-0.1.0-ALPHA</div>

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 64, paddingBottom: 24 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: '0.3em', color: '#e05418', marginBottom: 8 }}>
            Δ COVERT OPERATIONS
          </div>
          <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: '0.18em', color: 'rgba(224,220,200,0.9)', textShadow: '0 0 40px rgba(224,84,24,0.15)' }}>
            TRACK PLAYER
          </div>
          <div style={{ width: 260, height: 1, background: 'rgba(224,84,24,0.5)', margin: '12px auto 0' }} />
        </div>

        {/* Music enable toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em', color: 'rgba(106,112,72,0.7)', textTransform: 'uppercase' }}>Musik</span>
          <div
            onClick={() => { playClick(); setMusicEnabled(!musicEnabled) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', cursor: 'pointer',
              border: `1px solid ${musicEnabled ? 'rgba(224,84,24,0.6)' : 'rgba(138,154,98,0.2)'}`,
              background: musicEnabled ? 'rgba(224,84,24,0.08)' : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em', color: musicEnabled ? '#e05418' : 'rgba(106,112,72,0.5)', textTransform: 'uppercase' }}>
              {musicEnabled ? 'EIN' : 'AUS'}
            </span>
          </div>
          <div
            onClick={() => { playClick(); setMusicTrack('auto') }}
            style={{
              padding: '6px 14px', cursor: 'pointer',
              border: `1px solid ${musicTrack === 'auto' ? 'rgba(224,84,24,0.6)' : 'rgba(138,154,98,0.2)'}`,
              background: musicTrack === 'auto' ? 'rgba(224,84,24,0.08)' : 'transparent',
              fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em',
              color: musicTrack === 'auto' ? '#e05418' : 'rgba(106,112,72,0.5)',
              textTransform: 'uppercase', transition: 'all 0.15s',
            }}
          >AUTO (ZUFÄLLIG)</div>
        </div>

        {/* Track list */}
        <div style={{
          flex: 1, overflowY: 'auto', width: 'min(96vw, 680px)',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {/* Custom tracks */}
          {customTracks.length > 0 && (
            <>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.4em', color: 'rgba(106,112,72,0.4)', paddingBottom: 6, paddingTop: 4 }}>
                EIGENE TRACKS
              </div>
              {customTracks.map((ct) => (
                <TrackRow
                  key={ct.id}
                  id={ct.id}
                  label={ct.name}
                  desc="CUSTOM"
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

          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.4em', color: 'rgba(106,112,72,0.4)', paddingBottom: 6, paddingTop: 4 }}>
            EINGEBAUTE TRACKS
          </div>
          {TRACKS.map(([id, label, desc]) => (
            <TrackRow
              key={id}
              id={id}
              label={label}
              desc={desc}
              active={musicTrack === id}
              previewing={previewing === id}
              onSelect={() => { playClick(); setMusicTrack(id) }}
              onPreview={() => handlePreview(id)}
            />
          ))}
        </div>

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexShrink: 0, alignItems: 'center' }}>
          <input
            ref={(el) => { (fileInputRef as unknown as React.MutableRefObject<HTMLInputElement | null>).current = el }}
            type="file" accept="audio/*" style={{ display: 'none' }}
            onChange={handleFileImport}
          />
          <button
            onClick={() => (fileInputRef as unknown as React.MutableRefObject<HTMLInputElement | null>).current?.click()}
            onMouseEnter={() => playHover()}
            style={{
              background: 'transparent', border: '1px dashed rgba(138,154,98,0.3)', cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em',
              color: 'rgba(138,154,98,0.6)', padding: '8px 16px', textTransform: 'uppercase', transition: 'all 0.15s',
            }}
          >+ TRACK IMPORTIEREN</button>

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

interface TrackRowProps {
  id: string; label: string; desc: string
  active: boolean; previewing: boolean
  onSelect: () => void; onPreview: () => void; onRemove?: () => void
}

function TrackRow({ id: _id, label, desc, active, previewing, onSelect, onPreview, onRemove }: TrackRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(138,154,98,0.07)' }}>
      {/* Active pip */}
      <span style={{
        fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 11,
        color: '#e05418', width: 12, flexShrink: 0, opacity: active ? 1 : 0, transition: 'opacity 0.15s',
      }}>Δ</span>

      {/* Label */}
      <button
        onClick={onSelect}
        onMouseEnter={() => playHover()}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
          fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.28em',
          color: active ? '#e05418' : 'rgba(220,216,200,0.75)',
          textTransform: 'uppercase', transition: 'color 0.15s', flexShrink: 0,
          width: 90, padding: 0,
        }}
      >{label}</button>

      {/* Description */}
      <span style={{
        fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.15em',
        color: 'rgba(106,112,72,0.5)', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>{desc}</span>

      {/* Preview */}
      <button
        onClick={onPreview}
        onMouseEnter={() => playHover()}
        style={{
          background: previewing ? 'rgba(224,84,24,0.12)' : 'transparent',
          border: `1px solid ${previewing ? 'rgba(224,84,24,0.7)' : 'rgba(138,154,98,0.2)'}`,
          cursor: 'pointer', padding: '4px 10px', flexShrink: 0,
          fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.2em',
          color: previewing ? '#e05418' : 'rgba(106,112,72,0.5)',
          textTransform: 'uppercase', transition: 'all 0.12s',
        }}
      >{previewing ? '■' : '▶'}</button>

      {/* Remove (custom only) */}
      {onRemove && (
        <button
          onClick={onRemove}
          onMouseEnter={() => playHover()}
          style={{
            background: 'transparent', border: '1px solid rgba(138,154,98,0.15)',
            cursor: 'pointer', padding: '4px 8px', flexShrink: 0,
            fontFamily: "'Share Tech Mono', monospace", fontSize: 8,
            color: 'rgba(138,154,98,0.4)', transition: 'all 0.12s',
          }}
        >✕</button>
      )}
    </div>
  )
}

const stamp = (side: 'left' | 'right'): React.CSSProperties => ({
  position: 'absolute', top: 22, [side]: 64,
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
  color: 'rgba(106,112,72,0.5)', pointerEvents: 'none',
})
