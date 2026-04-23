import { useGameStore } from './store/gameStore'
import { Game } from './game/Game'
import { HUD } from './components/HUD'
import { MainMenu } from './components/MainMenu'
import { GameOver } from './components/GameOver'
import { Shop } from './components/Shop'

export function App() {
  const phase = useGameStore((s) => s.phase)
  const isBulletTime = useGameStore((s) => s.isBulletTime)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Canvas — filter for bullet-time desaturation */}
      <div style={{
        position: 'absolute', inset: 0,
        filter: isBulletTime ? 'saturate(0.25) brightness(0.85)' : 'none',
        transition: 'filter 0.15s ease-out',
      }}>
        <Game />
      </div>

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

      {phase === 'playing' && <HUD />}
      {phase === 'menu' && <MainMenu />}
      {phase === 'shop' && <Shop />}
      {phase === 'gameover' && <GameOver />}
    </div>
  )
}
