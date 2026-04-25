import { Canvas } from '@react-three/fiber'
import { GameScene } from './GameScene'

export function Game() {
  return (
    <Canvas
      camera={{ fov: 50 }}
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <GameScene />
    </Canvas>
  )
}
