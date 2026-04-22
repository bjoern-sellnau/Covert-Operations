import { useGameStore } from '../store/gameStore'
import { PLAYER_MAX_HEALTH } from '../game/types'

export function HUD() {
  const health = useGameStore((s) => s.health)
  const score = useGameStore((s) => s.score)
  const wave = useGameStore((s) => s.wave)
  const waveMessage = useGameStore((s) => s.waveMessage)

  const hpPct = Math.max(0, health / PLAYER_MAX_HEALTH) * 100
  const hpColor = hpPct > 50 ? '#00ff88' : hpPct > 25 ? '#ffaa00' : '#ff3300'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: "'Courier New', monospace",
        userSelect: 'none',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
          <div style={{ color: '#aaaacc', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
            Health
          </div>
          <div
            style={{
              height: 14,
              background: '#111122',
              border: '1px solid #334',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${hpPct}%`,
                background: hpColor,
                transition: 'width 0.1s, background 0.3s',
                boxShadow: `0 0 8px ${hpColor}`,
              }}
            />
          </div>
          <div style={{ color: hpColor, fontSize: 13, fontWeight: 'bold', letterSpacing: 1 }}>
            {health} / {PLAYER_MAX_HEALTH}
          </div>
        </div>

        {/* Wave */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#aaaacc', fontSize: 11, letterSpacing: 2 }}>WAVE</div>
          <div
            style={{
              color: '#00aaff',
              fontSize: 32,
              fontWeight: 'bold',
              lineHeight: 1,
              textShadow: '0 0 12px #00aaff',
            }}
          >
            {wave}
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'right', minWidth: 180 }}>
          <div style={{ color: '#aaaacc', fontSize: 11, letterSpacing: 2 }}>SCORE</div>
          <div
            style={{
              color: '#ffee00',
              fontSize: 24,
              fontWeight: 'bold',
              textShadow: '0 0 10px #ffcc00',
            }}
          >
            {score.toString().padStart(6, '0')}
          </div>
        </div>
      </div>

      {/* Wave announcement */}
      {waveMessage && (
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#00aaff',
            fontSize: 48,
            fontWeight: 'bold',
            letterSpacing: 6,
            textTransform: 'uppercase',
            textShadow: '0 0 20px #00aaff, 0 0 40px #0066ff',
            animation: 'fadeInOut 2s ease-in-out',
          }}
        >
          {waveMessage}
        </div>
      )}

      {/* Controls hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#445566',
          fontSize: 11,
          letterSpacing: 1,
          textAlign: 'center',
        }}
      >
        WASD — Move &nbsp;|&nbsp; Mouse — Aim &nbsp;|&nbsp; LMB / Space — Shoot
      </div>
    </div>
  )
}
