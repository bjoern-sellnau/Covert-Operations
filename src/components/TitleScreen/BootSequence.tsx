const LINES: { text: string; color?: string; fontWeight?: number }[] = [
  { text: '> SYSTEM BOOT // CO-Δ KERNEL v0.1.0' },
  { text: '> LOADING CRYPTO MODULES.....OK' },
  { text: '> SYNCING SECURE CHANNEL........OK' },
  { text: '> AUTHENTICATING OPERATOR ID' },
  { text: '> BIOMETRIC SCAN........VERIFIED',              color: '#e05418' },
  { text: '> CLEARANCE LEVEL........TS//SCI',              color: '#e05418' },
  { text: '> ACCESS GRANTED — INITIALIZING TACTICAL DISPLAY', color: '#e0dcc8', fontWeight: 600 },
]
const DELAYS = [0.2, 0.7, 1.2, 1.7, 2.2, 2.7, 3.2]

export function BootSequence() {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0,
        background: '#000',
        zIndex: 50,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 13,
        color: '#8aaa30',
        padding: '60px 80px',
        letterSpacing: '0.05em',
        lineHeight: 1.9,
        animation: 'tsBootFade 0.5s 3.6s forwards',
        pointerEvents: 'none',
      }}>
        {LINES.map((line, i) => (
          <div key={i} style={{
            opacity: 0,
            animation: `tsBootType 0.3s ${DELAYS[i]}s forwards`,
            color: line.color,
            fontWeight: line.fontWeight,
          }}>
            {line.text}
          </div>
        ))}
      </div>

      {/* green scanline sweeps 2× */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(138,170,48,0.6), transparent)',
        zIndex: 51,
        pointerEvents: 'none',
        animation: 'tsScanLine 1.5s linear 0s 2',
      }} />
    </>
  )
}
