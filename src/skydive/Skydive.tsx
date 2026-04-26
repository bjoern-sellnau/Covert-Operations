import { Canvas } from '@react-three/fiber'
import { SkydiveScene } from './SkydiveScene'
import { SkydiveHUD } from '../components/SkydiveHUD'
import { SkyMobileControls } from './SkyMobileControls'
import { useSettingsStore } from '../store/settingsStore'

export function Skydive() {
  const mobileControls = useSettingsStore((s) => s.mobileControls)
  return (
    <>
      <Canvas camera={{ fov: 52 }}>
        <SkydiveScene />
      </Canvas>
      <SkydiveHUD />
      {mobileControls && <SkyMobileControls />}
    </>
  )
}
