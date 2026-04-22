import { Canvas } from '@react-three/fiber'
import { GameScene } from './GameScene'

export function Game() {
  return (
    <Canvas
      shadows
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <GameScene />
    </Canvas>
  )
}
