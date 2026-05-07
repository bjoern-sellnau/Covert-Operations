import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useRulesStore, CREDIT_OPTIONS, WEAPON_LIMIT_OPTIONS } from '../store/rulesStore'
import { useLoadoutStore } from '../game/loadoutStore'
import { useMutatorsStore } from '../store/mutatorsStore'
import { usePickupProfileStore, DEFAULT_WEIGHTS } from '../store/pickupProfileStore'
import type { PickupWeights } from '../store/pickupProfileStore'
import { playClick, playHover } from '../game/uiSounds'

// ── Pickup kind / chaos labels ───────────────────────────────────────────────

const KIND_LABELS: { key: keyof PickupWeights; label: string }[] = [
  { key: 'ammo',        label: 'Munition'    },
  { key: 'weapon',      label: 'Waffe'       },
  { key: 'health',      label: 'Health'      },
  { key: 'credits',     label: 'Credits'     },
  { key: 'armor',       label: 'Rüstung'     },
  { key: 'focus',       label: 'Focus'       },
  { key: 'quad_damage', label: 'Quad Damage' },
  { key: 'berserker',   label: 'Berserker'   },
  { key: 'bad_package', label: 'Blindgänger' },
]

const CHAOS_LABELS: { key: keyof PickupWeights; label: string; color: string }[] = [
  { key: 'chaos_normal',    label: 'Normal',   color: '#aa44ff' },
  { key: 'chaos_explosive', label: 'Explosiv', color: '#ff2200' },
  { key: 'chaos_jammed',    label: 'Defekt',   color: '#ffaa00' },
]

// ── Sub-components ───────────────────────────────────────────────────────────

