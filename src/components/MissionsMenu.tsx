import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useDemoStore } from '../store/demoStore'
import type { CutsceneMode } from '../store/demoStore'
import type { GamePhase } from '../game/types'
import { Particles } from './TitleScreen/Particles'
import { playHover, playClick } from '../game/uiSounds'

interface Mission {
  mode?: CutsceneMode
  directPhase?: GamePhase
  title: string; sub: string; desc: string
}

const MISSIONS: Mission[] = [
  {
    mode: 'skydive',
    title: 'SKYDIVE INFILTRATION',
    sub:   'ABSPRUNG · SPEZIALOP 2.0',
    desc:  'Stürze aus 3.000m. Weiche Feinden aus, sammel Waffen ein und deploye den Fallschirm rechtzeitig.',
  },
  {
    directPhase: 'skydive_v1',
    title: 'SKYDIVE — THE BEGINNING',
    sub:   'KLASSISCH · V1 · ORIGINAL',
    desc:  'Der erste Absprung. Top-Down-3D-Szene mit Hindernissen, Feinden und Fallschirm-Mechanik.',
  },
  {
    directPhase: 'skydive_v3',
    title: 'SKYDIVE — AFTERMATH',
    sub:   'FIRST PERSON · V3 · ALPHA',
    desc:  'Nach der Landung: Räum die Infiltrations-Zone. First-Person-Kampf mit deiner Skydive-Ausrüstung.',
  },
  {
    mode: 'shooting_range',
    title: 'SCHIESSTAND',
    sub:   'TRAINING · UNBEGRENZTE MUNITION',
    desc:  'Teste deine Waffen im gesicherten Trainingsbereich. Keine LP-Strafe, unbegrenzte Munition.',
  },
]

export function MissionsMenu() {
  const setPhase    = useGameStore((s) => s.setPhase)
  const setGameMode = useGameStore((s) => s.setGameMode)
  const { cutsceneMap, demos } = useDemoStore()
  const [hovered, setHovered] = useState<string | null>(null)

  function launch(m: Mission) {
    playClick()
    if (m.directPhase) {
      setPhase(m.directPhase)
      return
    }
    if (m.mode) {
      setGameMode(m.mode)
      const csId = cutsceneMap[m.mode]
      setPhase(csId && demos.some((d) => d.id === csId) ? 'cutscene' : 'briefing')
    }
  }

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

      <div style={stampStyle('left')}>CLASSIFIED</div>
      <div style={{ ...stampStyle('left'), top: 36, fontSize: 7, letterSpacing: '0.2em', color: 'rgba(106,112,72,0.35)' }}>© 2026 Loona! Designs</div>
      <div style={stampStyle('right')}>TOP SECRET // CO-Δ-0.1.0-ALPHA</div>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: '0.3em', color: '#e05418' }}>
            Δ COVERT OPERATIONS
          </div>
        </div>

        <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(30px, 5.5vw, 52px)', letterSpacing: '0.18em', color: 'rgba(224,220,200,0.9)', marginBottom: 4, textShadow: '0 0 40px rgba(224,84,24,0.15)' }}>
          MISSIONEN
        </div>
        <div style={{ width: 320, height: 1, background: 'rgba(224,84,24,0.5)', marginBottom: 32 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 'min(92vw, 460px)' }}>
          {MISSIONS.map((m) => {
            const key   = m.mode ?? m.directPhase ?? m.title
            const isHov = hovered === key
            const isV3  = m.directPhase === 'skydive_v3'
            return (
              <div
                key={key}
                onMouseEnter={() => { setHovered(key); playHover() }}
                onMouseLeave={() => setHovered(null)}
                onClick={() => launch(m)}
                style={{
                  padding: '14px 0', borderBottom: '1px solid rgba(138,154,98,0.1)',
                  cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 11,
                    color: isV3 ? '#ffaa00' : '#e05418',
                    opacity: isHov ? 1 : 0, transform: isHov ? 'translateX(0)' : 'translateX(-6px)',
                    transition: 'opacity 0.15s, transform 0.15s', width: 12, display: 'inline-block', flexShrink: 0, marginTop: 2,
                  }}>Δ</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                        fontSize: 13, letterSpacing: isHov ? '0.22em' : '0.16em',
                        textTransform: 'uppercase', color: isHov ? '#f4f0e4' : 'rgba(220,216,200,0.8)',
                        transition: 'color 0.15s, letter-spacing 0.15s',
                      }}>{m.title}</div>
                      {isV3 && (
                        <div style={{ fontSize: 8, letterSpacing: 2, color: '#ffaa00', border: '1px solid #ffaa0066', padding: '1px 5px' }}>
                          ALPHA
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.25em', color: 'rgba(106,112,72,0.6)' }}>
                      {m.sub}
                    </div>
                  </div>
                </div>
                <div style={{ paddingLeft: 24, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.12em', color: 'rgba(106,112,72,0.5)', lineHeight: 1.6 }}>
                  {m.desc}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: isHov ? `rgba(${isV3 ? '255,170,0' : '224,84,24'},0.4)` : 'transparent', transition: 'background 0.15s' }} />
              </div>
            )
          })}
        </div>

        <button
          onClick={() => { playClick(); setPhase('singleplayer_menu') }}
          style={{ marginTop: 40, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(106,112,72,0.6)', transition: 'color 0.15s' }}
          onMouseEnter={(e) => { playHover(); (e.currentTarget as HTMLButtonElement).style.color = 'rgba(224,84,24,0.8)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(106,112,72,0.6)' }}
        >← ZURÜCK</button>
      </div>
    </div>
  )
}

const stampStyle = (side: 'left' | 'right'): CSSProperties => ({
  position: 'absolute', top: 22, [side]: 64,
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
  color: 'rgba(106,112,72,0.5)', pointerEvents: 'none',
})
