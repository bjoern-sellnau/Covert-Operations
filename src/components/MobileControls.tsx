import { useRef } from 'react'
import { mobileInput } from '../store/mobileStore'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'

const MAX_R = 48   // joystick thumb max travel (px)

function ActionBtn({ label, color, bg, size, sub, onDown, onUp }: {
  label: string; color: string; bg: string; size: number; sub?: string
  onDown: () => void; onUp: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: bg,
        border: `3px solid ${color}`,
        boxShadow: `0 0 12px ${color}55, inset 0 0 8px ${color}22`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color, fontFamily: "'Courier New', monospace", letterSpacing: 1,
        fontSize: size >= 74 ? 14 : 11, fontWeight: 'bold',
        pointerEvents: 'auto', touchAction: 'none',
        userSelect: 'none', WebkitUserSelect: 'none',
        flexShrink: 0, cursor: 'pointer',
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        if (ref.current) ref.current.style.background = color + '55'
        onDown()
      }}
      onPointerUp={(e) => {
        if (ref.current) ref.current.style.background = bg
        onUp()
        void e
      }}
      onPointerCancel={() => {
        if (ref.current) ref.current.style.background = bg
        onUp()
      }}
    >
      {label}
      {sub && <span style={{ fontSize: 9, opacity: 0.7, letterSpacing: 0, fontWeight: 'normal' }}>{sub}</span>}
    </div>
  )
}

function SmallBtn({ label, active, color, onTap }: {
  label: string; active?: boolean; color: string; onTap: () => void
}) {
  return (
    <div
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onTap() }}
      style={{
        padding: '6px 10px', borderRadius: 4,
        background: active ? `${color}33` : 'rgba(0,0,0,0.55)',
        border: `1px solid ${active ? color : color + '55'}`,
        color: active ? color : color + 'aa',
        fontFamily: "'Courier New', monospace", fontSize: 10, fontWeight: 'bold',
        letterSpacing: 1, pointerEvents: 'auto', touchAction: 'none',
        userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer',
        boxShadow: active ? `0 0 8px ${color}44` : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  )
}