function WeightRow({
  label, value, total, color,
  onChange,
}: { label: string; value: number; total: number; color?: string; onChange: (v: number) => void }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 28 }}>
      <div style={{
        width: 88, fontFamily: "'Share Tech Mono', monospace",
        fontSize: 9, letterSpacing: '0.1em', color: color ?? 'rgba(200,196,176,0.7)',
        flexShrink: 0,
      }}>{label}</div>
      <input
        type="number" min={0} max={999} value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(999, Number(e.target.value) || 0)))}
        style={{
          width: 48, background: 'rgba(10,12,7,0.9)',
          border: '1px solid rgba(138,154,98,0.2)', color: '#e05418',
          fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
          padding: '3px 6px', textAlign: 'right', borderRadius: 2,
          outline: 'none',
        }}
      />
      <div style={{ flex: 1, height: 4, background: 'rgba(138,154,98,0.1)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color ?? '#e05418', transition: 'width 0.15s', opacity: 0.8 }} />
      </div>
      <div style={{
        width: 30, textAlign: 'right', fontFamily: "'Share Tech Mono', monospace",
        fontSize: 8, color: 'rgba(106,112,72,0.5)', flexShrink: 0,
      }}>{pct}%</div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function RulesScreen() {
  const setPhase        = useGameStore((s) => s.setPhase)
  const { startCredits, maxWeapons, setStartCredits, setMaxWeapons, resetRules } = useRulesStore()
  const resetForGame    = useLoadoutStore((s) => s.resetForGame)
  const autoReload      = useMutatorsStore((s) => s.autoReload)
  const setAutoReload   = useMutatorsStore((s) => s.setAutoReload)

  const {
    profiles, activeProfileId,
    createProfile, updateWeights, renameProfile, deleteProfile,
    setActiveProfile, importProfile,
  } = usePickupProfileStore()

  const [copyMsg,     setCopyMsg]     = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string | null>(null) // profile id being renamed

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null
  const weights       = activeProfile?.weights ?? DEFAULT_WEIGHTS

  // total for percentage bars
  const regularTotal = KIND_LABELS.reduce((s, { key }) => s + (weights[key] as number), 0)
  const chaosTotal   = CHAOS_LABELS.reduce((s, { key }) => s + (weights[key] as number), 0)

  // ── Rules export / import ──────────────────────────────────────────────
  type RulesExport = { startCredits: number; maxWeapons: number }

  async function handleExport() {
    playClick()
    const data: RulesExport = { startCredits, maxWeapons }
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopyMsg('KOPIERT ✓')
    } catch { setCopyMsg('FEHLER') }
    setTimeout(() => setCopyMsg(null), 2000)
  }

  async function handleImport() {
    playClick()
    try {
      const text = await navigator.clipboard.readText()
      const data = JSON.parse(text) as RulesExport
      if (typeof data.startCredits === 'number') setStartCredits(data.startCredits)
      if (typeof data.maxWeapons   === 'number') setMaxWeapons(data.maxWeapons)
      setCopyMsg('IMPORTIERT ✓')
    } catch { setCopyMsg('FEHLER — KEIN GÜLTIGES JSON') }
    setTimeout(() => setCopyMsg(null), 2500)
  }

  // ── Profile import / export ────────────────────────────────────────────
  function exportProfile() {
    if (!activeProfile) return
    const blob = new Blob([JSON.stringify(activeProfile, null, 2)], { type: 'application/json' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `${activeProfile.name.replace(/[^a-z0-9]/gi, '_')}.profile.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function handleProfileImport() {
    const input   = document.createElement('input')
    input.type    = 'file'
    input.accept  = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const p = JSON.parse(ev.target?.result as string)
          if (!p.weights) { alert('Ungültiges Profil'); return }
          const id = importProfile(p)
          setActiveProfile(id)
        } catch { alert('Fehler beim Laden') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  function setWeight(key: keyof PickupWeights, value: number) {
    if (!activeProfileId) return
    updateWeights(activeProfileId, { [key]: value })
  }

  function confirmAndContinue() {
    playClick()
    resetForGame(startCredits)
    setPhase('shop')
  }

  // ── Styles ─────────────────────────────────────────────────────────────
  const tog = (active: boolean): React.CSSProperties => ({
    background:   active ? 'rgba(224,84,24,0.16)' : 'rgba(10,12,7,0.85)',
    border:       `2px solid ${active ? '#e05418' : 'rgba(138,154,98,0.18)'}`,
    color:        active ? '#e05418' : 'rgba(200,196,176,0.55)',
    boxShadow:    active ? '0 0 12px rgba(224,84,24,0.35)' : 'none',
    fontFamily:   "'Share Tech Mono', monospace",
    fontSize:     11, letterSpacing: '0.2em', padding: '9px 18px',
    cursor:       'pointer', textTransform: 'uppercase', transition: 'all 0.12s',
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

  const smBtn = (active = false, danger = false): React.CSSProperties => ({
    padding: '5px 10px',
    background: active ? 'rgba(224,84,24,0.12)' : 'transparent',
    border: `1px solid ${danger ? 'rgba(255,80,60,0.35)' : active ? '#e05418' : 'rgba(138,154,98,0.2)'}`,
    color: danger ? 'rgba(255,80,60,0.65)' : active ? '#e05418' : 'rgba(138,154,98,0.5)',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9, letterSpacing: '0.2em', cursor: 'pointer',
    textTransform: 'uppercase', transition: 'all 0.12s', borderRadius: 2,
  })

  return (
    <div style={{
      position: 'absolute', inset: 0,
      animation: 'menuFadeIn 0.35s cubic-bezier(0.2,0.8,0.3,1) both',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      fontFamily: "'DM Sans', sans-serif", userSelect: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflowY: 'auto',
      paddingTop: 'max(20px, calc(env(safe-area-inset-top, 0px) + 20px))',
      paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 20px))',
    }}>
      {/* Decorations */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(224,84,24,0.8), transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(138,154,98,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(138,154,98,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
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

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 12,
        width: 'min(96vw, 740px)',
        marginBottom: 20,
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
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(106,112,72,0.5)' }}>
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
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(106,112,72,0.5)' }}>
            {maxWeapons === 99 ? 'Keine Begrenzung — alle Waffen kaufbar.' : `Maximal ${maxWeapons} Waffe${maxWeapons > 1 ? 'n' : ''} (ohne Startwaffen).`}
          </div>
        </div>

        {/* Auto Reload */}
        <div style={card}>
          <div style={sectionLabel}>Auto-Nachladen</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={tog(!autoReload)} onClick={() => { playClick(); setAutoReload(false) }} onMouseEnter={() => playHover()}>AUS</button>
            <button style={tog(autoReload)}  onClick={() => { playClick(); setAutoReload(true)  }} onMouseEnter={() => playHover()}>AN</button>
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(106,112,72,0.5)' }}>
            {autoReload ? 'Automatisch nachladen wenn Magazin leer.' : 'Manuell nachladen (R-Taste / linker Stick).'}
          </div>
        </div>

        {/* Pickup profile — header / list */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <div style={sectionLabel}>Kisten-Gewichtung</div>

          {/* Profile list */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* "Standard" (no profile) */}
            <button
              style={tog(activeProfileId === null)}
              onClick={() => { playClick(); setActiveProfile(null) }}
              onMouseEnter={() => playHover()}
            >STANDARD</button>

            {profiles.map((p) => (
              editingName === p.id ? (
                <input
                  key={p.id}
                  autoFocus
                  defaultValue={p.name}
                  onBlur={(e)  => { renameProfile(p.id, e.target.value || p.name); setEditingName(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                  style={{
                    padding: '7px 10px', background: 'rgba(224,84,24,0.1)',
                    border: '2px solid #e05418', color: '#e05418',
                    fontFamily: "'Share Tech Mono', monospace", fontSize: 11,
                    borderRadius: 2, outline: 'none', width: 120,
                  }}
                />
              ) : (
                <button
                  key={p.id}
                  style={tog(activeProfileId === p.id)}
                  onClick={() => { playClick(); setActiveProfile(p.id) }}
                  onDoubleClick={() => setEditingName(p.id)}
                  onMouseEnter={() => playHover()}
                >{p.name}</button>
              )
            ))}

            {/* Action buttons */}
            <button style={smBtn()} onClick={() => {
              playClick()
              const id = createProfile(`Profil ${profiles.length + 1}`)
              setActiveProfile(id)
            }}>+ NEU</button>

            {activeProfile && <>
              <button style={smBtn()} onClick={() => { playClick(); exportProfile() }}>⬇ EXPORT</button>
              <button style={smBtn(false, true)} onClick={() => { playClick(); deleteProfile(activeProfileId!) }}>✕</button>
            </>}
            <button style={smBtn()} onClick={() => { playClick(); handleProfileImport() }}>⬆ IMPORT</button>
          </div>

          {/* Weight editor */}
          {activeProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {/* Regular kinds */}
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.25em', color: 'rgba(138,154,98,0.5)', marginBottom: 2 }}>
                REGULÄRE KISTEN
              </div>
              {KIND_LABELS.map(({ key, label }) => (
                <WeightRow
                  key={key}
                  label={label}
                  value={weights[key] as number}
                  total={regularTotal}
                  onChange={(v) => setWeight(key, v)}
                />
              ))}

              {/* Chaos modifiers */}
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.25em', color: 'rgba(138,154,98,0.5)', marginTop: 8, marginBottom: 2 }}>
                CHAOS-MODIFIKATOREN
              </div>
              {CHAOS_LABELS.map(({ key, label, color }) => (
                <WeightRow
                  key={key}
                  label={label}
                  value={weights[key] as number}
                  total={chaosTotal}
                  color={color}
                  onChange={(v) => setWeight(key, v)}
                />
              ))}

              {/* Reset weights */}
              <button
                style={{ ...smBtn(), alignSelf: 'flex-start', marginTop: 4 }}
                onClick={() => { playClick(); updateWeights(activeProfileId!, DEFAULT_WEIGHTS) }}
                onMouseEnter={() => playHover()}
              >STANDARD-GEWICHTE</button>
            </div>
          ) : (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(106,112,72,0.4)', lineHeight: 1.6 }}>
              Standard-Gewichte werden verwendet (40% Munition, 30% Waffe, 15% Health, 10% Credits, 5% Blindgänger).
              <br />Erstelle ein Profil um eigene Werte zu setzen.
            </div>
          )}
        </div>

        {/* Import / Export rules */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <div style={sectionLabel}>Regeln Import / Export</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button style={tog(false)} onClick={handleExport} onMouseEnter={() => playHover()}>JSON KOPIEREN</button>
            <button style={tog(false)} onClick={handleImport} onMouseEnter={() => playHover()}>JSON EINFÜGEN</button>
            <button
              style={{ ...tog(false), marginLeft: 'auto', color: 'rgba(106,112,72,0.45)', borderColor: 'rgba(106,112,72,0.15)' }}
              onClick={() => { playClick(); resetRules() }}
              onMouseEnter={() => playHover()}
            >STANDARD</button>
            {copyMsg && (
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.2em', color: copyMsg.startsWith('FEHLER') ? '#ff4444' : '#44ff88' }}>
                {copyMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, width: 'min(96vw, 740px)' }}>
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
