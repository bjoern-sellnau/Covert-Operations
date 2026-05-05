import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useLoadoutStore } from '../game/loadoutStore'
import { useMutatorsStore } from '../store/mutatorsStore'
import {
  WEAPON_CONFIGS, EQUIPMENT_CONFIGS, AMMO_CONFIGS, AKIMBO_PRICE, VERNICHTER_AMMO_PRICE, LASER_AMMO_PRICE, ION_AMMO_PRICE,
  WEAPON_SLOT_WEAPONS, WEAPON_TO_SLOT,
  type WeaponId, type EquipmentId, type AmmoId,
} from '../game/types'
import { entityStore } from '../game/entityStore'

const BOT_GAME_TYPES = new Set(['instakill', 'deathmatch', 'hardline_solo', 'hardline', 'instakill_wave', 'arena'])

type Category = 'waffen' | 'nahkampf' | 'ausruestung' | 'munition' | 'ladung'

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
            background: i < value ? color : 'rgba(8,9,6,1)',
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
  const { ownedWeapons, selectedWeapon, credits, buyWeapon, selectWeapon, isAkimbo } = useLoadoutStore()
  const owned = ownedWeapons.includes(id)
  const selected = selectedWeapon === id
  const canAfford = credits >= cfg.price
  const akimboEligible = (id === 'pistol' || id === 'smg') && owned && !isAkimbo
  const canAffordAkimbo = credits >= AKIMBO_PRICE

  const handleClick = () => {
    if (owned && !akimboEligible) selectWeapon(id)
    else buyWeapon(id)
  }

  return (
    <div
      style={{
        background: selected ? 'rgba(224,84,24,0.08)' : 'rgba(10,12,7,0.85)',
        border: `1px solid ${selected ? '#e05418' : owned ? 'rgba(138,154,98,0.18)' : 'rgba(8,9,6,1)'}`,
        borderRadius: 4,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: selected ? '0 0 12px rgba(224,84,24,0.3), inset 0 0 20px rgba(224,84,24,0.06)' : 'none',
      }}
      onClick={handleClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: selected ? '#f07030' : '#e0dcc8', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
            {cfg.name}
          </div>
          <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 11, marginTop: 2 }}>{cfg.shortName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {owned && !akimboEligible ? (
            <div style={{
              color: selected ? '#00ffaa' : 'rgba(138,154,98,0.7)',
              fontSize: 11,
              letterSpacing: 2,
              padding: '3px 8px',
              border: `1px solid ${selected ? '#00ffaa' : 'rgba(138,154,98,0.18)'}`,
              borderRadius: 2,
            }}>
              {selected ? 'AKTIV' : 'BESESSEN'}
            </div>
          ) : akimboEligible ? (
            <div style={{ color: canAffordAkimbo ? '#cc88ff' : '#664400', fontSize: 11, fontWeight: 'bold' }}>
              +1 AKIMBO<br />{AKIMBO_PRICE} CR
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
          <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, width: 60, letterSpacing: 1 }}>SCHADEN</div>
          <StatBar value={cfg.statDamage} color="#ff4444" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, width: 60, letterSpacing: 1 }}>FEUER</div>
          <StatBar value={cfg.statRate} color="#ffaa00" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, width: 60, letterSpacing: 1 }}>REICHW.</div>
          <StatBar value={cfg.statRange} color="#e05418" />
        </div>
      </div>

      <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 11, lineHeight: 1.4 }}>{cfg.description}</div>

      <div style={{ display: 'flex', gap: 16, marginTop: 8, color: 'rgba(138,154,98,0.25)', fontSize: 10 }}>
        <span>MUNITION: {cfg.baseAmmo}</span>
        {cfg.pellets > 1 && <span>PELLETS: {cfg.pellets}</span>}
      </div>

      {!owned && !canAfford && (
        <div style={{ color: '#442200', fontSize: 10, marginTop: 6, letterSpacing: 1 }}>
          NICHT GENUG CREDITS
        </div>
      )}
      {akimboEligible && !canAffordAkimbo && (
        <div style={{ color: '#442266', fontSize: 10, marginTop: 6, letterSpacing: 1 }}>
          NICHT GENUG CREDITS FÜR AKIMBO
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
  const slotLabel = { back: 'RÜCKEN', chest: 'BRUST', legs: 'BEINE', body: 'KÖRPER' }[cfg.slot]

  return (
    <div
      style={{
        background: owned ? 'rgba(10,12,7,0.85)' : 'rgba(10,12,7,0.85)',
        border: `1px solid ${owned ? '#226633' : 'rgba(8,9,6,1)'}`,
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
          <div style={{ color: owned ? '#00ff88' : '#e0dcc8', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
            {cfg.name}
          </div>
          <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, marginTop: 2, letterSpacing: 2 }}>{slotLabel}</div>
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
      <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 11, lineHeight: 1.4 }}>{cfg.description}</div>

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
        background: selected ? 'rgba(10,12,7,0.85)' : 'rgba(10,12,7,0.85)',
        border: `1px solid ${selected ? cfg.color : owned ? 'rgba(138,154,98,0.18)' : 'rgba(8,9,6,1)'}`,
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
            <div style={{ color: selected ? cfg.color : '#e0dcc8', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
              {cfg.name}
            </div>
          </div>
          <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, marginTop: 2, letterSpacing: 2 }}>{cfg.shortName}</div>
        </div>
        {id === 'standard' || owned ? (
          <div style={{
            color: selected ? cfg.color : 'rgba(138,154,98,0.4)',
            fontSize: 11, letterSpacing: 2, padding: '3px 8px',
            border: `1px solid ${selected ? cfg.color : 'rgba(138,154,98,0.18)'}`, borderRadius: 2,
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
      <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 11, lineHeight: 1.4 }}>{cfg.description}</div>
    </div>
  )
}

// ── Melee card ───────────────────────────────────────────────────────────────

function MeleeCard({ id }: { id: WeaponId }) {
  const cfg = WEAPON_CONFIGS[id]
  const { ownedWeapons, selectedWeapon, credits, meleeStacks, buyWeapon, selectWeapon } = useLoadoutStore()
  const owned     = ownedWeapons.includes(id)
  const selected  = selectedWeapon === id
  const canAfford = credits >= cfg.price
  const stacks    = meleeStacks[id] ?? 1
  const totalDur  = cfg.stackable ? cfg.baseAmmo * stacks : cfg.baseAmmo

  return (
    <div
      style={{
        background: selected ? '#1a0800' : 'rgba(10,12,7,0.85)',
        border: `1px solid ${selected ? '#ff8800' : owned ? '#443322' : 'rgba(8,9,6,1)'}`,
        borderRadius: 4, padding: '14px 16px', cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: selected ? '0 0 12px #ff880033' : 'none',
      }}
      onClick={() => { if (owned) selectWeapon(id); else buyWeapon(id) }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: selected ? '#ff9933' : '#ffccaa', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
            {cfg.name}
          </div>
          <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 11, marginTop: 2 }}>{cfg.shortName} · NAHKAMPF</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {owned ? (
            <div style={{
              color: selected ? '#ff9933' : '#664422', fontSize: 11, letterSpacing: 2,
              padding: '3px 8px', border: `1px solid ${selected ? '#ff9933' : '#443322'}`, borderRadius: 2,
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
          <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, width: 60, letterSpacing: 1 }}>SCHADEN</div>
          <StatBar value={cfg.statDamage} color="#ff8844" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, width: 60, letterSpacing: 1 }}>TEMPO</div>
          <StatBar value={cfg.statRate} color="#ffaa00" />
        </div>
      </div>

      <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 11, lineHeight: 1.4, marginBottom: 8 }}>{cfg.description}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {cfg.stackable ? (
          <div style={{ color: '#664433', fontSize: 10 }}>
            HALTBARKEIT: {owned ? `${totalDur} Treffer (${stacks}×)` : `${cfg.baseAmmo} Treffer`}
          </div>
        ) : (
          <div style={{ color: '#446644', fontSize: 10 }}>UNZERSTÖRBAR ∞</div>
        )}
        {owned && cfg.stackable && (
          <div
            onClick={(e) => { e.stopPropagation(); buyWeapon(id) }}
            style={{
              padding: '4px 10px', borderRadius: 2, cursor: canAfford ? 'pointer' : 'default',
              background: canAfford ? '#553300' : 'transparent',
              border: `1px solid ${canAfford ? '#ff8800' : '#443322'}`,
              color: canAfford ? '#ffcc88' : '#664433', fontSize: 10, letterSpacing: 1,
            }}
          >
            +1 KAUFEN ({cfg.price} CR)
          </div>
        )}
      </div>

      {!owned && !canAfford && (
        <div style={{ color: '#442200', fontSize: 10, marginTop: 6, letterSpacing: 1 }}>NICHT GENUG CREDITS</div>
      )}
    </div>
  )
}

