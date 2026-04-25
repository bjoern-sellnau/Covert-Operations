import { useState, useRef, useEffect, useCallback } from 'react'
import { useNetStore } from '../net/netStore'
import { useGameStore } from '../store/gameStore'
import { socket } from '../net/socket'

export function ChatOverlay() {
  const chatMessages = useNetStore((s) => s.chatMessages)
  const phase        = useGameStore((s) => s.phase)
  const [open,  setOpen]  = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const openChat = useCallback(() => {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 40)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'KeyT' && phase === 'playing' && !open) {
        e.preventDefault()
        openChat()
      }
      if (e.code === 'Escape' && open) {
        setOpen(false)
        setInput('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, openChat, phase])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) { setOpen(false); return }
    socket.emit('chat_message', text)
    setInput('')
    setOpen(false)
  }

  const recent = chatMessages.slice(-5)

  return (
    <div style={{
      position: 'absolute', bottom: 64, right: 18,
      pointerEvents: open ? 'auto' : 'none',
      fontFamily: "'Courier New', monospace",
      display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end',
      maxWidth: 340, zIndex: 100,
    }}>
      {/* Recent messages */}
      {recent.map((msg, i) => (
        <div key={i} style={{
          background: '#04040ecc', border: '1px solid #0d1a22',
          padding: '3px 9px', backdropFilter: 'blur(4px)',
          display: 'flex', gap: 7, alignItems: 'baseline',
          maxWidth: 320, wordBreak: 'break-word',
        }}>
          <span style={{
            color: msg.playerId === socket.id ? '#00aaff' : '#445566',
            fontSize: 10, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {msg.name}:
          </span>
          <span style={{ color: '#8aabb8', fontSize: 11 }}>{msg.text}</span>
        </div>
      ))}

      {/* Input or hint */}
      {open ? (
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 6, marginTop: 4, width: 300 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1, background: '#05051acc', border: '1px solid #005588',
              color: '#aaccff', fontSize: 12, padding: '6px 10px',
              fontFamily: "'Courier New', monospace", outline: 'none',
            }}
            placeholder="Nachricht — Esc abbrechen"
            maxLength={200}
          />
          <button type="submit" style={{
            background: '#004488aa', border: '1px solid #005588', color: '#00aaff',
            fontSize: 11, padding: '6px 10px', cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
          }}>
            ↵
          </button>
        </form>
      ) : (
        <div style={{ color: '#1a2a35', fontSize: 9, letterSpacing: 1, marginTop: 2 }}>
          [T] Chat
        </div>
      )}
    </div>
  )
}
