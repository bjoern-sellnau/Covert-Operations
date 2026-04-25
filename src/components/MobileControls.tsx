import { useRef } from 'react'
import { mobileInput } from '../store/mobileStore'

const MAX_R = 52   // joystick thumb max travel radius (px)

function ActionBtn({ label, color, size, sub, onDown, onUp }: {
  label: string; color: string; size: number; sub?: string
  onDown: () => void; onUp: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: `${color}1a`, border: `2px solid ${color}66`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color, fontFamily: "'Courier New', monospace", letterSpacing: 1,
        fontSize: size >= 70 ? 13 : 10, fontWeight: 'bold',
        pointerEvents: 'auto', touchAction: 'none', userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'background 0.08s',
        flexShrink: 0,
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        if (ref.current) ref.current.style.background = `${color}44`
        onDown()
      }}
      onPointerUp={(e) => {
        if (ref.current) ref.current.style.background = `${color}1a`
        onUp()
        void e
      }}
      onPointerCancel={() => {
        if (ref.current) ref.current.style.background = `${color}1a`
        onUp()
      }}
    >
      {label}
      {sub && <span style={{ fontSize: 8, opacity: 0.6, letterSpacing: 0 }}>{sub}</span>}
    </div>
  )
}

export function MobileControls() {
  const baseRef  = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const originRef = useRef({ x: 0, y: 0 })
  const activeRef = useRef(false)

  function onJoyDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const r = e.currentTarget.getBoundingClientRect()
    originRef.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    activeRef.current = true
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

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50,
      fontFamily: "'Courier New', monospace",
    }}>
      {/* ── Left virtual joystick ── */}
      <div
        ref={baseRef}
        style={{
          position: 'absolute', bottom: 28, left: 28,
          width: 130, height: 130, borderRadius: '50%',
          background: '#ffffff08', border: '2px solid #ffffff22',
          pointerEvents: 'auto', touchAction: 'none',
        }}
        onPointerDown={onJoyDown}
        onPointerMove={onJoyMove}
        onPointerUp={onJoyUp}
        onPointerCancel={onJoyUp}
      >
        <div ref={thumbRef} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 54, height: 54, borderRadius: '50%',
          background: '#ffffff30', border: '2px solid #ffffff60',
          transform: 'translate(-50%,-50%)', pointerEvents: 'none',
        }} />
      </div>

      {/* ── Right action buttons ── */}
      <div style={{
        position: 'absolute', bottom: 20, right: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
        pointerEvents: 'none',
      }}>
        {/* Row 1: BT + DIVE */}
        <div style={{ display: 'flex', gap: 10, pointerEvents: 'none' }}>
          <ActionBtn
            label="BT" sub="[SHIFT]" color="#00aaff" size={54}
            onDown={() => { mobileInput.btDown = true }}
            onUp={() => { mobileInput.btDown = false }}
          />
          <ActionBtn
            label="DIVE" sub="[SPC]" color="#00ccff" size={54}
            onDown={() => { mobileInput.diveJust = true }}
            onUp={() => {}}
          />
        </div>
        {/* Row 2: GRENADE + FIRE */}
        <div style={{ display: 'flex', gap: 10, pointerEvents: 'none' }}>
          <ActionBtn
            label="GRN" sub="[G]" color="#44ff44" size={54}
            onDown={() => { mobileInput.grenadeJust = true }}
            onUp={() => {}}
          />
          <ActionBtn
            label="FIRE" color="#ff4400" size={80}
            onDown={() => { mobileInput.fire = true }}
            onUp={() => { mobileInput.fire = false }}
          />
        </div>
      </div>
    </div>
  )
}
