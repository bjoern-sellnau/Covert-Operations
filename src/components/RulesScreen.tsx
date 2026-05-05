import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useRulesStore, CREDIT_OPTIONS, WEAPON_LIMIT_OPTIONS } from '../store/rulesStore'
import { useLoadoutStore } from '../game/loadoutStore'
import { playClick, playHover } from '../game/uiSounds'

export function RulesScreen() {
  const setPhase       = useGameStore((s) => s.setPhase)
  const { startCredits, maxWeapons, setStartCredits, setMaxWeapons, resetRules } = useRulesStore()
  const resetForGame   = useLoadoutStore((s) => s.resetForGame)
  const [copyMsg, setCopyMsg] = useState<string | null>(null)

  type RulesExport = { startCredits: number; maxWeapons: number }

  async function handleExport() {
    playClick()
    const data: RulesExport = { startCredits, maxWeapons }
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopyMsg('KOPIERT ✓')
    } catch {
      setCopyMsg('FEHLER')
    }
    setTimeout(() => setCopyMsg(null), 2000)
  }

  async function handleImport() {
    playClick()
    try {
      const text = await navigator.clipboard.readText()
      const data = JSON.parse(text) as RulesExport
      if (typeof data.startCredits === 'number') setStartCredits(data.startCredits)
      if (typeof data.maxWeapons === 'number')   setMaxWeapons(data.maxWeapons)
      setCopyMsg('IMPORTIERT ✓')
    } catch {
      setCopyMsg('FEHLER — KEIN GÜLTIGES JSON')
    }
    setTimeout(() => setCopyMsg(null), 2500)
  }

  function confirmAndContinue() {
    playClick()
    resetForGame(startCredits)
    setPhase('shop')
  }

  const tog = (active: boolean): React.CSSProperties => ({
    background:  active ? 'rgba(224,84,24,0.16)' : 'rgba(10,12,7,0.85)',
    border:      `2px solid ${active ? '#e05418' : 'rgba(138,154,98,0.18)'}`,
    color:       active ? '#e05418' : 'rgba(200,196,176,0.55)',
    boxShadow:   active ? '0 0 12px rgba(224,84,24,0.35)' : 'none',
    fontFamily:  "'Share Tech Mono', monospace",
    fontSize:    11, letterSpacing: '0.2em', padding: '9px 18px',
    cursor:      'pointer', textTransform: 'uppercase', transition: 'all 0.12s',
    borderRadius: 2,
  })

  const sectionLabel: React.CSSProperties = {
    fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
    fontSize: 11, letterSpacing: '0.3em', color: '#e05418',
    textTransform: 'uppercase', marginBottom: 10,
  }

  const card: React.CSSProperties = {
    background: 'rgba(10,12,7,0.85)',
    border: '1px solid rgba(138,154,98,0.14)',
    borderRadius: 2, padding: '20px 22px',
    display: 'flex', flexDirection: 'column', gap: 12,
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      animation: 'menuFadeIn 0.35s cubic-bezier(0.2,0.8,0.3,1) both',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      fontFamily: "'DM Sans', sans-serif", userSelect: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(138,154,98,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(138,154,98,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(224,84,24,0.8), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Corner brackets */}
      {(['top', 'bottom'] as const).flatMap((v) =>
        (['left', 'right'] as const).map((h) => (
          <div key={v + h} style={{
            position: 'absolute', [v]: 20, [h]: 24, width: 28, height: 28,
            [`border${v.charAt(0).toUpperCase() + v.slice(1)}`]: '1.5px solid #8a9a62',
            [`border${h.charAt(0).toUpperCase() + h.slice(1)}`]: '1.5px solid #8a9a62',
            opacity: 0.5, pointerEvents: 'none',
          }} />
        ))
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
          fontSize: 13, letterSpacing: '0.3em', color: '#e05418', marginBottom: 8,
        }}>Δ COVERT OPERATIONS</div>
        <div style={{
          fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900,
          fontSize: 'clamp(28px, 5vw, 44px)', letterSpacing: '0.18em',
          color: 'rgba(224,220,200,0.9)', textShadow: '0 0 40px rgba(224,84,24,0.15)',
        }}>REGELN</div>
        <div style={{ width: 300, height: 1, background: 'rgba(224,84,24,0.5)', margin: '12px auto 0' }} />
      </div>

      {/* Rules cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 12,
        width: 'min(96vw, 740px)',
        marginBottom: 24,
      }}>

        {/* Starting credits */}
        <div style={card}>
          <div style={sectionLabel}>Startguthaben</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CREDIT_OPTIONS.map((v) => (
              <button key={v} style={tog(startCredits === v)}
                onClick={() => { playClick(); setStartCredits(v) }}
                onMouseEnter={() => playHover()}
              >{v === 0 ? 'KEIN' : `${v} ¢`}</button>
            ))}
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9, letterSpacing: '0.15em', color: 'rgba(106,112,72,0.5)',
          }}>
            {startCredits === 0 ? 'Spieler startet ohne Startguthaben.' : `Spieler startet mit ${startCredits} Credits.`}
          </div>
        </div>

        {/* Max weapons */}
        <div style={card}>
          <div style={sectionLabel}>Waffen-Limit</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {WEAPON_LIMIT_OPTIONS.map((v) => (
              <button key={v} style={tog(maxWeapons === v)}
                onClick={() => { playClick(); setMaxWeapons(v) }}
                onMouseEnter={() => playHover()}
              >{v === 99 ? '∞' : String(v)}</button>
            ))}
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9, letterSpacing: '0.15em', color: 'rgba(106,112,72,0.5)',
          }}>
            {maxWeapons === 99
              ? 'Keine Begrenzung — alle Waffen kaufbar.'
              : `Maximal ${maxWeapons} Waffe${maxWeapons > 1 ? 'n' : ''} (ohne Startwaffen).`}
          </div>
        </div>

        {/* Import / Export */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <div style={sectionLabel}>Import / Export</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              style={tog(false)}
              onClick={handleExport}
              onMouseEnter={() => playHover()}
            >JSON KOPIEREN</button>
            <button
              style={tog(false)}
              onClick={handleImport}
              onMouseEnter={() => playHover()}
            >JSON EINFÜGEN</button>
            <button
              style={{ ...tog(false), marginLeft: 'auto', color: 'rgba(106,112,72,0.45)', borderColor: 'rgba(106,112,72,0.15)' }}
              onClick={() => { playClick(); resetRules() }}
              onMouseEnter={() => playHover()}
            >STANDARD</button>
            {copyMsg && (
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 9, letterSpacing: '0.2em',
                color: copyMsg.startsWith('FEHLER') ? '#ff4444' : '#44ff88',
              }}>{copyMsg}</span>
            )}
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9, letterSpacing: '0.15em', color: 'rgba(106,112,72,0.4)',
            lineHeight: 1.5,
          }}>
            Regeln als JSON in die Zwischenablage kopieren oder von dort einfügen.
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', gap: 10, width: 'min(96vw, 740px)',
        paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
      }}>
        <button
          onClick={() => { playClick(); setPhase('mutators') }}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.3em',
            color: 'rgba(106,112,72,0.6)', textTransform: 'uppercase', transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { playHover(); e.currentTarget.style.color = 'rgba(224,84,24,0.8)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(106,112,72,0.6)' }}
        >← ZURÜCK</button>
        <button
          onClick={confirmAndContinue}
          style={{
            flex: 1, background: 'rgba(224,84,24,0.08)', border: '1px solid rgba(224,84,24,0.5)',
            color: '#e05418', fontSize: 11, letterSpacing: '0.3em', padding: '13px', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { playHover(); e.currentTarget.style.background = 'rgba(224,84,24,0.18)'; e.currentTarget.style.color = '#f4f0e4' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(224,84,24,0.08)'; e.currentTarget.style.color = '#e05418' }}
        >SHOP →</button>
      </div>
    </div>
  )
}
