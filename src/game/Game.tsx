import { Canvas } from '@react-three/fiber'
import { GameScene } from './GameScene'

export function Game() {
  return (
    <Canvas
      shadows
      gl={{ antialias: true }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <GameScene />
    </Canvas>
  )
}
