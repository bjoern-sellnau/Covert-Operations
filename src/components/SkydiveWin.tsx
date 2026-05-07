import type { CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from '../game/loadoutStore'
import { getSkydiveResult } from '../skydive/skydiveResultStore'
import { WEAPON_CONFIGS } from '../game/types'

export function SkydiveWin() {
  const setPhase       = useGameStore((s) => s.setPhase)
  const setGameMode    = useGameStore((s) => s.setGameMode)
  const setOfflinePath = useGameStore((s) => s.setOfflinePath)
  const unlockWeapon   = useLoadoutStore((s) => s.unlockWeapon)
  const result         = getSkydiveResult()

  function playArena() {
    result.weapons.forEach(w => unlockWeapon(w))
    setGameMode('arena')
    setOfflinePath(true)
    setPhase('map_select')
  }

  const survived = result.survived

  const btn = (color: string, outline = false): CSSProperties => ({
    background:  outline ? 'transparent' : `${color}18`,
    border:      `${outline ? 1 : 2}px solid ${color}`,
    color, fontSize: 13, letterSpacing: 4, padding: '13px 28px',
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s',
  })

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.98) 0%, rgba(8,9,6,1) 65%)',
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      userSelect: 'none', padding: '0 24px',
    }}>
      <div style={{ color: '#3a4a2a', fontSize: 11, letterSpacing: 8, marginBottom: 10 }}>
        SKYDIVE 2.0
      </div>

      <div style={{
        color: survived ? '#e05418' : '#cc2200',
        fontSize: 52, fontWeight: 700, letterSpacing: 4, marginBottom: 6,
        textShadow: survived ? '0 0 28px #e0541855' : '0 0 28px #cc220055',
      }}>
        {survived ? 'GELANDET' : 'GEFALLEN'}
      </div>

      <div style={{ color: '#1e2c12', fontSize: 10, letterSpacing: 5, marginBottom: 40 }}>
        {survived ? '— INFILTRATION ABGESCHLOSSEN —' : '— MISSION GESCHEITERT —'}
      </div>

      {/* Stats */}
      <div style={{ width: '100%', maxWidth: 340, marginBottom: 28 }}>
        {([
          ['ABSCHÜSSE',    String(result.kills)],
          ['GESUNDHEIT',   survived ? `${result.healthRemaining}%` : '—'],
          ['SCHWIERIGKEIT', result.difficulty === 'hard' ? 'SCHWER' : 'LEICHT'],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 40,
            borderBottom: '1px solid #161e10', padding: '8px 0' }}>
            <span style={{ color: '#3a4a2a', fontSize: 11, letterSpacing: 4 }}>{label}</span>
            <span style={{ color: '#8a9a62', fontSize: 11, letterSpacing: 3 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Collected weapons */}
      {result.weapons.length > 0 && (
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ color: '#3a4a2a', fontSize: 10, letterSpacing: 6, marginBottom: 14 }}>
            AUSRÜSTUNG
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {result.weapons.map(w => (
              <div key={w} style={{
                padding: '8px 14px',
                background: 'rgba(224,84,24,0.1)', border: '1px solid #e05418',
                color: '#e05418', fontSize: 12, letterSpacing: 3,
              }}>
                {WEAPON_CONFIGS[w]?.shortName ?? w.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        {survived && (
          <button
            style={btn('#e05418')}
            onClick={playArena}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,84,24,0.3)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(224,84,24,0.18)'; e.currentTarget.style.color = '#e05418' }}
          >
            Spielen
          </button>
        )}
        <button
          style={btn('#8a9a62')}
          onClick={() => { setGameMode('skydive'); setPhase('skydive') }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(138,154,98,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(138,154,98,0.08)' }}
        >
          Nochmal
        </button>
        <button
          style={btn('#2a3a1a', true)}
          onClick={() => setPhase('title_screen')}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a5a32'; e.currentTarget.style.color = '#4a5a32' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3a1a'; e.currentTarget.style.color = '#2a3a1a' }}
        >
          Menü
        </button>
      </div>
    </div>
  )
}
