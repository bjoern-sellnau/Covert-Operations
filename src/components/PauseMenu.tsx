import { useGameStore } from '../store/gameStore'

export function PauseMenu() {
  const setPaused  = useGameStore((s) => s.setPaused)
  const setPhase   = useGameStore((s) => s.setPhase)

  const btn: React.CSSProperties = {
    background: 'rgba(20,5,5,0.9)',
    border: '1px solid rgba(200,50,0,0.5)',
    color: '#e05418',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 13,
    letterSpacing: 4,
    textTransform: 'uppercase',
    padding: '14px 40px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    transition: 'all 0.12s',
  }

  function resume() { setPaused(false) }

  function quit() {
    setPaused(false)
    setPhase('title_screen')
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)',
      zIndex: 200,
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
        background: 'rgba(8,4,4,0.96)',
        border: '1px solid rgba(200,50,0,0.35)',
        padding: '40px 48px',
        minWidth: 280,
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 11, letterSpacing: 6, color: '#bb3300',
          textTransform: 'uppercase', marginBottom: 16,
        }}>
          PAUSE
        </div>

        <button
          style={btn}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,50,0,0.2)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(20,5,5,0.9)'; e.currentTarget.style.color = '#e05418' }}
          onClick={resume}
        >
          Weiterspielen
        </button>

        <button
          style={{ ...btn, color: '#887766', borderColor: 'rgba(120,80,60,0.4)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(120,60,30,0.2)'; e.currentTarget.style.color = '#cca080' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(20,5,5,0.9)'; e.currentTarget.style.color = '#887766' }}
          onClick={quit}
        >
          Hauptmenü
        </button>
      </div>
    </div>
  )
}
