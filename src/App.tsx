import { useEffect, useState, useCallback } from 'react'
import { useGameStore } from './store/gameStore'
import { useNetStore } from './net/netStore'
import { useSettingsStore } from './store/settingsStore'
import { useMutatorsStore } from './store/mutatorsStore'
import { getCtx } from './game/audioCore'
import { socket } from './net/socket'
import { startMenuMusic, startGameMusic, startGameMusic2, startGameMusic3, startGameMusic4, startGameMusic5, startGameMusic6, startGameMusic7, startGameMusic8, startGameMusic9, startGameMusic10, startGameMusic11, startGameMusic12, startGameMusic13, startGameMusic14, startGameMusic15, startGameMusic16, startGameMusic17, startGameMusic18, startGameMusic19, startGameMusic20, startGameMusic21, startGameMusic22, startGameMusic23, startGameMusic24, startGameMusic25, startGameMusic26, startGameMusic27, startGameMusic28, startGameMusic29, startGameMusic30, startGameMusic31, startGameMusic32, startGameMusic33, startGameMusic34, startSkydiveMusic, stopMusic, playCustomTrack } from './game/music'
import { useCustomTracksStore } from './store/customTracksStore'
import { Game } from './game/Game'
import { HUD } from './components/HUD'
import { PauseMenu } from './components/PauseMenu'
import { MainMenu } from './components/MainMenu'
import { GameOver } from './components/GameOver'
import { Shop } from './components/Shop'
import { Editor } from './editor/Editor'
import { Skydive } from './skydive/Skydive'
import { SkydiveV1 } from './skydive/SkydiveV1'
import { SkydiveV3 } from './skydive/SkydiveV3'
import { SkydiveWin } from './components/SkydiveWin'
import { Lobby } from './components/Lobby'
import { ChatOverlay } from './components/ChatOverlay'
import { MobileControls } from './components/MobileControls'
import { OptionsScreen } from './components/OptionsScreen'
import { MissionsMenu } from './components/MissionsMenu'
import { MissionBriefing } from './components/MissionBriefing'
import { MutatorsScreen } from './components/MutatorsScreen'
import { HelpScreen } from './components/HelpScreen'
import { DemoViewer } from './components/DemoViewer'
import { CharacterSelectScreen } from './components/CharacterSelectScreen'
import { CutscenePlayer } from './components/CutscenePlayer'
import { SplashScreen } from './components/SplashScreen'
import { TitleScreen } from './components/TitleScreen'
import { SingleplayerMenu } from './components/TitleScreen/SingleplayerMenu'
import { MultiplayerMenu } from './components/TitleScreen/MultiplayerMenu'
import { DebugMenu } from './components/TitleScreen/DebugMenu'
import { TrackPlayer } from './components/TrackPlayer'
import { GameModesScreen } from './components/GameModesScreen'
import { MapSelectScreen } from './components/MapSelectScreen'
import { RulesScreen } from './components/RulesScreen'