// ── Character loadout panel ──────────────────────────────────────────────────

function CharacterPanel() {
  const { selectedWeapon, ownedWeapons, ownedEquipment, selectedAmmo, getMaxAmmo, selectWeapon } = useLoadoutStore()
  const ammoCfg = AMMO_CONFIGS[selectedAmmo]
  const maxAmmo = getMaxAmmo()
  const hasBackpack = ownedEquipment.includes('backpack')
  const hasChest = ownedEquipment.includes('chest_pouch')
  const hasLegs = ownedEquipment.includes('leg_pouch')

  const [weaponAmmo, setWeaponAmmo] = useState<Map<string, number>>(new Map())
  useEffect(() => {
    const id = setInterval(() => setWeaponAmmo(new Map(entityStore.weaponAmmo)), 100)
    return () => clearInterval(id)
  }, [])

  const equipStyle = (equipped: boolean, color = '#00ff88'): React.CSSProperties => ({
    padding: '7px 10px',
    border: `1px solid ${equipped ? color : 'rgba(138,154,98,0.18)'}`,
    borderRadius: 3,
    background: equipped ? `${color}11` : 'rgba(10,12,7,0.85)',
    color: equipped ? color : 'rgba(138,154,98,0.4)',
    fontSize: 11,
    letterSpacing: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  })

  // Group owned weapons by slot number, preserving slot order
  const SLOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 0]
  const ownedBySlot = new Map<number, WeaponId[]>()
  for (const wid of ownedWeapons) {
    const slot = WEAPON_TO_SLOT[wid] ?? 8
    if (!ownedBySlot.has(slot)) ownedBySlot.set(slot, [])
    ownedBySlot.get(slot)!.push(wid)
  }
  const usedSlots = SLOT_ORDER.filter(s => ownedBySlot.has(s))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginBottom: 2 }}>
        WAFFEN ({ownedWeapons.length})
      </div>

      {usedSlots.map(slot => (
        <div key={slot}>
          <div style={{ color: 'rgba(138,154,98,0.25)', fontSize: 9, letterSpacing: 2, marginBottom: 2 }}>
            [{slot === 0 ? '0' : slot}] {Object.entries(WEAPON_SLOT_WEAPONS).find(([k]) => Number(k) === slot)?.[1].map(w => WEAPON_CONFIGS[w]?.shortName).filter(Boolean).join(' / ')}
          </div>
          {ownedBySlot.get(slot)!.map(wid => {
            const wCfg = WEAPON_CONFIGS[wid]
            const isActive = selectedWeapon === wid
            const ammoCount = isActive ? entityStore.ammo : (weaponAmmo.get(wid) ?? wCfg.baseAmmo)
            const ammoMax = wCfg.baseAmmo
            const ammoPct = wCfg.isMelee ? 100 : Math.min(100, (ammoCount / ammoMax) * 100)
            const ammoColor = ammoPct > 40 ? '#e05418' : ammoPct > 15 ? '#ffaa00' : '#ff3300'
            return (
              <div
                key={wid}
                style={{
                  padding: '5px 10px',
                  border: `1px solid ${isActive ? 'rgba(224,84,24,0.4)' : 'rgba(138,154,98,0.18)'}`,
                  borderRadius: 3,
                  background: isActive ? 'rgba(224,84,24,0.06)' : 'rgba(10,12,7,0.85)',
                  color: isActive ? '#e05418' : 'rgba(138,154,98,0.45)',
                  fontSize: 11,
                  letterSpacing: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  marginBottom: 3,
                }}
                onClick={() => selectWeapon(wid)}
              >
                <span style={{ fontSize: 9, color: isActive ? '#e05418' : 'rgba(138,154,98,0.25)' }}>{isActive ? '▶' : '·'}</span>
                <span style={{ flex: 1 }}>{wCfg.shortName}</span>
                {!wCfg.isMelee && (
                  <span style={{ color: ammoColor, fontSize: 10, fontWeight: 'bold' }}>{ammoCount}</span>
                )}
              </div>
            )
          })}
        </div>
      ))}

      <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginTop: 4, marginBottom: 2 }}>AUSRÜSTUNG</div>

      <div style={equipStyle(hasChest)}>
        <span style={{ color: 'rgba(138,154,98,0.4)', minWidth: 36 }}>BRUST</span>
        <span>{hasChest ? 'Brusttasche' : 'Leer'}</span>
      </div>
      <div style={equipStyle(hasBackpack)}>
        <span style={{ color: 'rgba(138,154,98,0.4)', minWidth: 36 }}>RÜCKEN</span>
        <span>{hasBackpack ? 'Taktikrucksack' : 'Leer'}</span>
      </div>
      <div style={equipStyle(hasLegs)}>
        <span style={{ color: 'rgba(138,154,98,0.4)', minWidth: 36 }}>BEINE</span>
        <span>{hasLegs ? 'Beintasche' : 'Leer'}</span>
      </div>
      <div style={{ ...equipStyle(selectedAmmo !== 'standard', ammoCfg.color), marginTop: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: ammoCfg.color, flexShrink: 0 }} />
        <span style={{ color: 'rgba(138,154,98,0.4)' }}>MUN.</span>
        <span style={{ color: ammoCfg.color }}>{ammoCfg.shortName}</span>
      </div>

      <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(10,12,7,0.85)', border: '1px solid rgba(138,154,98,0.18)', borderRadius: 3 }}>
        <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>MAGAZIN-KAPAZITÄT</div>
        <div style={{ height: 6, background: 'rgba(8,9,6,1)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (maxAmmo / (WEAPON_CONFIGS[selectedWeapon].baseAmmo * 2.2)) * 100)}%`,
            background: 'linear-gradient(90deg, #e05418, #f07030)',
            boxShadow: '0 0 8px rgba(224,84,24,0.4)',
          }} />
        </div>
        <div style={{ color: '#f07030', fontSize: 13, fontWeight: 'bold' }}>{maxAmmo} Schuss</div>
      </div>
    </div>
  )
}

