import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { useNetStore } from './net/netStore'
import { useSettingsStore } from './store/settingsStore'
import { socket } from './net/socket'
import { startMenuMusic, startGameMusic, startSkydiveMusic, stopMusic } from './game/music'
import { Game } from './game/Game'
import { HUD } from './components/HUD'
import { MainMenu } from './components/MainMenu'
import { GameOver } from './components/GameOver'
import { Shop } from './components/Shop'
import { Editor } from './editor/Editor'
import { Skydive } from './skydive/Skydive'
import { SkydiveWin } from './components/SkydiveWin'
import { Lobby } from './components/Lobby'
import { ChatOverlay } from './components/ChatOverlay'
import { MobileControls } from './components/MobileControls'
import { OptionsScreen } from './components/OptionsScreen'
import { MissionsMenu } from './components/MissionsMenu'
import { MissionBriefing } from './components/MissionBriefing'

export function App() {
  const phase          = useGameStore((s) => s.phase)
  const isBulletTime   = useGameStore((s) => s.isBulletTime)
  const fpsMode        = useGameStore((s) => s.fpsMode)
  const bigExplosion   = useGameStore((s) => s.bigExplosion)
  const netRole        = useNetStore((s) => s.role)
  const mobileControls = useSettingsStore((s) => s.mobileControls)
  const musicEnabled   = useSettingsStore((s) => s.musicEnabled)

  // ── Music ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!musicEnabled) { stopMusic(); return }
    if (phase === 'menu' || phase === 'missions' || phase === 'briefing' || phase === 'options' || phase === 'lobby' || phase === 'shop') {
      startMenuMusic()
    } else if (phase === 'playing') {
      startGameMusic()
    } else if (phase === 'skydive') {
      startSkydiveMusic()
    } else {
      stopMusic()
    }
  }, [phase, musicEnabled])

  // ── Persistent socket event listeners (survive phase transitions) ────────
  useEffect(() => {
    const { setConnected, setRole, setRoom, setPing, addChat } = useNetStore.getState()
    const { setPhase } = useGameStore.getState()

    socket.on('connect',      () => setConnected(true))
    socket.on('disconnect',   () => { setConnected(false); setRole('offline'); setRoom(null) })
    socket.on('room_updated', (room) => setRoom(room))
    socket.on('player_left',  () => { /* room_updated follows */ })
    socket.on('game_started', () => setPhase('playing'))
    socket.on('chat_message', (msg) => addChat(msg))
    socket.on('ping',         (ts)  => { socket.emit('pong', ts); setPing(Date.now() - ts) })
    socket.on('error_msg',    (msg) => console.warn('[net]', msg))

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('room_updated')
      socket.off('player_left')
      socket.off('game_started')
      socket.off('chat_message')
      socket.off('ping')
      socket.off('error_msg')
    }
  }, [])

  const isNetGame = netRole !== 'offline' && phase === 'playing'

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Arena game canvas — conditionally mounted like Skydive */}
      {(phase === 'playing' || phase === 'gameover') && (
        <div style={{
          position: 'absolute', inset: 0,
          filter: isBulletTime ? 'saturate(0.25) brightness(0.85)' : 'none',
          transition: 'filter 0.15s ease-out',
        }}>
          <Game />
        </div>
      )}

      {/* Bullet-time vignette */}
      {phase === 'playing' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: isBulletTime
            ? 'radial-gradient(ellipse at center, transparent 38%, rgba(0,60,160,0.45) 100%)'
            : 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,20,0.5) 100%)',
          transition: 'background 0.2s ease-out',
        }} />
      )}

      {/* Bullet-time scanlines */}
      {isBulletTime && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,100,220,0.04) 3px, rgba(0,100,220,0.04) 4px)',
          animation: 'btScanlines 8s linear infinite',
        }} />
      )}

      {/* FPS crosshair */}
      {phase === 'playing' && fpsMode && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none', color: '#ffffff88',
          fontSize: 20, lineHeight: 1,
          textShadow: '0 0 4px #00ffff',
        }}>
          +
        </div>
      )}

      {/* Vernichter explosion flash */}
      {bigExplosion && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(255,120,0,0.7) 0%, rgba(255,30,0,0.4) 50%, transparent 100%)',
          animation: 'btPulse 0.4s ease-out forwards',
          mixBlendMode: 'screen',
        }} />
      )}

      {phase === 'playing'                    && <HUD />}
      {phase === 'playing' && mobileControls  && <MobileControls />}
      {phase === 'playing' && isNetGame        && <ChatOverlay />}
      {phase === 'menu'                        && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}><MainMenu /></div>}
      {phase === 'missions'                    && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}><MissionsMenu /></div>}
      {phase === 'briefing'                    && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}><MissionBriefing /></div>}
      {phase === 'options'                     && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}><OptionsScreen /></div>}
      {phase === 'lobby'                       && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}><Lobby /></div>}
      {phase === 'shop'                        && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}><Shop /></div>}
      {phase === 'gameover'                    && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}><GameOver /></div>}
      {phase === 'skydive_win'                 && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}><SkydiveWin /></div>}
      {phase === 'skydive'                     && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}><Skydive /></div>}
      {phase === 'editor'                      && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}><Editor /></div>}
    </div>
  )
}
