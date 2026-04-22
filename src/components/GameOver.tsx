import { useGameStore } from '../store/gameStore'

export function GameOver() {
  const setPhase = useGameStore((s) => s.setPhase)
  const score = useGameStore((s) => s.score)
  const wave = useGameStore((s) => s.wave)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #1a0000 0%, #000000 70%)',
        fontFamily: "'Courier New', monospace",
        userSelect: 'none',
      }}
    >
      <div
        style={{
          color: '#ff2200',
          fontSize: 72,
          fontWeight: 'bold',
          letterSpacing: 6,
          textTransform: 'uppercase',
          textShadow: '0 0 20px #ff2200, 0 0 60px #aa0000',
          marginBottom: 12,
        }}
      >
        MISSION
      </div>
      <div
        style={{
          color: '#ff2200',
          fontSize: 36,
          letterSpacing: 12,
          textTransform: 'uppercase',
          textShadow: '0 0 12px #ff4400',
          marginBottom: 50,
        }}
      >
        FAILED
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: 60,
          marginBottom: 60,
          color: '#aaaacc',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, marginBottom: 8, color: '#667788' }}>
            WAVE REACHED
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#00aaff',
              textShadow: '0 0 12px #00aaff',
            }}
          >
            {wave}
          </div>
        </div>

        <div style={{ width: 1, background: '#223344' }} />

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, marginBottom: 8, color: '#667788' }}>
            FINAL SCORE
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#ffee00',
              textShadow: '0 0 12px #ffcc00',
            }}
          >
            {score.toString().padStart(6, '0')}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 20 }}>
        <button
          onClick={() => setPhase('playing')}
          style={{
            background: 'transparent',
            border: '2px solid #00aaff',
            color: '#00aaff',
            fontSize: 16,
            letterSpacing: 4,
            textTransform: 'uppercase',
            padding: '14px 36px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00aaff22'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#00aaff'
          }}
        >
          Retry
        </button>

        <button
          onClick={() => setPhase('menu')}
          style={{
            background: 'transparent',
            border: '2px solid #445566',
            color: '#667788',
            fontSize: 16,
            letterSpacing: 4,
            textTransform: 'uppercase',
            padding: '14px 36px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#22334422'
            e.currentTarget.style.color = '#aabbcc'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#667788'
          }}
        >
          Main Menu
        </button>
      </div>
    </div>
  )
}
