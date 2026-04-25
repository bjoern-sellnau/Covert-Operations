import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from '../game/loadoutStore'
import {
  WEAPON_CONFIGS, EQUIPMENT_CONFIGS, AMMO_CONFIGS, AKIMBO_PRICE, VERNICHTER_AMMO_PRICE,
  type WeaponId, type EquipmentId, type AmmoId,
} from '../game/types'

type Category = 'waffen' | 'ausruestung' | 'munition' | 'ladung'

// ── Stat bars ───────────────────────────────────────────────────────────────

function StatBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 16,
            height: 6,
            borderRadius: 1,
            background: i < value ? color : '#1a1a2e',
            boxShadow: i < value ? `0 0 4px ${color}` : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ── Weapon card ──────────────────────────────────────────────────────────────

function WeaponCard({ id }: { id: WeaponId }) {
  const cfg = WEAPON_CONFIGS[id]
  const { ownedWeapons, selectedWeapon, credits, buyWeapon, selectWeapon } = useLoadoutStore()
  const owned = ownedWeapons.includes(id)
  const selected = selectedWeapon === id
  const canAfford = credits >= cfg.price

  const handleClick = () => {
    if (owned) selectWeapon(id)
    else buyWeapon(id)
  }

  return (
    <div
      style={{
        background: selected ? '#0a1a2e' : '#080812',
        border: `1px solid ${selected ? '#00aaff' : owned ? '#223344' : '#111122'}`,
        borderRadius: 4,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: selected ? '0 0 12px #00aaff33, inset 0 0 20px #00aaff11' : 'none',
      }}
      onClick={handleClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: selected ? '#00ccff' : '#cceeff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
            {cfg.name}
          </div>
          <div style={{ color: '#445566', fontSize: 11, marginTop: 2 }}>{cfg.shortName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {owned ? (
            <div style={{
              color: selected ? '#00ffaa' : '#336655',
              fontSize: 11,
              letterSpacing: 2,
              padding: '3px 8px',
              border: `1px solid ${selected ? '#00ffaa' : '#223344'}`,
              borderRadius: 2,
            }}>
              {selected ? 'AKTIV' : 'BESESSEN'}
            </div>
          ) : (
            <div style={{ color: canAfford ? '#ffee00' : '#664400', fontSize: 13, fontWeight: 'bold' }}>
              {cfg.price} CR
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: '#445566', fontSize: 10, width: 60, letterSpacing: 1 }}>SCHADEN</div>
          <StatBar value={cfg.statDamage} color="#ff4444" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: '#445566', fontSize: 10, width: 60, letterSpacing: 1 }}>FEUER</div>
          <StatBar value={cfg.statRate} color="#ffaa00" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: '#445566', fontSize: 10, width: 60, letterSpacing: 1 }}>REICHW.</div>
          <StatBar value={cfg.statRange} color="#00aaff" />
        </div>
      </div>

      <div style={{ color: '#445566', fontSize: 11, lineHeight: 1.4 }}>{cfg.description}</div>

      <div style={{ display: 'flex', gap: 16, marginTop: 8, color: '#334455', fontSize: 10 }}>
        <span>MUNITION: {cfg.baseAmmo}</span>
        {cfg.pellets > 1 && <span>PELLETS: {cfg.pellets}</span>}
      </div>

      {!owned && !canAfford && (
        <div style={{ color: '#442200', fontSize: 10, marginTop: 6, letterSpacing: 1 }}>
          NICHT GENUG CREDITS
        </div>
      )}
    </div>
  )
}

// ── Equipment card ───────────────────────────────────────────────────────────

