import { useGameStore } from '../store/gameStore'

export function MissionsMenu() {
  const setPhase    = useGameStore((s) => s.setPhase)
  const setGameMode = useGameStore((s) => s.setGameMode)

  const card = (
    color: string,
    title: string,
    sub: string,
    desc: string,
    onClick: () => void,
  ) => (
    <div
      onClick={onClick}
      style={{
        background: `${color}0a`,
        border: `1px solid ${color}55`,
        borderRadius: 6,
        padding: '20px 22px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = `${color}20`; (e.currentTarget as HTMLDivElement).style.borderColor = color }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = `${color}0a`; (e.currentTarget as HTMLDivElement).style.borderColor = `${color}55` }}
    >
      <div style={{ color, fontSize: 18, fontWeight: 'bold', letterSpacing: 3, textShadow: `0 0 10px ${color}88` }}>{title}</div>
      <div style={{ color: `${color}99`, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>{sub}</div>
      <div style={{ color: '#445566', fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>{desc}</div>
    </div>
  )

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #111840 0%, #060614 70%)',
      fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      <div style={{ color: '#00aaff', fontSize: 26, fontWeight: 'bold', letterSpacing: 6, marginBottom: 6, textShadow: '0 0 14px #00aaff88' }}>
        AUSGEWÄHLTE MISSIONEN
      </div>
      <div style={{ color: '#223344', fontSize: 10, letterSpacing: 4, marginBottom: 36 }}>
        COVERT OPERATIONS
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 'min(92vw, 440px)' }}>
        {card(
          '#ff8800',
          '↓ SKYDIVE INFILTRATION',
          'Fallschirm · Spezialop',
          'Springe aus 8.000m. Deploye den Fallschirm rechtzeitig und lande präzise auf der Zielzone.',
          () => { setGameMode('skydive'); setPhase('briefing') },
        )}

        {card(
          '#00ff88',
          '⊕ SCHIEßSTAND',
          'Training · Unbegrenzte Munition',
          'Teste deine Waffen im gesicherten Trainingsbereich. Keine Lebenspunkte-Strafe — unbegrenzte Munition.',
          () => { setGameMode('shooting_range'); setPhase('briefing') },
        )}

        <button
          style={{
            background: 'transparent', border: '1px solid #1a2a35', color: '#445566',
            fontSize: 12, letterSpacing: 4, padding: '11px', cursor: 'pointer',
            fontFamily: "'Courier New', monospace", textTransform: 'uppercase', transition: 'all 0.12s',
            marginTop: 8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#aabbcc'; e.currentTarget.style.borderColor = '#334455' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#445566'; e.currentTarget.style.borderColor = '#1a2a35' }}
          onClick={() => setPhase('menu')}
        >
          ← Zurück
        </button>
      </div>
    </div>
  )
}
