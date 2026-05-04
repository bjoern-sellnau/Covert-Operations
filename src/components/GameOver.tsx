import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from '../game/loadoutStore'
import { Particles } from './TitleScreen/Particles'
import { playClick, playHover } from '../game/uiSounds'

export function GameOver() {
  const setPhase       = useGameStore((s) => s.setPhase)
  const setPlaytesting = useGameStore((s) => s.setPlaytesting)
  const setGameMode    = useGameStore((s) => s.setGameMode)
  const score          = useGameStore((s) => s.score)
  const wave           = useGameStore((s) => s.wave)
  const creditsEarned  = useGameStore((s) => s.creditsEarned)
  const isPlaytesting  = useGameStore((s) => s.isPlaytesting)
  const gameMode       = useGameStore((s) => s.gameMode)
  const skipShop       = useGameStore((s) => s.skipShop)
  const { credits }    = useLoadoutStore()

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      animation: 'menuFadeIn 0.4s ease both',
      userSelect: 'none',
    }}>
      {/* Background — darker, faint red tint */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(28,8,8,0.98) 0%, rgba(4,4,4,1) 70%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.8) 100%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(180,20,20,0.7), transparent)' }} />
      <Particles />

      {/* Corner brackets */}
      {([['top','left'],['top','right'],['bottom','left'],['bottom','right']] as const).map(([v,h]) => (
        <div key={v+h} style={{
          position: 'absolute', [v]: 20, [h]: 24, width: 28, height: 28,
          [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]: '1.5px solid rgba(138,80,80,0.5)',
          [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]: '1.5px solid rgba(138,80,80,0.5)',
          opacity: 0.5, pointerEvents: 'none',
        }} />
      ))}

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
            fontSize: 'clamp(48px, 10vw, 80px)', letterSpacing: '0.12em',
            color: 'rgba(200,60,60,0.95)',
            textShadow: '0 0 40px rgba(200,40,40,0.4), 0 0 80px rgba(160,20,20,0.2)',
            lineHeight: 1, marginBottom: 6,
          }}>MISSION</div>
          <div style={{
            fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
            fontSize: 'clamp(24px, 5vw, 40px)', letterSpacing: '0.28em',
            color: 'rgba(180,80,80,0.8)',
            textShadow: '0 0 20px rgba(180,40,40,0.3)',
          }}>GESCHEITERT</div>
          <div style={{ width: 200, height: 1, background: 'rgba(180,40,40,0.4)', margin: '16px auto 0' }} />
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 48, border: '1px solid rgba(138,80,80,0.2)', overflow: 'hidden' }}>
          {[
            { label: 'WAVE',            value: String(wave),              color: 'rgba(224,220,200,0.85)' },
            { label: 'PUNKTE',          value: score.toString().padStart(6,'0'), color: 'rgba(224,200,80,0.85)' },
            { label: 'CREDITS EARNED',  value: `+${creditsEarned}`,        color: 'rgba(224,140,60,0.85)' },
          ].map(({ label, value, color }, i) => (
            <div key={label} style={{ display: 'flex' }}>
              {i > 0 && <div style={{ width: 1, background: 'rgba(138,80,80,0.2)' }} />}
              <div style={{ padding: '20px 36px', textAlign: 'center', background: 'rgba(20,6,6,0.6)' }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.3em', marginBottom: 10, color: 'rgba(138,80,80,0.6)', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 5vw, 40px)', color, letterSpacing: '0.05em' }}>{value}</div>
                {label === 'CREDITS EARNED' && (
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(138,80,80,0.5)', marginTop: 6, letterSpacing: '0.2em' }}>GESAMT: {credits}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }}>
          {isPlaytesting ? (
            <ActionBtn label="← EDITOR" primary onClick={() => { playClick(); setPlaytesting(false); setPhase('editor') }} />
          ) : gameMode === 'skydive' ? (
            <>
              <ActionBtn label="NOCHMAL" primary onClick={() => { playClick(); setGameMode('skydive'); setPhase('skydive') }} />
              <ActionBtn label="MENÜ" onClick={() => { playClick(); setPhase('title_screen') }} />
            </>
          ) : (
            <>
              {!skipShop && <ActionBtn label="AUSRÜSTUNG" primary onClick={() => { playClick(); setPhase('shop') }} />}
              <ActionBtn label={skipShop ? 'NOCHMAL' : 'WIEDERHOLEN'} primary={skipShop} onClick={() => { playClick(); setPhase(skipShop ? 'briefing' : 'playing') }} />
              <ActionBtn label="MENÜ" onClick={() => { playClick(); setPhase('title_screen') }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ label, onClick, primary = false }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => { playHover(); (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = primary ? '0.9' : '0.7' }}
      style={{
        background: primary ? 'rgba(180,40,40,0.12)' : 'transparent',
        border: `1px solid ${primary ? 'rgba(180,40,40,0.6)' : 'rgba(138,80,80,0.25)'}`,
        cursor: 'pointer', padding: '12px 28px',
        fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.3em',
        color: primary ? 'rgba(200,80,80,0.95)' : 'rgba(138,80,80,0.6)',
        textTransform: 'uppercase', transition: 'opacity 0.15s',
        opacity: primary ? 0.9 : 0.7,
      }}
    >{label}</button>
  )
}
