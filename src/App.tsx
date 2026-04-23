import { useGameStore } from './store/gameStore'
import { Game } from './game/Game'
import { HUD } from './components/HUD'
import { MainMenu } from './components/MainMenu'
import { GameOver } from './components/GameOver'
import { Shop } from './components/Shop'
import { Editor } from './editor/Editor'
import { Skydive } from './skydive/Skydive'
import { SkydiveWin } from './components/SkydiveWin'

export function App() {
  const phase        = useGameStore((s) => s.phase)
  const isBulletTime = useGameStore((s) => s.isBulletTime)
  const fpsMode      = useGameStore((s) => s.fpsMode)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Arena game canvas (always mounted, gated by phase in GameScene) */}
      <div style={{
        position: 'absolute', inset: 0,
        filter: isBulletTime ? 'saturate(0.25) brightness(0.85)' : 'none',
        transition: 'filter 0.15s ease-out',
        display: (phase === 'playing' || phase === 'gameover') ? 'block' : 'none',
      }}>
        <Game />
      </div>

      {/* Editor canvas */}
      {phase === 'editor' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <Editor />
        </div>
      )}

      {/* Skydive canvas */}
      {phase === 'skydive' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <Skydive />
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

      {phase === 'playing'     && <HUD />}
      {phase === 'menu'        && <MainMenu />}
      {phase === 'shop'        && <Shop />}
      {phase === 'gameover'    && <GameOver />}
      {phase === 'skydive_win' && <SkydiveWin />}
    </div>
  )
}
