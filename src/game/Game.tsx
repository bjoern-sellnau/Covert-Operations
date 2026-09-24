import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useSettingsStore } from '../store/settingsStore'
import { GameScene } from './GameScene'

const MIN_DYNAMIC_DPR = 0.5

export function Game() {
  const quality           = useSettingsStore((s) => s.graphicsQuality)
  const dynamicResolution = useSettingsStore((s) => s.dynamicResolution)
  const maxDpr  = quality === 'low' ? 0.75 : quality === 'medium' ? 1 : Math.min(window.devicePixelRatio, 2)
  const shadows = quality !== 'low'

  // Dynamic resolution: PerformanceMonitor lowers/raises factor (0–1) based on measured FPS,
  // DPR is scaled between MIN_DYNAMIC_DPR and the quality-level maximum.
  const [factor, setFactor] = useState(1)
  const dpr = dynamicResolution
    ? Math.round((MIN_DYNAMIC_DPR + (maxDpr - MIN_DYNAMIC_DPR) * factor) * 100) / 100
    : maxDpr

  return (
    <Canvas
      camera={{ fov: 50 }}
      dpr={dpr}
      shadows={shadows}
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {dynamicResolution && <PerformanceMonitor factor={1} onChange={({ factor }) => setFactor(factor)} />}
      <GameScene />
    </Canvas>
  )
}
