import { Canvas } from '@react-three/fiber'
import { SkydiveScene } from './SkydiveScene'
import { SkydiveHUD } from '../components/SkydiveHUD'

export function Skydive() {
  return (
    <>
      <Canvas camera={{ fov: 52 }}>
        <SkydiveScene />
      </Canvas>
      <SkydiveHUD />
    </>
  )
}