export function App() {
  const phase          = useGameStore((s) => s.phase)
  const paused         = useGameStore((s) => s.paused)
  const isBulletTime   = useGameStore((s) => s.isBulletTime)
  const cameraMode     = useGameStore((s) => s.cameraMode)
  const bigExplosion   = useGameStore((s) => s.bigExplosion)
  const netRole        = useNetStore((s) => s.role)
  const mobileControls   = useSettingsStore((s) => s.mobileControls)
  const musicEnabled     = useSettingsStore((s) => s.musicEnabled)
  const customTrackId    = useSettingsStore((s) => s.customTrackId)
  const btVisualEffect   = useMutatorsStore((s) => s.btVisualEffect)
  const customTracks     = useCustomTracksStore((s) => s.tracks)
  const visualBT        = isBulletTime && btVisualEffect

  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFSChange)
    return () => document.removeEventListener('fullscreenchange', onFSChange)
  }, [])

  // Nostalgie-Shortcut: Shift+Alt+M → klassisches Menü
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && e.key === 'M') {
        useGameStore.getState().setPhase('menu')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Unlock AudioContext on first user interaction; restart music if context was suspended
  useEffect(() => {
    function unlock() {
      const ctx = getCtx()
      document.removeEventListener('click',      unlock)
      document.removeEventListener('keydown',    unlock)
      document.removeEventListener('touchstart', unlock)
      if (ctx.state !== 'suspended') return
      ctx.resume().then(() => {
        // Context was suspended — music may have been queued but silent; restart it
        const p       = useGameStore.getState().phase
        const enabled = useSettingsStore.getState().musicEnabled
        const MENU_PHASES = ['title_screen','singleplayer_menu','multiplayer_menu','debug_menu',
          'menu','character_select','missions','briefing','mutators','options','track_player','lobby','shop']
        if (enabled && MENU_PHASES.includes(p)) {
          stopMusic()
          startMenuMusic()
        }
      }).catch(() => {})
    }
    document.addEventListener('click',      unlock)
    document.addEventListener('keydown',    unlock)
    document.addEventListener('touchstart', unlock)
    return () => {
      document.removeEventListener('click',      unlock)
      document.removeEventListener('keydown',    unlock)
      document.removeEventListener('touchstart', unlock)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])
  const musicTrack     = useSettingsStore((s) => s.musicTrack)

  // ── Music ─────────────────────────────────────────────────────────────────
  // Split into two effects: menu-phase music (no musicTrack dep) and playing-phase music
  useEffect(() => {
    if (!musicEnabled) { stopMusic(); return }
    if (phase === 'splash' || phase === 'title_screen' || phase === 'singleplayer_menu' || phase === 'multiplayer_menu' || phase === 'debug_menu' || phase === 'menu' || phase === 'character_select' || phase === 'game_modes' || phase === 'rules' || phase === 'map_select' || phase === 'missions' || phase === 'briefing' || phase === 'mutators' || phase === 'options' || phase === 'track_player' || phase === 'lobby' || phase === 'shop') {
      startMenuMusic()
    } else if (phase === 'skydive' || phase === 'skydive_v1' || phase === 'skydive_v3') {
      startSkydiveMusic()
    } else if (phase !== 'playing') {
      stopMusic()
    }
  }, [phase, musicEnabled])

  useEffect(() => {
    if (phase !== 'playing' || !musicEnabled) return
    if      (musicTrack === 'game2')  startGameMusic2()
    else if (musicTrack === 'game3')  startGameMusic3()
    else if (musicTrack === 'game4')  startGameMusic4()
    else if (musicTrack === 'game5')  startGameMusic5()
    else if (musicTrack === 'game6')  startGameMusic6()
    else if (musicTrack === 'game7')  startGameMusic7()
    else if (musicTrack === 'game8')  startGameMusic8()
    else if (musicTrack === 'game9')  startGameMusic9()
    else if (musicTrack === 'game10') startGameMusic10()
    else if (musicTrack === 'game11') startGameMusic11()
    else if (musicTrack === 'game12') startGameMusic12()
    else if (musicTrack === 'game13') startGameMusic13()
    else if (musicTrack === 'game14') startGameMusic14()
    else if (musicTrack === 'game15') startGameMusic15()
    else if (musicTrack === 'game16') startGameMusic16()
    else if (musicTrack === 'game17') startGameMusic17()
    else if (musicTrack === 'game18') startGameMusic18()
    else if (musicTrack === 'game19') startGameMusic19()
    else if (musicTrack === 'game20') startGameMusic20()
    else if (musicTrack === 'game21') startGameMusic21()
    else if (musicTrack === 'game22') startGameMusic22()
    else if (musicTrack === 'game23') startGameMusic23()
    else if (musicTrack === 'game24') startGameMusic24()
    else if (musicTrack === 'game25') startGameMusic25()
    else if (musicTrack === 'game26') startGameMusic26()
    else if (musicTrack === 'game27') startGameMusic27()
    else if (musicTrack === 'game28') startGameMusic28()
    else if (musicTrack === 'game29') startGameMusic29()
    else if (musicTrack === 'game30') startGameMusic30()
    else if (musicTrack === 'game31') startGameMusic31()
    else if (musicTrack === 'game32') startGameMusic32()
    else if (musicTrack === 'game33') startGameMusic33()
    else if (musicTrack === 'game34') startGameMusic34()
    else if (musicTrack === 'custom') {
      const url = customTracks.find((t) => t.id === customTrackId)?.url
      if (url) playCustomTrack(url)
      else startGameMusic()
    }
    else startGameMusic()
  }, [phase, musicEnabled, musicTrack, customTrackId, customTracks])

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
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
          filter: visualBT ? 'saturate(0.25) brightness(0.85)' : 'none',
          transition: 'filter 0.15s ease-out',
        }}>
          <Game />
        </div>
      )}

      {/* Bullet-time vignette */}
      {phase === 'playing' && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none',
          background: visualBT
            ? 'radial-gradient(ellipse at center, transparent 38%, rgba(0,60,160,0.45) 100%)'
            : 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,20,0.5) 100%)',
          transition: 'background 0.2s ease-out',
        }} />
      )}

      {/* Bullet-time scanlines */}
      {visualBT && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,100,220,0.04) 3px, rgba(0,100,220,0.04) 4px)',
          animation: 'btScanlines 8s linear infinite',
        }} />
      )}

      {/* FPS crosshair */}
      {phase === 'playing' && cameraMode === 'fps' && (
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
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(255,120,0,0.7) 0%, rgba(255,30,0,0.4) 50%, transparent 100%)',
          animation: 'btPulse 0.4s ease-out forwards',
          mixBlendMode: 'screen',
        }} />
      )}

      {phase === 'splash'                      && <SplashScreen />}
      {phase === 'title_screen'               && <TitleScreen />}
      {phase === 'singleplayer_menu'          && <SingleplayerMenu />}
      {phase === 'multiplayer_menu'           && <MultiplayerMenu />}
      {phase === 'debug_menu'                 && <DebugMenu />}
      {phase === 'playing'                    && <HUD />}
      {phase === 'playing' && paused          && <PauseMenu />}
      {phase === 'playing' && mobileControls  && <MobileControls />}
      {phase === 'playing' && isNetGame        && <ChatOverlay />}
      {phase === 'menu'                        && <MainMenu />}
      {phase === 'character_select'            && <CharacterSelectScreen />}
      {phase === 'game_modes'                  && <GameModesScreen />}
      {phase === 'rules'                       && <RulesScreen />}
      {phase === 'map_select'                  && <MapSelectScreen />}
      {phase === 'missions'                    && <MissionsMenu />}
      {phase === 'briefing'                    && <MissionBriefing />}
      {phase === 'cutscene'                    && <CutscenePlayer mode={useGameStore.getState().gameMode as import('./store/demoStore').CutsceneMode} onDone={() => useGameStore.getState().setPhase('briefing')} />}
      {phase === 'mutators'                    && <MutatorsScreen />}
      {phase === 'help'                        && <HelpScreen />}
      {phase === 'demo_viewer'                 && <DemoViewer />}
      {phase === 'options'                     && <OptionsScreen />}
      {phase === 'track_player'               && <TrackPlayer />}
      {phase === 'lobby'                       && <Lobby />}
      {phase === 'shop'                        && <Shop />}
      {phase === 'gameover'                    && <GameOver />}
      {phase === 'skydive_win'                 && <SkydiveWin />}
      {phase === 'skydive'                     && <Skydive />}
      {phase === 'skydive_v1'                  && <SkydiveV1 />}
      {phase === 'skydive_v3'                  && <SkydiveV3 />}
      {phase === 'editor'                      && <Editor />}

      {/* Fullscreen toggle — always visible top-right */}
      <div
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Vollbild beenden (Esc)' : 'Vollbild'}
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 200, opacity: 0.45, fontSize: 16,
          color: '#aaccff', userSelect: 'none', pointerEvents: 'auto',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.9' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.45' }}
      >
        {isFullscreen ? '✕' : '⛶'}
      </div>
    </div>
  )
}
