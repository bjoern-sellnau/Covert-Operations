import { Canvas } from '@react-three/fiber'
import { EditorScene } from './EditorScene'
import { EditorHUD } from './EditorHUD'

export function Editor() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#06060e' }}>
      <Canvas
        shadows
        gl={{ antialias: true }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <EditorScene />
      </Canvas>
      <EditorHUD />
    </div>
  )
}