// ── Weapon ammo refill row ────────────────────────────────────────────────────

const REFILL_SKIP: Set<WeaponId> = new Set(['vernichter', 'deathlas', 'ioncan', 'grenade', 'knife', 'bat', 'stick'])

function refillPrice(id: WeaponId): number {
  return Math.max(15, Math.round(WEAPON_CONFIGS[id].price * 0.12))
}

function RefillSection() {
  const { ownedWeapons } = useLoadoutStore()
  const refillable = ownedWeapons.filter(id => !REFILL_SKIP.has(id))
  if (refillable.length === 0) return null
  return (
    <>
      <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginTop: 16, marginBottom: 4 }}>NACHFÜLLUNG</div>
      <div style={{ color: 'rgba(138,154,98,0.3)', fontSize: 9, letterSpacing: 1, marginBottom: 8 }}>
        Extra-Magazine kaufen — werden beim Spielstart verbraucht. Max. 3 pro Waffe.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {refillable.map(id => <WeaponRefillCard key={id} id={id} />)}
      </div>
    </>
  )
}

function WeaponRefillCard({ id }: { id: WeaponId }) {
  const cfg = WEAPON_CONFIGS[id]
  const { credits, weaponAmmoRefills, buyWeaponAmmo } = useLoadoutStore()
  const count    = weaponAmmoRefills[id] ?? 0
  const price    = refillPrice(id)
  const canBuy   = count < 3 && credits >= price

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 12px',
      background: count > 0 ? 'rgba(224,84,24,0.06)' : 'rgba(5,4,8,0.6)',
      border: `1px solid ${count > 0 ? 'rgba(224,84,24,0.25)' : 'rgba(138,154,98,0.12)'}`,
      borderRadius: 3,
    }}>
      <div>
        <span style={{ color: 'rgba(200,196,176,0.85)', fontSize: 12, letterSpacing: 1 }}>{cfg.shortName}</span>
        <span style={{ color: 'rgba(138,154,98,0.5)', fontSize: 10, marginLeft: 8 }}>+{cfg.baseAmmo} Schuss / Magazin</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {count > 0 && (
          <span style={{ color: '#e05418', fontSize: 10, letterSpacing: 1 }}>×{count}</span>
        )}
        <button
          disabled={!canBuy}
          onClick={() => buyWeaponAmmo(id)}
          style={{
            background: canBuy ? 'rgba(224,84,24,0.15)' : 'transparent',
            border: `1px solid ${canBuy ? 'rgba(224,84,24,0.5)' : 'rgba(138,154,98,0.15)'}`,
            color: canBuy ? '#e05418' : 'rgba(138,154,98,0.3)',
            fontSize: 10, letterSpacing: 2, padding: '4px 10px',
            cursor: canBuy ? 'pointer' : 'default',
            fontFamily: 'inherit', textTransform: 'uppercase',
            transition: 'all 0.12s',
          }}
        >
          {count >= 3 ? 'MAX' : `+1 MAG  ${price} CR`}
        </button>
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