export function MobileControls() {
  const baseRef   = useRef<HTMLDivElement>(null)
  const thumbRef  = useRef<HTMLDivElement>(null)
  const originRef = useRef({ x: 0, y: 0 })
  const activeRef = useRef(false)

  const cameraMode   = useGameStore((s) => s.cameraMode)
  const cameraFollow = useSettingsStore((s) => s.cameraFollow)
  const setCameraFollow = useSettingsStore((s) => s.setCameraFollow)

  function onJoyDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const r = e.currentTarget.getBoundingClientRect()
    originRef.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    activeRef.current = true
    if (baseRef.current) baseRef.current.style.background = 'rgba(0,170,255,0.18)'
    moveThumb(e.clientX, e.clientY)
  }

  function onJoyMove(e: React.PointerEvent) {
    if (!activeRef.current) return
    moveThumb(e.clientX, e.clientY)
  }

  function onJoyUp() {
    activeRef.current = false
    mobileInput.dx = 0
    mobileInput.dz = 0
    if (baseRef.current) baseRef.current.style.background = 'rgba(0,0,0,0.45)'
    if (thumbRef.current) thumbRef.current.style.transform = 'translate(-50%,-50%)'
  }

  function moveThumb(cx: number, cy: number) {
    let dx = cx - originRef.current.x
    let dy = cy - originRef.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > MAX_R) { dx = dx / dist * MAX_R; dy = dy / dist * MAX_R }
    mobileInput.dx = dx / MAX_R
    mobileInput.dz = dy / MAX_R
    if (thumbRef.current)
      thumbRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
  }

  const safeArea = 'env(safe-area-inset-bottom, 0px)'
  const modeLabel = cameraMode === 'iso' ? 'ISO' : 'TOP'

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', zIndex: 50,
      fontFamily: "'Courier New', monospace",
    }}>

      {/* ── Camera controls — top left ── */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        display: 'flex', gap: 8, pointerEvents: 'none',
      }}>
        <SmallBtn
          label={`CAM: ${modeLabel}`}
          color="#00aaff"
          onTap={() => { mobileInput.cameraModeJust = true }}
        />
        <SmallBtn
          label={cameraFollow ? 'LOCK ●' : 'LOCK ○'}
          active={cameraFollow}
          color="#ffaa00"
          onTap={() => setCameraFollow(!cameraFollow)}
        />
      </div>

      {/* ── Left virtual joystick ── */}
      <div
        ref={baseRef}
        style={{
          position: 'absolute',
          bottom: `calc(24px + ${safeArea})`,
          left: 24,
          width: 130, height: 130, borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          border: '3px solid rgba(0,170,255,0.7)',
          boxShadow: '0 0 16px rgba(0,170,255,0.3)',
          pointerEvents: 'auto', touchAction: 'none',
        }}
        onPointerDown={onJoyDown}
        onPointerMove={onJoyMove}
        onPointerUp={onJoyUp}
        onPointerCancel={onJoyUp}
      >
        {/* directional hint lines */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 8, fontSize: 14, color: 'rgba(0,170,255,0.5)', lineHeight: 1 }}>▲</div>
          <div style={{ position: 'absolute', bottom: 8, fontSize: 14, color: 'rgba(0,170,255,0.5)', lineHeight: 1 }}>▼</div>
          <div style={{ position: 'absolute', left: 8, fontSize: 14, color: 'rgba(0,170,255,0.5)', lineHeight: 1 }}>◀</div>
          <div style={{ position: 'absolute', right: 8, fontSize: 14, color: 'rgba(0,170,255,0.5)', lineHeight: 1 }}>▶</div>
        </div>
        {/* thumb */}
        <div ref={thumbRef} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(0,170,255,0.5)',
          border: '3px solid rgba(0,200,255,0.9)',
          boxShadow: '0 0 10px rgba(0,170,255,0.8)',
          transform: 'translate(-50%,-50%)', pointerEvents: 'none',
        }} />
      </div>

      {/* ── Weapon prev / next — above joystick ── */}
      <div style={{
        position: 'absolute',
        bottom: `calc(24px + ${safeArea} + 140px)`,
        left: 24,
        display: 'flex', gap: 8, pointerEvents: 'none',
      }}>
        <ActionBtn
          label="◀" sub="WPN" color="#ffaa00" bg="rgba(60,35,0,0.7)" size={52}
          onDown={() => { mobileInput.weaponPrevJust = true }}
          onUp={() => {}}
        />
        <ActionBtn
          label="▶" sub="WPN" color="#ffaa00" bg="rgba(60,35,0,0.7)" size={52}
          onDown={() => { mobileInput.weaponNextJust = true }}
          onUp={() => {}}
        />
      </div>

      {/* ── Right action buttons ── */}
      <div style={{
        position: 'absolute',
        bottom: `calc(20px + ${safeArea})`,
        right: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12,
        pointerEvents: 'none',
      }}>
        {/* Row 1: BT + DIVE */}
        <div style={{ display: 'flex', gap: 12, pointerEvents: 'none' }}>
          <ActionBtn
            label="BT" sub="SHIFT" color="#00aaff" bg="rgba(0,60,120,0.7)" size={58}
            onDown={() => { mobileInput.btDown = true }}
            onUp={() => { mobileInput.btDown = false }}
          />
          <ActionBtn
            label="DIVE" sub="SPC" color="#00ddff" bg="rgba(0,80,100,0.7)" size={58}
            onDown={() => { mobileInput.diveJust = true }}
            onUp={() => {}}
          />
        </div>
        {/* Row 2: GRENADE + FIRE */}
        <div style={{ display: 'flex', gap: 12, pointerEvents: 'none' }}>
          <ActionBtn
            label="GRN" sub="G" color="#44ff66" bg="rgba(0,80,20,0.7)" size={58}
            onDown={() => { mobileInput.grenadeJust = true }}
            onUp={() => {}}
          />
          <ActionBtn
            label="FIRE" color="#ff5500" bg="rgba(100,20,0,0.8)" size={82}
            onDown={() => { mobileInput.fire = true }}
            onUp={() => { mobileInput.fire = false }}
          />
        </div>
      </div>
    </div>
  )
}
