import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from '../game/loadoutStore'

export function GameOver() {
  const setPhase       = useGameStore((s) => s.setPhase)
  const setPlaytesting = useGameStore((s) => s.setPlaytesting)
  const setGameMode    = useGameStore((s) => s.setGameMode)
  const score          = useGameStore((s) => s.score)
  const wave           = useGameStore((s) => s.wave)
  const creditsEarned  = useGameStore((s) => s.creditsEarned)
  const isPlaytesting  = useGameStore((s) => s.isPlaytesting)
  const gameMode       = useGameStore((s) => s.gameMode)
  const { credits }    = useLoadoutStore()

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1a0000 0%, #000000 70%)',
      fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      <div style={{
        color: '#ff2200', fontSize: 72, fontWeight: 'bold', letterSpacing: 6,
        textShadow: '0 0 20px #ff2200, 0 0 60px #aa0000', marginBottom: 12,
      }}>
        MISSION
      </div>
      <div style={{
        color: '#ff2200', fontSize: 36, letterSpacing: 12,
        textShadow: '0 0 12px #ff4400', marginBottom: 48,
      }}>
        GESCHEITERT
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 48, border: '1px solid #221111', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '20px 36px', textAlign: 'center', background: '#0a0505' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 8, color: '#554444' }}>WAVE</div>
          <div style={{ fontSize: 42, fontWeight: 'bold', color: '#00aaff', textShadow: '0 0 12px #00aaff' }}>{wave}</div>
        </div>

        <div style={{ width: 1, background: '#221111' }} />

        <div style={{ padding: '20px 36px', textAlign: 'center', background: '#0a0505' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 8, color: '#554444' }}>PUNKTE</div>
          <div style={{ fontSize: 42, fontWeight: 'bold', color: '#ffee00', textShadow: '0 0 12px #ffcc00' }}>
            {score.toString().padStart(6, '0')}
          </div>
        </div>

        <div style={{ width: 1, background: '#221111' }} />

        {/* Credits earned */}
        <div style={{ padding: '20px 36px', textAlign: 'center', background: '#0a0805' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 8, color: '#554433' }}>CREDITS VERDIENT</div>
          <div style={{ fontSize: 42, fontWeight: 'bold', color: '#ffaa00', textShadow: '0 0 12px #ff8800' }}>
            +{creditsEarned}
          </div>
          <div style={{ color: '#554433', fontSize: 11, marginTop: 4 }}>
            Gesamt: {credits}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 16 }}>
        {isPlaytesting ? (
          <button
            onClick={() => { setPlaytesting(false); setPhase('editor') }}
            style={{
              background: '#00ff8822', border: '2px solid #00ff88', color: '#00ff88',
              fontSize: 14, letterSpacing: 4, padding: '14px 32px', cursor: 'pointer',
              fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.15s',
              boxShadow: '0 0 14px #00ff8844',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#00ff8844'; e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#00ff8822'; e.currentTarget.style.color = '#00ff88' }}
          >
            Zurück zum Editor
          </button>
        ) : gameMode === 'skydive' ? (
          <>
            <button
              onClick={() => { setGameMode('skydive'); setPhase('skydive') }}
              style={{
                background: '#ff880022', border: '2px solid #ff8800', color: '#ff8800',
                fontSize: 14, letterSpacing: 4, padding: '14px 32px', cursor: 'pointer',
                fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.15s',
                boxShadow: '0 0 14px #ff880044',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ff880044'; e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ff880022'; e.currentTarget.style.color = '#ff8800' }}
            >
              Nochmal
            </button>
            <button
              onClick={() => setPhase('menu')}
              style={{
                background: 'transparent', border: '1px solid #332222', color: '#443333',
                fontSize: 14, letterSpacing: 4, padding: '14px 32px', cursor: 'pointer',
                fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#776666'; e.currentTarget.style.borderColor = '#554444' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#443333'; e.currentTarget.style.borderColor = '#332222' }}
            >
              Menü
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setPhase('shop')}
              style={{
                background: '#00aaff22', border: '2px solid #00aaff', color: '#00aaff',
                fontSize: 14, letterSpacing: 4, padding: '14px 32px', cursor: 'pointer',
                fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.15s',
                boxShadow: '0 0 14px #00aaff44',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#00aaff44'; e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#00aaff22'; e.currentTarget.style.color = '#00aaff' }}
            >
              Ausrüstung
            </button>

            <button
              onClick={() => setPhase('playing')}
              style={{
                background: 'transparent', border: '2px solid #445566', color: '#667788',
                fontSize: 14, letterSpacing: 4, padding: '14px 32px', cursor: 'pointer',
                fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#22334422'; e.currentTarget.style.color = '#aabbcc' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#667788' }}
            >
              Wiederholen
            </button>

            <button
              onClick={() => setPhase('menu')}
              style={{
                background: 'transparent', border: '1px solid #332222', color: '#443333',
                fontSize: 14, letterSpacing: 4, padding: '14px 32px', cursor: 'pointer',
                fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#776666'; e.currentTarget.style.borderColor = '#554444' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#443333'; e.currentTarget.style.borderColor = '#332222' }}
            >
              Menü
            </button>
          </>
        )}
      </div>
    </div>
  )
}