// ── Death Laser card ─────────────────────────────────────────────────────────

function LaserCard() {
  const { credits, laserStock, buyLaserAmmo } = useLoadoutStore()
  const canAfford = credits >= LASER_AMMO_PRICE

  return (
    <div
      style={{
        background: '#110005',
        border: '1px solid #ff003344',
        borderRadius: 4,
        padding: '14px 16px',
        cursor: canAfford ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        boxShadow: '0 0 20px #cc001122, inset 0 0 30px #aa000811',
      }}
      onClick={() => canAfford && buyLaserAmmo()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: '#ff2244', fontSize: 16, fontWeight: 'bold', letterSpacing: 2, textShadow: '0 0 12px #ff0022' }}>
            TODESLASER
          </div>
          <div style={{ color: '#553344', fontSize: 11, marginTop: 2, letterSpacing: 1 }}>Sofortstrahl · [L]-Taste</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#ff2244', fontSize: 11, letterSpacing: 2, padding: '3px 8px', border: '1px solid #ff0033', borderRadius: 2, marginBottom: 4 }}>
            ×{laserStock} VORRAT
          </div>
          <div style={{ color: canAfford ? '#ffee00' : '#664400', fontSize: 13, fontWeight: 'bold' }}>
            {LASER_AMMO_PRICE} CR / Schuss
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ color: '#ff2244', fontSize: 12, fontWeight: 'bold' }}>Reichweite: 40m</div>
        <div style={{ color: '#ff2244', fontSize: 12, fontWeight: 'bold' }}>Schaden: INSTANT-TOD</div>
      </div>
      <div style={{ color: '#553344', fontSize: 11, lineHeight: 1.5 }}>
        Augenblicklicher Strahl in Zielrichtung. Alle Gegner im Pfad werden sofort vernichtet.
        Spieler ist nicht betroffen.
      </div>
      {!canAfford && (
        <div style={{ color: '#442200', fontSize: 10, marginTop: 6, letterSpacing: 1 }}>NICHT GENUG CREDITS</div>
      )}
    </div>
  )
}