function EquipmentCard({ id }: { id: EquipmentId }) {
  const cfg = EQUIPMENT_CONFIGS[id]
  const { ownedEquipment, credits, buyEquipment } = useLoadoutStore()
  const owned = ownedEquipment.includes(id)
  const canAfford = credits >= cfg.price
  const slotLabel = { back: 'RÜCKEN', chest: 'BRUST', legs: 'BEINE' }[cfg.slot]

  return (
    <div
      style={{
        background: owned ? '#0a1a0e' : '#080812',
        border: `1px solid ${owned ? '#226633' : '#111122'}`,
        borderRadius: 4,
        padding: '14px 16px',
        cursor: owned ? 'default' : 'pointer',
        transition: 'border-color 0.15s',
        boxShadow: owned ? '0 0 10px #00ff4433' : 'none',
      }}
      onClick={() => !owned && buyEquipment(id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ color: owned ? '#00ff88' : '#cceeff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
            {cfg.name}
          </div>
          <div style={{ color: '#445566', fontSize: 10, marginTop: 2, letterSpacing: 2 }}>{slotLabel}</div>
        </div>
        {owned ? (
          <div style={{ color: '#00ff88', fontSize: 11, letterSpacing: 2, padding: '3px 8px', border: '1px solid #226633', borderRadius: 2 }}>
            EQUIPPED
          </div>
        ) : (
          <div style={{ color: canAfford ? '#ffee00' : '#664400', fontSize: 13, fontWeight: 'bold' }}>
            {cfg.price} CR
          </div>
        )}
      </div>

      <div style={{ color: '#00ff88', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>
        +{Math.round(cfg.ammoMultBonus * 100)}% Kapazität
      </div>
      <div style={{ color: '#445566', fontSize: 11, lineHeight: 1.4 }}>{cfg.description}</div>

      {!owned && !canAfford && (
        <div style={{ color: '#442200', fontSize: 10, marginTop: 6, letterSpacing: 1 }}>
          NICHT GENUG CREDITS
        </div>
      )}
    </div>
  )
}

// ── Ammo card ────────────────────────────────────────────────────────────────

function AmmoCard({ id }: { id: AmmoId }) {
  const cfg = AMMO_CONFIGS[id]
  const { ownedAmmo, selectedAmmo, credits, buyAmmo, selectAmmo } = useLoadoutStore()
  const owned = ownedAmmo.includes(id)
  const selected = selectedAmmo === id
  const canAfford = credits >= cfg.price

  const handleClick = () => {
    if (owned) selectAmmo(id)
    else buyAmmo(id)
  }

  return (
    <div
      style={{
        background: selected ? '#0a0f1a' : '#080812',
        border: `1px solid ${selected ? cfg.color : owned ? '#223344' : '#111122'}`,
        borderRadius: 4,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        boxShadow: selected ? `0 0 12px ${cfg.color}44` : 'none',
      }}
      onClick={handleClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
            <div style={{ color: selected ? cfg.color : '#cceeff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
              {cfg.name}
            </div>
          </div>
          <div style={{ color: '#445566', fontSize: 10, marginTop: 2, letterSpacing: 2 }}>{cfg.shortName}</div>
        </div>
        {id === 'standard' || owned ? (
          <div style={{
            color: selected ? cfg.color : '#334455',
            fontSize: 11, letterSpacing: 2, padding: '3px 8px',
            border: `1px solid ${selected ? cfg.color : '#223344'}`, borderRadius: 2,
          }}>
            {selected ? 'GELADEN' : 'BESESSEN'}
          </div>
        ) : (
          <div style={{ color: canAfford ? '#ffee00' : '#664400', fontSize: 13, fontWeight: 'bold' }}>
            {cfg.price} CR
          </div>
        )}
      </div>

      {cfg.damageBonus > 0 && (
        <div style={{ color: cfg.color, fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>
          +{cfg.damageBonus} Schaden pro Schuss
        </div>
      )}
      <div style={{ color: '#445566', fontSize: 11, lineHeight: 1.4 }}>{cfg.description}</div>
    </div>
  )
}

// ── Character loadout panel ──────────────────────────────────────────────────

function CharacterPanel() {
  const { selectedWeapon, ownedEquipment, selectedAmmo, getMaxAmmo } = useLoadoutStore()
  const weaponCfg = WEAPON_CONFIGS[selectedWeapon]
  const ammoCfg = AMMO_CONFIGS[selectedAmmo]
  const maxAmmo = getMaxAmmo()
  const hasBackpack = ownedEquipment.includes('backpack')
  const hasChest = ownedEquipment.includes('chest_pouch')
  const hasLegs = ownedEquipment.includes('leg_pouch')

  const slotStyle = (equipped: boolean, color = '#00ff88'): React.CSSProperties => ({
    padding: '8px 10px',
    border: `1px solid ${equipped ? color : '#1a1a2e'}`,
    borderRadius: 3,
    background: equipped ? `${color}11` : '#08080f',
    color: equipped ? color : '#334455',
    fontSize: 11,
    letterSpacing: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ color: '#445566', fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>LADUNG</div>

      {/* Body silhouette */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {/* Head */}
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#0a1a2e', border: '1px solid #00aaff44' }} />
          {/* Torso */}
          <div style={{
            width: 52, height: 44, background: '#0a1a2e', border: '1px solid #00aaff44',
            borderRadius: 3, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {hasChest && <div style={{ width: 20, height: 20, borderRadius: 2, background: '#00ff8833', border: '1px solid #00ff88' }} />}
            {/* Backpack badge */}
            {hasBackpack && (
              <div style={{
                position: 'absolute', right: -18, top: 4,
                width: 14, height: 22, background: '#00ff8822', border: '1px solid #00ff88', borderRadius: 2,
              }} />
            )}
          </div>
          {/* Arms */}
          <div style={{ display: 'flex', gap: 4, marginTop: -4 }}>
            <div style={{ width: 14, height: 32, background: '#0a1a2e', border: '1px solid #00aaff33', borderRadius: 2, marginTop: 0 }} />
            <div style={{ width: 14, height: 32, background: '#0a1a2e', border: '1px solid #00aaff33', borderRadius: 2 }} />
          </div>
          {/* Legs */}
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{
              width: 22, height: 36, background: '#0a1a2e', border: `1px solid ${hasLegs ? '#00ff88' : '#00aaff33'}`, borderRadius: 2,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4,
            }}>
              {hasLegs && <div style={{ width: 14, height: 14, background: '#00ff8833', border: '1px solid #00ff8866', borderRadius: 1 }} />}
            </div>
            <div style={{ width: 22, height: 36, background: '#0a1a2e', border: '1px solid #00aaff33', borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Slot list */}
      <div style={slotStyle(true, '#00aaff')}>
        <span style={{ color: '#445566' }}>WAFFE</span>
        <span>{weaponCfg.shortName} — {weaponCfg.name.split(' ')[0]}</span>
      </div>

      <div style={slotStyle(hasChest)}>
        <span style={{ color: '#445566', minWidth: 36 }}>BRUST</span>
        <span>{hasChest ? 'Brusttasche' : 'Leer'}</span>
      </div>

      <div style={slotStyle(hasBackpack)}>
        <span style={{ color: '#445566', minWidth: 36 }}>RÜCKEN</span>
        <span>{hasBackpack ? 'Taktikrucksack' : 'Leer'}</span>
      </div>

      <div style={slotStyle(hasLegs)}>
        <span style={{ color: '#445566', minWidth: 36 }}>BEINE</span>
        <span>{hasLegs ? 'Beintasche' : 'Leer'}</span>
      </div>

      <div style={{ ...slotStyle(selectedAmmo !== 'standard', ammoCfg.color), marginTop: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: ammoCfg.color, flexShrink: 0 }} />
        <span style={{ color: '#445566' }}>MUN.</span>
        <span style={{ color: ammoCfg.color }}>{ammoCfg.shortName}</span>
      </div>

      {/* Ammo capacity preview */}
      <div style={{ marginTop: 8, padding: '10px 12px', background: '#08080f', border: '1px solid #1a1a2e', borderRadius: 3 }}>
        <div style={{ color: '#445566', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>MAGAZIN-KAPAZITÄT</div>
        <div style={{ height: 6, background: '#111122', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (maxAmmo / (WEAPON_CONFIGS[selectedWeapon].baseAmmo * 2.2)) * 100)}%`,
            background: 'linear-gradient(90deg, #0066cc, #00ccff)',
            boxShadow: '0 0 8px #00aaff',
          }} />
        </div>
        <div style={{ color: '#00ccff', fontSize: 13, fontWeight: 'bold' }}>{maxAmmo} Schuss</div>
      </div>
    </div>
  )
}

// ── Vernichter card ──────────────────────────────────────────────────────────

function VernichterCard() {
  const { credits, vernichterStock, buyVernichterAmmo } = useLoadoutStore()
  const canAfford = credits >= VERNICHTER_AMMO_PRICE

  return (
    <div
      style={{
        background: '#120800',
        border: '1px solid #ff440044',
        borderRadius: 4,
        padding: '14px 16px',
        cursor: canAfford ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        boxShadow: '0 0 20px #ff220022, inset 0 0 30px #ff110011',
      }}
      onClick={() => canAfford && buyVernichterAmmo()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: '#ff6600', fontSize: 16, fontWeight: 'bold', letterSpacing: 2, textShadow: '0 0 12px #ff4400' }}>
            VERNICHTER
          </div>
          <div style={{ color: '#554433', fontSize: 11, marginTop: 2, letterSpacing: 1 }}>BFG-9000 · Klasse S · [R]-Taste</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#ff6600', fontSize: 11, letterSpacing: 2, padding: '3px 8px', border: '1px solid #ff4400', borderRadius: 2, marginBottom: 4 }}>
            ×{vernichterStock} VORRAT
          </div>
          <div style={{ color: canAfford ? '#ffee00' : '#664400', fontSize: 13, fontWeight: 'bold' }}>
            {VERNICHTER_AMMO_PRICE} CR / Schuss
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ color: '#ff4400', fontSize: 12, fontWeight: 'bold' }}>Radius: 9m</div>
        <div style={{ color: '#ff4400', fontSize: 12, fontWeight: 'bold' }}>Schaden: MAXIMAL</div>
        <div style={{ color: '#ff4400', fontSize: 12, fontWeight: 'bold' }}>Tempo: langsam</div>
      </div>
      <div style={{ color: '#554433', fontSize: 11, lineHeight: 1.5 }}>
        Langsames Plasmaprojektil. Explodiert bei Aufprall. Vernichtet alles im Umkreis sofort.
        Kein Freund-Feind-Schutz. Eigene Deckung empfohlen.
      </div>

      {!canAfford && (
        <div style={{ color: '#442200', fontSize: 10, marginTop: 6, letterSpacing: 1 }}>NICHT GENUG CREDITS</div>
      )}
    </div>
  )
}

// ── Akimbo upgrade card ──────────────────────────────────────────────────────

function AkimboCard() {
  const { isAkimbo, selectedWeapon, credits, buyAkimbo } = useLoadoutStore()
  const compatible = selectedWeapon === 'pistol' || selectedWeapon === 'smg'
  const canAfford  = credits >= AKIMBO_PRICE

  return (
    <div
      style={{
        background: isAkimbo ? '#1a0a2e' : '#080812',
        border: `1px solid ${isAkimbo ? '#cc44ff' : compatible ? '#331144' : '#111122'}`,
        borderRadius: 4,
        padding: '14px 16px',
        cursor: compatible && !isAkimbo ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        boxShadow: isAkimbo ? '0 0 14px #cc44ff33, inset 0 0 20px #cc44ff11' : 'none',
        opacity: compatible ? 1 : 0.5,
      }}
      onClick={() => compatible && !isAkimbo && buyAkimbo()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: isAkimbo ? '#cc88ff' : '#cceeff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
            AKIMBO UPGRADE
          </div>
          <div style={{ color: '#445566', fontSize: 11, marginTop: 2 }}>Dual Wield — Pistole / MP5</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {isAkimbo ? (
            <div style={{ color: '#cc88ff', fontSize: 11, letterSpacing: 2, padding: '3px 8px', border: '1px solid #cc44ff', borderRadius: 2 }}>
              AKTIV
            </div>
          ) : (
            <div style={{ color: canAfford && compatible ? '#ffee00' : '#664400', fontSize: 13, fontWeight: 'bold' }}>
              {AKIMBO_PRICE} CR
            </div>
          )}
        </div>
      </div>

      <div style={{ color: '#cc44ff', fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>
        ×2 Schüsse &nbsp;·&nbsp; Q/E Ballett-Spin &nbsp;·&nbsp; Zweiter Lauf
      </div>
      <div style={{ color: '#445566', fontSize: 11, lineHeight: 1.4 }}>
        Zwei Pistolen gleichzeitig. Verbraucht doppelt Munition. Schaltet Ballett-Spin-Manöver frei (Q/E).
      </div>

      {!compatible && (
        <div style={{ color: '#553300', fontSize: 10, marginTop: 8, letterSpacing: 1 }}>
          NUR MIT PISTOLE ODER MP5
        </div>
      )}
      {compatible && !isAkimbo && !canAfford && (
        <div style={{ color: '#442200', fontSize: 10, marginTop: 6, letterSpacing: 1 }}>NICHT GENUG CREDITS</div>
      )}
    </div>
  )
}

// ── Main Shop ────────────────────────────────────────────────────────────────

export function Shop() {
  const [category, setCategory] = useState<Category>('waffen')
  const setPhase    = useGameStore((s) => s.setPhase)
  const setGameMode = useGameStore((s) => s.setGameMode)
  const { credits } = useLoadoutStore()

  const mob = typeof window !== 'undefined' && window.innerWidth < 640

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: mob ? '10px 14px' : '10px 20px',
    background: active ? '#00aaff22' : 'transparent',
    border: `1px solid ${active ? '#00aaff' : '#1a1a2e'}`,
    color: active ? '#00ccff' : '#445566',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11,
    letterSpacing: mob ? 1 : 3,
    textTransform: 'uppercase',
    transition: 'all 0.15s',
    borderRadius: 2,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  })

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
      background: 'radial-gradient(ellipse at 30% 20%, #0a0a2a 0%, #000008 70%)',
      fontFamily: "'Courier New', monospace",
      userSelect: 'none',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: mob ? 'flex-start' : 'center',
        flexDirection: mob ? 'column' : 'row',
        justifyContent: 'space-between',
        padding: mob ? '10px 14px 8px' : '16px 28px',
        borderBottom: '1px solid #111122',
        gap: mob ? 4 : 0,
      }}>
        <div>
          <div style={{ color: '#00aaff', fontSize: mob ? 15 : 20, fontWeight: 'bold', letterSpacing: mob ? 3 : 6, textShadow: '0 0 12px #00aaff' }}>
            COVERT OPERATIONS
          </div>
          <div style={{ color: '#334455', fontSize: 10, letterSpacing: 3, marginTop: 2 }}>AUSRÜSTUNG & WAFFEN</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: '#445566', fontSize: 11, letterSpacing: 2 }}>CREDITS</div>
          <div style={{ color: '#ffee00', fontSize: mob ? 20 : 26, fontWeight: 'bold', letterSpacing: 2, textShadow: '0 0 10px #ffcc00' }}>
            {credits.toString().padStart(5, '0')}
          </div>
        </div>
      </div>

      {/* Mobile: horizontal tab bar */}
      {mob && (
        <div style={{
          display: 'flex', gap: 6, padding: '8px 12px',
          borderBottom: '1px solid #111122', overflowX: 'auto',
        }}>
          <button style={tabStyle(category === 'waffen')}      onClick={() => setCategory('waffen')}>Waffen</button>
          <button style={tabStyle(category === 'ausruestung')} onClick={() => setCategory('ausruestung')}>Ausrüstung</button>
          <button style={tabStyle(category === 'munition')}    onClick={() => setCategory('munition')}>Munition</button>
          <button style={tabStyle(category === 'ladung')}      onClick={() => setCategory('ladung')}>Ladung</button>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Desktop: Left sidebar */}
        {!mob && (
          <div style={{
            width: 180, borderRight: '1px solid #111122', padding: '20px 16px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ color: '#334455', fontSize: 10, letterSpacing: 3, marginBottom: 8 }}>KATEGORIE</div>
            <button style={tabStyle(category === 'waffen')}      onClick={() => setCategory('waffen')}>Waffen</button>
            <button style={tabStyle(category === 'ausruestung')} onClick={() => setCategory('ausruestung')}>Ausrüstung</button>
            <button style={tabStyle(category === 'munition')}    onClick={() => setCategory('munition')}>Munition</button>
            {category === 'ausruestung' && (
              <div style={{ marginTop: 16, padding: '10px', background: '#080812', border: '1px solid #1a1a2e', borderRadius: 3, color: '#334455', fontSize: 10, lineHeight: 1.6 }}>
                Ausrüstung erhöht die Munitionskapazität dauerhaft. Einmal gekauft, immer aktiv.
              </div>
            )}
            {category === 'waffen' && (
              <div style={{ marginTop: 16, padding: '10px', background: '#080812', border: '1px solid #1a1a2e', borderRadius: 3, color: '#334455', fontSize: 10, lineHeight: 1.6 }}>
                Einmal freigeschaltet permanent verfügbar. Klick zum Wechseln.
              </div>
            )}
            {category === 'munition' && (
              <div style={{ marginTop: 16, padding: '10px', background: '#080812', border: '1px solid #1a1a2e', borderRadius: 3, color: '#334455', fontSize: 10, lineHeight: 1.6 }}>
                Einmaliger Kauf schaltet dauerhaft frei. Typ jederzeit wechselbar.
              </div>
            )}
          </div>
        )}

        {/* Center: item grid */}
        <div style={{ flex: 1, padding: mob ? '12px' : '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mob && category === 'ladung' && <CharacterPanel />}

          {category === 'waffen' && (
            <>
              <div style={{ color: '#334455', fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>STANDARD</div>
              {(['pistol', 'smg', 'shotgun', 'rifle'] as WeaponId[]).map((id) => (
                <WeaponCard key={id} id={id} />
              ))}
              <div style={{ color: '#334455', fontSize: 10, letterSpacing: 3, marginTop: 8, marginBottom: 4 }}>AUTOMATISCH / BURST</div>
              {(['uzi', 'mp5', 'm16'] as WeaponId[]).map((id) => (
                <WeaponCard key={id} id={id} />
              ))}
              <div style={{ color: '#223355', fontSize: 10, letterSpacing: 3, marginTop: 8, marginBottom: 4 }}>ENERGIE / SPEZIAL</div>
              {(['blaster', 'flak'] as WeaponId[]).map((id) => (
                <WeaponCard key={id} id={id} />
              ))}
              <div style={{ color: '#553322', fontSize: 10, letterSpacing: 3, marginTop: 8, marginBottom: 4 }}>SCHWERE WAFFEN</div>
              {(['plasma', 'bazooka', 'banana'] as WeaponId[]).map((id) => (
                <WeaponCard key={id} id={id} />
              ))}
              <div style={{ color: '#334455', fontSize: 10, letterSpacing: 3, marginTop: 8, marginBottom: 4 }}>UPGRADES</div>
              <AkimboCard />
              <div style={{ color: '#553322', fontSize: 10, letterSpacing: 3, marginTop: 8, marginBottom: 4 }}>BFG</div>
              <VernichterCard />
            </>
          )}

          {category === 'ausruestung' && (
            <>
              <div style={{ color: '#334455', fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>AUSRÜSTUNG</div>
              {(['backpack', 'chest_pouch', 'leg_pouch'] as EquipmentId[]).map((id) => (
                <EquipmentCard key={id} id={id} />
              ))}
            </>
          )}

          {category === 'munition' && (
            <>
              <div style={{ color: '#334455', fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>MUNITIONSTYPEN</div>
              {(['standard', 'hollow_point', 'ap'] as AmmoId[]).map((id) => (
                <AmmoCard key={id} id={id} />
              ))}
            </>
          )}
        </div>

        {/* Desktop: Right character panel */}
        {!mob && (
          <div style={{ width: 220, borderLeft: '1px solid #111122', padding: '20px 16px', overflowY: 'auto' }}>
            <CharacterPanel />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: mob ? '10px 12px' : '16px 28px',
        borderTop: '1px solid #111122',
        display: 'flex',
        flexDirection: mob ? 'column' : 'row',
        alignItems: mob ? 'stretch' : 'center',
        justifyContent: mob ? 'center' : 'flex-end',
        gap: mob ? 8 : 16,
      }}>
        <button
          onClick={() => setPhase('menu')}
          style={{
            background: 'transparent', border: '1px solid #223344', color: '#445566',
            fontSize: mob ? 14 : 12, letterSpacing: 3, padding: mob ? '14px' : '10px 24px',
            cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#aabbcc'; e.currentTarget.style.borderColor = '#445566' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#445566'; e.currentTarget.style.borderColor = '#223344' }}
        >
          Hauptmenü
        </button>

        <button
          onClick={() => { setGameMode('arena'); setPhase('briefing') }}
          style={{
            background: '#00aaff22', border: '2px solid #00aaff', color: '#00ccff',
            fontSize: mob ? 16 : 14, letterSpacing: 4, padding: mob ? '16px' : '12px 36px',
            cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', fontWeight: 'bold',
            boxShadow: '0 0 20px #00aaff44', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00aaff44'
            e.currentTarget.style.boxShadow = '0 0 30px #00aaffaa'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#00aaff22'
            e.currentTarget.style.boxShadow = '0 0 20px #00aaff44'
            e.currentTarget.style.color = '#00ccff'
          }}
        >
          Mission Starten
        </button>
      </div>
    </div>
  )
}
