import { useEffect, useRef, useState } from 'react'

const ENABLED = new URLSearchParams(window.location.search).has('debug')

type LogLevel = 'error' | 'warn' | 'log'
interface LogEntry { id: number; level: LogLevel; msg: string; time: string }
let _id = 0

export function DebugOverlay() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [visible, setVisible] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ENABLED) return

    function push(level: LogLevel, args: unknown[]) {
      const msg = args.map((a) => {
        if (typeof a === 'string') return a
        if (a instanceof Error) return `${a.message}\n${a.stack ?? ''}`
        try { return JSON.stringify(a, null, 1) } catch { return String(a) }
      }).join(' ')
      const time = new Date().toLocaleTimeString('de', { hour12: false })
      setEntries((prev) => {
        const next = [...prev, { id: _id++, level, msg, time }]
        return next.length > 300 ? next.slice(-300) : next
      })
    }

    const _error = console.error.bind(console)
    const _warn  = console.warn.bind(console)
    const _log   = console.log.bind(console)

    console.error = (...args: unknown[]) => { _error(...args); push('error', args) }
    console.warn  = (...args: unknown[]) => { _warn(...args);  push('warn',  args) }
    console.log   = (...args: unknown[]) => { _log(...args);   push('log',   args) }

    const onError  = (e: ErrorEvent) =>
      push('error', [`Unhandled error: ${e.message}`, `${e.filename}:${e.lineno}`])
    const onReject = (e: PromiseRejectionEvent) =>
      push('error', ['Unhandled rejection:', e.reason])

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onReject)

    return () => {
      console.error = _error
      console.warn  = _warn
      console.log   = _log
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onReject)
    }
  }, [])

  useEffect(() => {
    if (visible && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [entries, visible])

  if (!ENABLED) return null

  const colorFor = (l: LogLevel) =>
    l === 'error' ? '#ff5555' : l === 'warn' ? '#ffaa44' : '#8899aa'

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      pointerEvents: 'auto', fontFamily: "'Courier New', monospace",
    }}>
      <div style={{
        display: 'flex', gap: 8, padding: '3px 8px',
        background: 'rgba(4,4,16,0.92)', borderTop: '1px solid #ff000055',
        alignItems: 'center',
      }}>
        <span style={{ color: '#ff4444', fontSize: 10, letterSpacing: 2, flex: 1 }}>
          DEBUG — ?debug=true &nbsp;
          <span style={{ color: '#556677' }}>({entries.length} msgs)</span>
        </span>
        <button
          onClick={() => setEntries([])}
          style={btnStyle}
        >CLEAR</button>
        <button
          onClick={() => setVisible((v) => !v)}
          style={btnStyle}
        >{visible ? '▼' : '▲'}</button>
      </div>

      {visible && (
        <div
          ref={scrollRef}
          style={{
            maxHeight: 200, overflowY: 'auto',
            background: 'rgba(2,2,12,0.94)',
            borderTop: '1px solid #0a0a20',
          }}
        >
          {entries.length === 0 ? (
            <div style={{ color: '#334455', fontSize: 10, padding: '6px 10px', letterSpacing: 1 }}>
              No messages yet.
            </div>
          ) : entries.map((e) => (
            <div key={e.id} style={{
              padding: '2px 10px', fontSize: 10, lineHeight: 1.55,
              borderBottom: '1px solid #080814',
              color: colorFor(e.level),
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              <span style={{ color: '#334455', marginRight: 8 }}>{e.time}</span>
              <span style={{ color: colorFor(e.level), opacity: 0.6, marginRight: 8 }}>
                [{e.level.toUpperCase()}]
              </span>
              {e.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #1a2a35',
  color: '#445566',
  fontSize: 9, letterSpacing: 1,
  padding: '2px 7px',
  cursor: 'pointer',
  fontFamily: "'Courier New', monospace",
}