// ── Ion Cannon card ──────────────────────────────────────────────────────────

function IonCard() {
  const { credits, ionStock, buyIonAmmo } = useLoadoutStore()
  const canAfford = credits >= ION_AMMO_PRICE

  return (
    <div
      style={{
        background: '#001511',
        border: '1px solid #00ffcc44',
        borderRadius: 4,
        padding: '14px 16px',
        cursor: canAfford ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        boxShadow: '0 0 20px #00ffcc11, inset 0 0 30px #00ccaa08',
      }}
      onClick={() => canAfford && buyIonAmmo()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: '#00ffcc', fontSize: 16, fontWeight: 'bold', letterSpacing: 2, textShadow: '0 0 12px #00ffaa' }}>
            IONEN-KANONE
          </div>
          <div style={{ color: '#335544', fontSize: 11, marginTop: 2, letterSpacing: 1 }}>Orbital-Schlag · [I]-Taste · 1.5s Verzögerung</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#00ffcc', fontSize: 11, letterSpacing: 2, padding: '3px 8px', border: '1px solid #00ffaa', borderRadius: 2, marginBottom: 4 }}>
            ×{ionStock} VORRAT
          </div>
          <div style={{ color: canAfford ? '#ffee00' : '#664400', fontSize: 13, fontWeight: 'bold' }}>
            {ION_AMMO_PRICE} CR / Schuss
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ color: '#00ffcc', fontSize: 12, fontWeight: 'bold' }}>Radius: 8m</div>
        <div style={{ color: '#00ffcc', fontSize: 12, fontWeight: 'bold' }}>4 Strahlen aus dem Orbit</div>
      </div>
      <div style={{ color: '#335544', fontSize: 11, lineHeight: 1.5 }}>
        Zielmarker auf Mausposition setzen. Nach 1.5s konvergieren 4 Ionenstrahlen vom Himmel.
        Spieler ist immun. Vernichtet alle Gegner im Radius.
      </div>
      {!canAfford && (
        <div style={{ color: '#442200', fontSize: 10, marginTop: 6, letterSpacing: 1 }}>NICHT GENUG CREDITS</div>
      )}
    </div>
  )
}

