import { useGameStore } from '../store/gameStore'
import { useMutatorsStore } from '../store/mutatorsStore'
import type { PickupMode, EnemyDrop, BtChargeMode, CrateExtra } from '../store/mutatorsStore'
import type { EnemyType } from '../game/types'

export function MutatorsScreen() {
  const setPhase = useGameStore((s) => s.setPhase)
  const gameMode = useGameStore((s) => s.gameMode)
  const {
    gameType, roundTimeSec, weaponPickups, enemyDrops,
    suddenDeath, suddenDeathSec, lives, chaosMode,
    bulletBounce, bulletBounceCount,
    btChargeModes, btDuration, btVisualEffect,
    godMode, crateExtras, quadDamageDuration, berserkerDuration,
    botCount, botEnemyTypes, killMultipliers,
    balletDuration, balletBulletCount, balletSpeed,
    gunKataEnabled, gunKataDuration, gunKataTargets, gunKataSpeed,
    setGameType, setRoundTimeSec, setWeaponPickups, toggleEnemyDrop,
    setSuddenDeath, setSuddenDeathSec, setLives, setChaosMode,
    setBulletBounce, setBulletBounceCount,
    toggleBtChargeMode, setBtDuration, setBtVisualEffect,
    setGodMode, toggleCrateExtra, setQuadDamageDuration, setBerserkerDuration,
    setBotCount, toggleBotEnemyType, setKillMultipliers,
    setBalletDuration, setBalletBulletCount, setBalletSpeed,
    setGunKataEnabled, setGunKataDuration, setGunKataTargets, setGunKataSpeed,
  } = useMutatorsStore()

  function startGame() {
    setPhase(gameMode === 'skydive' ? 'skydive' : 'playing')
  }

  const card: React.CSSProperties = {
    background: 'rgba(5,2,8,0.92)',
    border: '1px solid rgba(160,15,0,0.4)',
    borderRadius: 3,
    padding: '16px 18px',
    display: 'flex', flexDirection: 'column', gap: 10,
  }

  const secLabel: React.CSSProperties = {
    color: '#bb2200', fontSize: 9, letterSpacing: 5,
    textTransform: 'uppercase', marginBottom: 2,
    textShadow: '0 0 10px #aa110066',
  }

  function tog(active: boolean, color = '#cc2200'): React.CSSProperties {
    return {
      background:  active ? `${color}28` : 'transparent',
      border:      `1px solid ${active ? color : '#2a1215'}`,
      color:       active ? color : '#445566',
      fontSize:    10, letterSpacing: 3, padding: '6px 13px',
      cursor:      'pointer', fontFamily: "'Courier New', monospace",
      textTransform: 'uppercase', transition: 'all 0.12s',
      boxShadow:   active ? `0 0 8px ${color}44` : 'none',
    }
  }

  function Toggle({ on, color, label, sub, onClick }: {
    on: boolean; color: string; label: string; sub?: string; onClick: () => void
  }) {
    return (
      <div onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        padding: '11px 14px',
        background: on ? `${color}18` : 'rgba(8,4,12,0.7)',
        border: `1px solid ${on ? color : '#2a1215'}`,
        borderRadius: 3, transition: 'all 0.15s',
      }}>
        <div style={{
          width: 40, height: 22, borderRadius: 11,
          background: on ? color : '#2a1215',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute', top: 3, left: on ? 19 : 3,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s',
          }} />
        </div>
        <div>
          <div style={{ color: on ? color : '#445566', fontSize: 11, fontWeight: 'bold', letterSpacing: 2 }}>
            {label} {on ? 'EIN' : 'AUS'}
          </div>
          {sub && <div style={{ color: '#3a2030', fontSize: 9, marginTop: 2, letterSpacing: 1 }}>{sub}</div>}
        </div>
      </div>
    )
  }

  const timeOptions    = [60, 90, 120, 180, 300, 600]
  const sdTimeOptions  = [30, 45, 60, 90, 120, 180]
  const fmtTime = (s: number) => s < 60 ? `${s}S` : `${s / 60}:00`

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, #1e0010 0%, #080810 55%, #050508 100%)',
      fontFamily: "'Courier New', monospace", userSelect: 'none', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
        <div style={{
          color: '#bb1a00', fontSize: 24, fontWeight: 'bold', letterSpacing: 10,
          textShadow: '0 0 18px #aa000088, 0 0 50px #660000',
        }}>
          MUTATOREN
        </div>
        <div style={{ color: '#2a1010', fontSize: 9, letterSpacing: 5, marginTop: 4 }}>
          EINSTELLUNGEN VOR DEM EINSATZ
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: 10,
        width: 'min(96vw, 780px)',
      }}>

        {/* Spielmodus */}
        <div style={card}>
          <div style={secLabel}>Spielmodus</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([
              ['waves',         'WAVES',          '#cc2200'],
              ['roundtime',     'RUNDENZEIT',      '#ff6600'],
              ['instakill',     'INSTAKILL',       '#ff0044'],
              ['instakill_wave','INSTAKILL WELLE', '#cc0044'],
              ['hardline_solo', 'HARDLINE SOLO',   '#ffcc00'],
              ['hardline',      'HARDLINE',        '#ffaa00'],
              ['deathmatch',    'DEATHMATCH',      '#cc44ff'],
            ] as [string, string, string][]).map(([val, label, color]) => (
              <button key={val} style={tog(gameType === val, color)} onClick={() => setGameType(val as never)}>
                {label}
              </button>
            ))}
          </div>
          {gameType === 'roundtime' && (
            <>
              <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2 }}>RUNDENDAUER</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {timeOptions.map((t) => (
                  <button key={t} style={tog(roundTimeSec === t, '#ff6600')} onClick={() => setRoundTimeSec(t)}>
                    {fmtTime(t)}
                  </button>
                ))}
              </div>
            </>
          )}
          <div style={{ color: '#2a1a1a', fontSize: 9, letterSpacing: 1, lineHeight: 1.7 }}>
            {gameType === 'waves'         && 'Endlose Wellen — überlebe so lange wie möglich.'}
            {gameType === 'roundtime'     && 'Rundenzeit läuft ab — dann Sudden Death oder Ende.'}
            {gameType === 'instakill'     && 'Ein Schuss, ein Kill. Bots spawnen sofort nach. Kein Shop.'}
            {gameType === 'instakill_wave'&& 'Instakill + klassische Wellen. Kein Shop.'}
            {gameType === 'hardline_solo' && 'Starte mit Messer. Jeder Kill = nächste Waffe. Nur Spieler. Kein Shop.'}
            {gameType === 'hardline'      && 'Starte mit Messer. Jeder Kill = nächste Waffe. Spieler & Bots. Kein Shop.'}
            {gameType === 'deathmatch'    && 'Bots spawnen sofort nach. Unbegrenzt. Kein Shop.'}
          </div>
        </div>

        {/* Bot-Konfiguration (nur Bot-Modi) */}
        {['instakill', 'deathmatch', 'hardline_solo', 'hardline'].includes(gameType) && (
          <div style={card}>
            <div style={secLabel}>Bot-Konfiguration</div>
            <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2 }}>ANZAHL BOTS</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[2, 4, 6, 8, 10, 16].map((v) => (
                <button key={v} style={tog(botCount === v, '#cc44ff')} onClick={() => setBotCount(v)}>
                  {v}
                </button>
              ))}
            </div>
            <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2, marginTop: 6 }}>BOT-TYPEN</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                ['basic',      'BASIS',      '#cc2222'],
                ['fast',       'SCHNELL',    '#cc6600'],
                ['tank',       'TANK',       '#6600cc'],
                ['berserker',  'BERSERKER',  '#cc0066'],
                ['flanker',    'FLANKER',    '#cc8800'],
                ['juggernaut', 'JUGGERNAUT', '#334455'],
              ] as [EnemyType, string, string][]).map(([val, label, color]) => (
                <button key={val} style={tog(botEnemyTypes.includes(val), color)} onClick={() => toggleBotEnemyType(val)}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ color: '#2a1a2a', fontSize: 9, letterSpacing: 1 }}>
              {botEnemyTypes.length === 0 ? 'Kein Typ → BASIS wird verwendet.' : `Aktiv: ${botEnemyTypes.join(', ')}`}
            </div>
          </div>
        )}

        {/* Waffen-Pickups */}
        <div style={card}>
          <div style={secLabel}>Waffen-Pickups</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([
              ['none',    'NEIN',     '#334455'],
              ['ammo',    'MUNITION', '#00aaff'],
              ['weapons', 'WAFFEN',   '#ff6600'],
              ['both',    'BEIDES',   '#44ff88'],
              ['chaos',   'CHAOS',    '#cc00ff'],
            ] as [PickupMode, string, string][]).map(([val, label, color]) => (
              <button key={val} style={tog(weaponPickups === val, color)} onClick={() => setWeaponPickups(val)}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ color: '#2a1a2a', fontSize: 9, letterSpacing: 1, lineHeight: 1.7 }}>
            {weaponPickups === 'none'    && 'Keine Pickups auf der Map.'}
            {weaponPickups === 'ammo'    && 'Munitionskisten spawnen zufällig.'}
            {weaponPickups === 'weapons' && 'Waffenkisten spawnen zufällig.'}
            {weaponPickups === 'both'    && 'Munition und Waffen spawnen zufällig.'}
            {weaponPickups === 'chaos'   && 'Pakete können Bomben (Blindgänger möglich) enthalten.'}
          </div>
        </div>

        {/* Gegner Drops */}
        <div style={card}>
          <div style={secLabel}>Gegner hinterlassen</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([
              ['credits', 'GELD',       '#ffee00'],
              ['ammo',    'MUNITION',   '#00aaff'],
              ['weapons', 'WAFFEN',     '#ff6600'],
              ['health',  'GESUNDHEIT', '#00ff88'],
              ['armor',   'RÜSTUNG',   '#4488ff'],
              ['focus',   'FOCUS',      '#00ffcc'],
            ] as [EnemyDrop, string, string][]).map(([val, label, color]) => (
              <button key={val} style={tog(enemyDrops.includes(val), color)} onClick={() => toggleEnemyDrop(val)}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ color: '#2a1a1a', fontSize: 9, letterSpacing: 1 }}>
            {enemyDrops.length === 0 ? 'Gegner lassen nichts fallen.' : `Aktiv: ${enemyDrops.join(', ')}`}
          </div>
        </div>

        {/* Bullet Ricochet */}
        <div style={card}>
          <div style={secLabel}>Patronen-Abpraller</div>
          <Toggle
            on={bulletBounce} color="#00aaff"
            label="ABPRALLER"
            sub="Patronen prallen von Wänden ab"
            onClick={() => setBulletBounce(!bulletBounce)}
          />
          {bulletBounce && (
            <>
              <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2 }}>MAX. ABPRALLER</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[1, 2, 3, 5, 0].map((v) => (
                  <button key={v} style={tog(bulletBounceCount === v, '#00aaff')} onClick={() => setBulletBounceCount(v)}>
                    {v === 0 ? '∞' : `${v}×`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bullet Time */}
        <div style={card}>
          <div style={secLabel}>Bullet Time</div>
          <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>AUFLADEN DURCH</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([
              ['time',   'ZEIT',       '#00ccff'],
              ['kills',  'ABSCHÜSSE',  '#ff6600'],
              ['start',  'VOLLSTART',  '#00ff88'],
              ['crate',  'KISTEN',     '#ffcc00'],
              ['enemy',  'GEGNER',     '#cc44ff'],
            ] as [BtChargeMode, string, string][]).map(([val, label, color]) => (
              <button key={val} style={tog(btChargeModes.includes(val), color)} onClick={() => toggleBtChargeMode(val)}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2, marginTop: 6 }}>DAUER (SEK.)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[2, 3, 4, 6, 10, 20].map((v) => (
              <button key={v} style={tog(btDuration === v, '#00ccff')} onClick={() => setBtDuration(v)}>
                {v}s
              </button>
            ))}
          </div>
          <Toggle
            on={btVisualEffect} color="#00aaff"
            label="VISUELLER EFFEKT"
            sub="Farbfilter und Scanlines bei Bullet Time"
            onClick={() => setBtVisualEffect(!btVisualEffect)}
          />
        </div>

        {/* God Mode */}
        <div style={card}>
          <div style={secLabel}>Spieler-Schutz</div>
          <Toggle
            on={godMode} color="#ffee00"
            label="GOD MODE"
            sub="Spieler nimmt keinerlei Schaden"
            onClick={() => setGodMode(!godMode)}
          />
        </div>

        {/* Kill Multipliers */}
        <div style={card}>
          <div style={secLabel}>Kill-Multiplikatoren</div>
          <Toggle
            on={killMultipliers} color="#ff6600"
            label="MULTIPLIKATOREN"
            sub="Double Kill · Multi Kill · Killing Spree · Godlike …"
            onClick={() => setKillMultipliers(!killMultipliers)}
          />
        </div>

        {/* Bullet Ballet */}
        <div style={card}>
          <div style={secLabel}>Bullet Ballet (Q/E · Akimbo)</div>
          <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2 }}>DAUER (SEK.)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[0.8, 1.0, 1.4, 2.0, 3.0].map((v) => (
              <button key={v} style={tog(balletDuration === v, '#cc44ff')} onClick={() => setBalletDuration(v)}>{v}s</button>
            ))}
          </div>
          <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2, marginTop: 6 }}>KUGELN PRO TICK</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 6].map((v) => (
              <button key={v} style={tog(balletBulletCount === v, '#cc44ff')} onClick={() => setBalletBulletCount(v)}>{v}×</button>
            ))}
          </div>
          <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2, marginTop: 6 }}>GESCHWINDIGKEIT</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([0.5, 0.75, 1.0, 1.5, 2.0] as const).map((v) => (
              <button key={v} style={tog(balletSpeed === v, '#cc44ff')} onClick={() => setBalletSpeed(v)}>{v}×</button>
            ))}
          </div>
        </div>

        {/* Gun Kata */}
        <div style={card}>
          <div style={secLabel}>Gun Kata (G-Taste)</div>
          <Toggle
            on={gunKataEnabled} color="#ff4488"
            label="GUN KATA"
            sub="Equilibrium-Stil: Auto-Ziel auf Feinde in Slowmo · G-Taste"
            onClick={() => setGunKataEnabled(!gunKataEnabled)}
          />
          {gunKataEnabled && (
            <>
              <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2, marginTop: 6 }}>DAUER (SEK.)</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[1.0, 1.5, 2.0, 3.0].map((v) => (
                  <button key={v} style={tog(gunKataDuration === v, '#ff4488')} onClick={() => setGunKataDuration(v)}>{v}s</button>
                ))}
              </div>
              <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2, marginTop: 6 }}>MAX. ZIELE</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[2, 3, 4, 6, 8].map((v) => (
                  <button key={v} style={tog(gunKataTargets === v, '#ff4488')} onClick={() => setGunKataTargets(v)}>{v}</button>
                ))}
              </div>
              <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2, marginTop: 6 }}>KUGELGESCHWINDIGKEIT</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {([0.75, 1.0, 1.5, 2.0] as const).map((v) => (
                  <button key={v} style={tog(gunKataSpeed === v, '#ff4488')} onClick={() => setGunKataSpeed(v)}>{v}×</button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Crate extras */}
        <div style={card}>
          <div style={secLabel}>Extras in Waffenkisten</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([
              ['health',      'HEALTH',       '#00ff88'],
              ['armor',       'RÜSTUNG',      '#4488ff'],
              ['focus',       'FOCUS',        '#00ffcc'],
              ['quad_damage', 'QUAD DAMAGE',  '#ffcc00'],
              ['berserker',   'BERSERKER',    '#ff6600'],
            ] as [CrateExtra, string, string][]).map(([val, label, color]) => (
              <button key={val} style={tog(crateExtras.includes(val), color)} onClick={() => toggleCrateExtra(val)}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ color: '#2a1a1a', fontSize: 9, letterSpacing: 1 }}>
            {crateExtras.length === 0 ? 'Keine Extras in Kisten.' : `20% Chance auf: ${crateExtras.join(', ')}`}
          </div>
        </div>

        {/* Power-up durations */}
        {(crateExtras.includes('quad_damage') || crateExtras.includes('berserker')) && (
          <div style={card}>
            <div style={secLabel}>Power-Up Dauer</div>
            {crateExtras.includes('quad_damage') && (
              <>
                <div style={{ color: '#ffcc00', fontSize: 9, letterSpacing: 2 }}>★ QUAD DAMAGE (SEK.)</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[30, 60, 90, 120, 180].map((v) => (
                    <button key={v} style={tog(quadDamageDuration === v, '#ffcc00')} onClick={() => setQuadDamageDuration(v)}>
                      {v}s
                    </button>
                  ))}
                </div>
              </>
            )}
            {crateExtras.includes('berserker') && (
              <>
                <div style={{ color: '#ff6600', fontSize: 9, letterSpacing: 2, marginTop: 6 }}>⚡ BERSERKER (SEK.)</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[15, 30, 60, 90, 120].map((v) => (
                    <button key={v} style={tog(berserkerDuration === v, '#ff6600')} onClick={() => setBerserkerDuration(v)}>
                      {v}s
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Chaos Modus */}
        <div style={card}>
          <div style={secLabel}>Chaos Modus</div>
          <Toggle
            on={chaosMode} color="#cc00ff"
            label="CHAOS"
            sub="Kisten fallen vom Himmel · Nur Chaos-Waffen nutzbar"
            onClick={() => setChaosMode(!chaosMode)}
          />
          {chaosMode && (
            <div style={{ color: '#4a2055', fontSize: 9, letterSpacing: 1, lineHeight: 1.7 }}>
              ★ Normal &nbsp;·&nbsp; ⚠ Ladehemmung (15% Chance) &nbsp;·&nbsp; 💥 Explodiert nach letztem Schuss
            </div>
          )}
        </div>

        {/* Leben — nur Rundenzeit */}
        {gameType === 'roundtime' && (
          <div style={card}>
            <div style={secLabel}>Leben pro Spieler / Bot</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[1, 2, 3, 5, 0].map((v) => (
                <button key={v} style={tog(lives === v, '#ff6600')} onClick={() => setLives(v)}>
                  {v === 0 ? '∞' : `${v}♥`}
                </button>
              ))}
            </div>
            <div style={{ color: '#2a1a1a', fontSize: 9, letterSpacing: 1 }}>
              {lives === 0
                ? 'Unbegrenzte Respawns — kein Ausscheiden.'
                : `Respawn solange Leben übrig. ${lives} Leben je Spieler.`}
            </div>
          </div>
        )}

        {/* Sudden Death — nur Rundenzeit */}
        {gameType === 'roundtime' && (
          <div style={card}>
            <div style={secLabel}>Sudden Death (Bomberman)</div>
            <Toggle
              on={suddenDeath} color="#cc2200"
              label="BOMBERMAN"
              sub="Blöcke fallen von außen nach innen — Spielfeld schrumpft"
              onClick={() => setSuddenDeath(!suddenDeath)}
            />
            {suddenDeath && (
              <>
                <div style={{ color: '#556677', fontSize: 9, letterSpacing: 2 }}>SD-DAUER</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {sdTimeOptions.map((t) => (
                    <button key={t} style={tog(suddenDeathSec === t, '#cc2200')} onClick={() => setSuddenDeathSec(t)}>
                      {fmtTime(t)}
                    </button>
                  ))}
                </div>
                <div style={{ color: '#3a1a1a', fontSize: 9, letterSpacing: 1, lineHeight: 1.7 }}>
                  Gefahrenzone tötet kontinuierlich · Überlebe bis die Zeit abläuft
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex', gap: 10, width: 'min(96vw, 780px)', padding: '16px 0 10px',
      }}>
        <button
          onClick={() => setPhase('briefing')}
          style={{
            background: 'transparent', border: '1px solid #2a1215', color: '#445566',
            fontSize: 10, letterSpacing: 3, padding: '11px 18px', cursor: 'pointer',
            fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.12s',
          }}
        >← Zurück</button>
        <button
          onClick={startGame}
          style={{
            flex: 1, background: 'rgba(170,15,0,0.25)', border: '2px solid #bb1500',
            color: '#cc1a00', fontSize: 13, letterSpacing: 5, padding: '14px', cursor: 'pointer',
            fontFamily: 'inherit', textTransform: 'uppercase', fontWeight: 'bold',
            boxShadow: '0 0 22px #aa000055', transition: 'all 0.12s',
          }}
        >⚡ EINSATZ STARTEN</button>
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}
