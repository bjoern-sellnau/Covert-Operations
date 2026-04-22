import { useGameStore } from './store/gameStore'
import { Game } from './game/Game'
import { HUD } from './components/HUD'
import { MainMenu } from './components/MainMenu'
import { GameOver } from './components/GameOver'

export function App() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Canvas always mounted — game loop is gated by phase inside GameScene */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Game />
      </div>

      {phase === 'playing' && <HUD />}
      {phase === 'menu' && <MainMenu />}
      {phase === 'gameover' && <GameOver />}
    </div>
  )
}
