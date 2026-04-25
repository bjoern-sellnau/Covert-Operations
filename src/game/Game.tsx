import { Canvas } from '@react-three/fiber'
import { GameScene } from './GameScene'

const mob = typeof window !== 'undefined' && window.innerWidth < 768

export function Game() {
  return (
    <Canvas
      shadows={!mob}
      gl={{ antialias: !mob, powerPreference: 'high-performance' }}
      dpr={mob ? 1 : [1, 2]}
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <GameScene />
    </Canvas>
  )
}
