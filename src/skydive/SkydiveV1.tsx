import { Canvas } from '@react-three/fiber'
import { SkydiveSceneV1 } from './SkydiveSceneV1'
import { SkydiveHUD } from '../components/SkydiveHUD'
import { SkyMobileControls } from './SkyMobileControls'
import { useSettingsStore } from '../store/settingsStore'

export function SkydiveV1() {
  const mobileControls = useSettingsStore((s) => s.mobileControls)
  return (
    <>
      <Canvas camera={{ fov: 52 }}>
        <SkydiveSceneV1 />
      </Canvas>
      <SkydiveHUD />
      {mobileControls && <SkyMobileControls />}
    </>
  )
}
