import { useSkydiveHUD } from '../skydive/skydiveHudStore'

export function SkydiveHUD() {
  const { altitude, health, parachuteZone, parachuteDeployed } = useSkydiveHUD()

  const altPct = Math.min(1, altitude / 3000)
  const hPct   = Math.max(0, health / 100)

  const altColor = altPct > 0.3 ? '#00aaff' : altPct > 0.15 ? '#ffaa00' : '#ff3300'

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      {/* ── Altitude meter (left) ── */}
      <div style={{
        position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <div style={{ color: '#445566', fontSize: 9, letterSpacing: 2 }}>ALT</div>
        <div style={{
          width: 10, height: 200,
          background: '#060e1a', border: '1px solid #1a2a3a', borderRadius: 6,
          overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div style={{
            width: '100%', height: `${altPct * 100}%`,
            background: altColor, transition: 'height 0.12s, background 0.35s',
            borderRadius: 6,
          }} />
        </div>
        <div style={{
          color: parachuteZone ? '#ff4400' : altColor,
          fontSize: 11, fontWeight: 'bold',
          textShadow: parachuteZone ? '0 0 10px #ff2200' : `0 0 6px ${altColor}`,
          transition: 'color 0.3s',
        }}>
          {altitude}m
        </div>
      </div>

      {/* ── Health bar (top center) ── */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 200,
      }}>
        <div style={{ color: '#334455', fontSize: 9, letterSpacing: 2, marginBottom: 5, textAlign: 'center' }}>
          HEALTH
        </div>
        <div style={{ width: '100%', height: 5, background: '#060e1a', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${hPct * 100}%`, height: '100%', borderRadius: 3,
            background: hPct > 0.5 ? '#00cc44' : hPct > 0.25 ? '#ffaa00' : '#ff3300',
            transition: 'width 0.15s, background 0.3s',
          }} />
        </div>
      </div>

      {/* ── Parachute zone warning ── */}
      {parachuteZone && !parachuteDeployed && (
        <div style={{
          position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', animation: 'btPulse 0.55s ease-in-out infinite alternate',
        }}>
          <div style={{
            color: '#ff3300', fontSize: 30, fontWeight: 'bold', letterSpacing: 5,
            textShadow: '0 0 24px #ff1100, 0 0 60px #aa0000',
          }}>
            FALLSCHIRM
          </div>
          <div style={{
            color: '#ffaa00', fontSize: 20, letterSpacing: 8, marginTop: 6,
            textShadow: '0 0 14px #ff8800',
          }}>
            ZIEHEN [F]
          </div>
        </div>
      )}

      {/* ── Chute deployed confirmation ── */}
      {parachuteDeployed && (
        <div style={{
          position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)',
          color: '#00ff88', fontSize: 12, letterSpacing: 4,
          textShadow: '0 0 8px #00cc44',
        }}>
          ▼ FALLSCHIRM AKTIV
        </div>
      )}

      {/* ── Controls hint (bottom right) ── */}
      <div style={{
        position: 'absolute', bottom: 16, right: 20,
        color: '#1e2e3e', fontSize: 10, letterSpacing: 1, textAlign: 'right', lineHeight: 1.9,
      }}>
        A/D AUSWEICHEN · SHIFT STURZFLUG · LMT SCHIESSEN · F FALLSCHIRM
      </div>
    </div>
  )
}
