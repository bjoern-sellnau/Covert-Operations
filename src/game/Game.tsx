import { Canvas } from '@react-three/fiber'
import { useSettingsStore } from '../store/settingsStore'
import { GameScene } from './GameScene'

export function Game() {
  const quality = useSettingsStore((s) => s.graphicsQuality)
  const dpr     = quality === 'low' ? 0.75 : quality === 'medium' ? 1 : Math.min(window.devicePixelRatio, 2)
  const shadows = quality !== 'low'

  return (
    <Canvas
      camera={{ fov: 50 }}
      dpr={dpr}
      shadows={shadows}
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <GameScene />
    </Canvas>
  )
}