// ── Main Shop ────────────────────────────────────────────────────────────────

export function Shop() {
  const [category, setCategory] = useState<Category>('waffen')
  const setPhase    = useGameStore((s) => s.setPhase)
  const gameMode    = useGameStore((s) => s.gameMode)
  const { credits } = useLoadoutStore()
  const gameType    = useMutatorsStore((s) => s.gameType)
  const isBlockedMode = BOT_GAME_TYPES.has(gameType)

  const mob = typeof window !== 'undefined' && window.innerWidth < 640

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: mob ? '10px 14px' : '10px 20px',
    background: active ? 'rgba(224,84,24,0.12)' : 'transparent',
    border: `1px solid ${active ? '#e05418' : 'rgba(138,154,98,0.18)'}`,
    color: active ? '#f07030' : 'rgba(200,196,176,0.55)',
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
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      fontFamily: "'Courier New', monospace",
      userSelect: 'none',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Bot mode block banner */}
      {isBlockedMode && (
        <div style={{
          background: 'rgba(10,12,7,0.85)', borderBottom: '1px solid rgba(224,84,24,0.25)',
          padding: '10px 20px', textAlign: 'center',
          color: '#cc2200', fontSize: 10, letterSpacing: 4,
        }}>
          ⛔ KEIN SHOP IN DIESEM MODUS — Loadout aus vorherigem Spiel wird verwendet
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: mob ? 'flex-start' : 'center',
        flexDirection: mob ? 'column' : 'row',
        justifyContent: 'space-between',
        padding: mob ? '10px 14px 8px' : '16px 28px',
        borderBottom: '1px solid rgba(138,154,98,0.18)',
        gap: mob ? 4 : 0,
        opacity: isBlockedMode ? 0.4 : 1,
        pointerEvents: isBlockedMode ? 'none' : 'auto',
      }}>
        <div>
          <div style={{ color: '#e05418', fontSize: mob ? 15 : 20, fontWeight: 'bold', letterSpacing: mob ? 3 : 6, textShadow: '0 0 12px rgba(224,84,24,0.4)' }}>
            COVERT OPERATIONS
          </div>
          <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginTop: 2 }}>AUSRÜSTUNG & WAFFEN</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 11, letterSpacing: 2 }}>CREDITS</div>
          <div style={{ color: '#ffee00', fontSize: mob ? 20 : 26, fontWeight: 'bold', letterSpacing: 2, textShadow: '0 0 10px #ffcc00' }}>
            {credits.toString().padStart(5, '0')}
          </div>
        </div>
      </div>

      {/* Mobile: horizontal tab bar */}
      {mob && (
        <div style={{
          display: 'flex', gap: 6, padding: '8px 12px',
          borderBottom: '1px solid rgba(138,154,98,0.18)', overflowX: 'auto',
          opacity: isBlockedMode ? 0.3 : 1, pointerEvents: isBlockedMode ? 'none' : 'auto',
        }}>
          <button style={tabStyle(category === 'waffen')}      onClick={() => setCategory('waffen')}>Waffen</button>
          <button style={tabStyle(category === 'nahkampf')}    onClick={() => setCategory('nahkampf')}>Nahkampf</button>
          <button style={tabStyle(category === 'ausruestung')} onClick={() => setCategory('ausruestung')}>Ausrüstung</button>
          <button style={tabStyle(category === 'munition')}    onClick={() => setCategory('munition')}>Munition</button>
          <button style={tabStyle(category === 'ladung')}      onClick={() => setCategory('ladung')}>Ladung</button>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', opacity: isBlockedMode ? 0.3 : 1, pointerEvents: isBlockedMode ? 'none' : 'auto' }}>
        {/* Desktop: Left sidebar */}
        {!mob && (
          <div style={{
            width: 180, borderRight: '1px solid rgba(138,154,98,0.18)', padding: '20px 16px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginBottom: 8 }}>KATEGORIE</div>
            <button style={tabStyle(category === 'waffen')}      onClick={() => setCategory('waffen')}>Waffen</button>
            <button style={tabStyle(category === 'nahkampf')}    onClick={() => setCategory('nahkampf')}>Nahkampf</button>
            <button style={tabStyle(category === 'ausruestung')} onClick={() => setCategory('ausruestung')}>Ausrüstung</button>
            <button style={tabStyle(category === 'munition')}    onClick={() => setCategory('munition')}>Munition</button>
            {category === 'ausruestung' && (
              <div style={{ marginTop: 16, padding: '10px', background: 'rgba(10,12,7,0.85)', border: '1px solid rgba(138,154,98,0.18)', borderRadius: 3, color: 'rgba(138,154,98,0.4)', fontSize: 10, lineHeight: 1.6 }}>
                Ausrüstung erhöht die Munitionskapazität dauerhaft. Einmal gekauft, immer aktiv.
              </div>
            )}
            {category === 'waffen' && (
              <div style={{ marginTop: 16, padding: '10px', background: 'rgba(10,12,7,0.85)', border: '1px solid rgba(138,154,98,0.18)', borderRadius: 3, color: 'rgba(138,154,98,0.4)', fontSize: 10, lineHeight: 1.6 }}>
                Einmal freigeschaltet permanent verfügbar. Klick zum Wechseln.
              </div>
            )}
            {category === 'munition' && (
              <div style={{ marginTop: 16, padding: '10px', background: 'rgba(10,12,7,0.85)', border: '1px solid rgba(138,154,98,0.18)', borderRadius: 3, color: 'rgba(138,154,98,0.4)', fontSize: 10, lineHeight: 1.6 }}>
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
              <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>STANDARD</div>
              {(['pistol', 'smg', 'shotgun', 'rifle'] as WeaponId[]).map((id) => (
                <WeaponCard key={id} id={id} />
              ))}
              <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginTop: 8, marginBottom: 4 }}>AUTOMATISCH / BURST</div>
              {(['uzi', 'mp5', 'm16'] as WeaponId[]).map((id) => (
                <WeaponCard key={id} id={id} />
              ))}
              <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginTop: 8, marginBottom: 4 }}>ENERGIE / SPEZIAL</div>
              {(['blaster', 'flak'] as WeaponId[]).map((id) => (
                <WeaponCard key={id} id={id} />
              ))}
              <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginTop: 8, marginBottom: 4 }}>SCHWERE WAFFEN</div>
              {(['plasma', 'bazooka', 'banana', 'bfg'] as WeaponId[]).map((id) => (
                <WeaponCard key={id} id={id} />
              ))}
              <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginTop: 8, marginBottom: 4 }}>SPEZIALWAFFEN</div>
              <VernichterCard />
              <LaserCard />
              <IonCard />
            </>
          )}

          {category === 'nahkampf' && (
            <>
              <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>NAHKAMPFWAFFEN</div>
              {(['knife', 'bat', 'stick'] as WeaponId[]).map((id) => (
                <MeleeCard key={id} id={id} />
              ))}
            </>
          )}

          {category === 'ausruestung' && (
            <>
              <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>AUSRÜSTUNG</div>
              {(['palantir_suit', 'backpack', 'chest_pouch', 'leg_pouch'] as EquipmentId[]).map((id) => (
                <EquipmentCard key={id} id={id} />
              ))}
            </>
          )}

          {category === 'munition' && (
            <>
              <div style={{ color: 'rgba(138,154,98,0.4)', fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>MUNITIONSTYPEN</div>
              {(['standard', 'hollow_point', 'ap'] as AmmoId[]).map((id) => (
                <AmmoCard key={id} id={id} />
              ))}
              <RefillSection />
            </>
          )}
        </div>

        {/* Desktop: Right character panel */}
        {!mob && (
          <div style={{ width: 220, borderLeft: '1px solid rgba(138,154,98,0.18)', padding: '20px 16px', overflowY: 'auto' }}>
            <CharacterPanel />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: mob ? '10px 12px' : '16px 28px',
        paddingBottom: mob ? 'max(12px, calc(env(safe-area-inset-bottom, 0px) + 12px))' : '16px',
        borderTop: '1px solid rgba(138,154,98,0.18)',
        display: 'flex',
        flexDirection: mob ? 'column' : 'row',
        alignItems: mob ? 'stretch' : 'center',
        justifyContent: mob ? 'center' : 'flex-end',
        gap: mob ? 8 : 16,
      }}>
        <button
          onClick={() => setPhase('title_screen')}
          style={{
            background: 'transparent', border: '1px solid rgba(138,154,98,0.18)', color: 'rgba(138,154,98,0.4)',
            fontSize: mob ? 14 : 12, letterSpacing: 3, padding: mob ? '14px' : '10px 24px',
            cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e0dcc8'; e.currentTarget.style.borderColor = 'rgba(138,154,98,0.7)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(138,154,98,0.4)'; e.currentTarget.style.borderColor = 'rgba(138,154,98,0.18)' }}
        >
          Hauptmenü
        </button>

        <button
          onClick={() => {
            if (gameMode === 'shooting_range') { setPhase('playing') }
            else { setPhase('mutators') }
          }}
          style={{
            background: 'rgba(224,84,24,0.12)', border: '2px solid #e05418', color: '#f07030',
            fontSize: mob ? 16 : 14, letterSpacing: 4, padding: mob ? '16px' : '12px 36px',
            cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', fontWeight: 'bold',
            boxShadow: '0 0 20px rgba(224,84,24,0.3)', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(224,84,24,0.25)'
            e.currentTarget.style.boxShadow = '0 0 30px rgba(224,84,24,0.5)'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(224,84,24,0.12)'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(224,84,24,0.3)'
            e.currentTarget.style.color = '#f07030'
          }}
        >
          Mission Starten
        </button>
      </div>
    </div>
  )
}
