import { useGameStore } from '../store/gameStore'
import { PLAYER_MAX_HEALTH, FOCUS_MAX } from '../game/types'

export function HUD() {
  const health = useGameStore((s) => s.health)
  const score = useGameStore((s) => s.score)
  const wave = useGameStore((s) => s.wave)
  const waveMessage = useGameStore((s) => s.waveMessage)
  const focus = useGameStore((s) => s.focus)
  const isBulletTime = useGameStore((s) => s.isBulletTime)

  const hpPct = Math.max(0, health / PLAYER_MAX_HEALTH) * 100
  const hpColor = hpPct > 50 ? '#00ff88' : hpPct > 25 ? '#ffaa00' : '#ff3300'
  const focusPct = (focus / FOCUS_MAX) * 100
  const focusColor = focusPct > 50 ? '#00ccff' : focusPct > 20 ? '#6688ff' : '#334488'

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
        {/* Left column: Health + Focus */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
          {/* Health bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ color: '#aaaacc', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
              Health
            </div>
            <div
              style={{
                height: 12,
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
            <div style={{ color: hpColor, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>
              {health} / {PLAYER_MAX_HEALTH}
            </div>
          </div>

          {/* Focus bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: isBulletTime ? '#00ccff' : '#aaaacc',
                fontSize: 10,
                letterSpacing: 2,
                textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}
            >
              Focus
              {isBulletTime && (
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: 3,
                    color: '#00ccff',
                    textShadow: '0 0 8px #00ccff',
                    animation: 'btPulse 0.6s ease-in-out infinite alternate',
                  }}
                >
                  ● ACTIVE
                </span>
              )}
            </div>
            <div
              style={{
                height: 12,
                background: '#080814',
                border: `1px solid ${isBulletTime ? '#224466' : '#1a2030'}`,
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${focusPct}%`,
                  background: isBulletTime
                    ? 'linear-gradient(90deg, #0066cc, #00ccff)'
                    : focusColor,
                  transition: 'background 0.3s',
                  boxShadow: isBulletTime ? '0 0 10px #00aaff' : `0 0 4px ${focusColor}`,
                }}
              />
            </div>
            <div style={{ color: isBulletTime ? '#00ccff' : '#445566', fontSize: 10, letterSpacing: 1 }}>
              {Math.round(focus)} / {FOCUS_MAX} &nbsp;—&nbsp; Hold Shift
            </div>
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
        <div style={{ textAlign: 'right', minWidth: 200 }}>
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
          whiteSpace: 'nowrap',
        }}
      >
        WASD — Move &nbsp;|&nbsp; Mouse — Aim &nbsp;|&nbsp; LMB / Space — Shoot &nbsp;|&nbsp; Shift — Bullet Time
      </div>
    </div>
  )
}
