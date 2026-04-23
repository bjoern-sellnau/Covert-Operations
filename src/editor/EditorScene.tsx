import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useEditorStore, OBJECT_TYPE_CFGS, type LevelObject } from './editorStore'
import { Arena } from '../game/Arena'
import { ARENA_HALF } from '../game/types'
import { useInput } from '../game/useInput'

// ── Shared geometry / material cache ────────────────────────────────────────
const _boxGeo = new THREE.BoxGeometry(1, 1, 1)
const _cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16)
const _ringGeo = new THREE.RingGeometry(0.35, 0.5, 24)
const _selectedOutlineMat = new THREE.MeshBasicMaterial({ color: '#00ffff', wireframe: true })

// ── Single level object ──────────────────────────────────────────────────────
function EditorLevelObject({ obj }: { obj: LevelObject }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const { selectedObjectId, selectObject, toolMode, deleteObject } = useEditorStore()
  const isSelected = selectedObjectId === obj.id
  const cfg = OBJECT_TYPE_CFGS[obj.type]

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    if (toolMode === 'delete') {
      deleteObject(obj.id)
    } else {
      selectObject(obj.id)
    }
  }

  useFrame(() => {
    if (!matRef.current) return
    matRef.current.color.set(isSelected ? '#44aaff' : cfg.color)
    matRef.current.emissive.set(isSelected ? '#0044aa' : cfg.emissive)
  })

  const py = cfg.height / 2

  return (
    <group position={[obj.x, 0, obj.z]} rotation-y={obj.rotY} onPointerDown={handleClick}>
      <mesh
        ref={meshRef}
        scale={[obj.sx, cfg.height, obj.sz]}
        position={[0, py, 0]}
        geometry={cfg.isCylinder ? _cylGeo : _boxGeo}
        castShadow
      >
        <meshStandardMaterial ref={matRef} color={cfg.color} emissive={cfg.emissive} emissiveIntensity={0.4} roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Spawn ring marker */}
      {cfg.isSpawn && (
        <mesh geometry={_ringGeo} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
          <meshBasicMaterial color="#ff3333" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Selection outline */}
      {isSelected && (
        <mesh scale={[obj.sx * 1.04, cfg.height * 1.04, obj.sz * 1.04]} position={[0, py, 0]}
          geometry={cfg.isCylinder ? _cylGeo : _boxGeo} material={_selectedOutlineMat} />
      )}
    </group>
  )
}

// ── Main editor scene ────────────────────────────────────────────────────────
export function EditorScene() {
  const { camera, gl } = useThree()
  const input = useInput()

  const {
    viewMode, toolMode, placeType,
    getCurrentLevel, addObject, updateObject, selectObject, selectedObjectId,
  } = useEditorStore()

  const level = getCurrentLevel()

  const mouseDownScreen = useRef({ x: 0, y: 0 })
  const isDraggingObject = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plcRef = useRef<any>(null)

  // ── Camera setup on view mode change ───────────────────────────────────────
  useEffect(() => {
    if (viewMode === 'topdown') {
      camera.position.set(0, 22, 0.01)
      camera.lookAt(0, 0, 0)
    } else if (viewMode === 'perspective') {
      camera.position.set(12, 18, 18)
      camera.lookAt(0, 0, 0)
    } else if (viewMode === 'fps') {
      camera.position.set(0, 1.5, 0)
      camera.lookAt(0, 1.5, -1)
    }
  }, [viewMode, camera])

  // ── FPS movement in editor ─────────────────────────────────────────────────
  useFrame((state, delta) => {
    if (viewMode !== 'fps') return
    if (!plcRef.current?.isLocked) return

    const speed = 10
    const keys = input.current.keys
    const cam = state.camera
    const dir = new THREE.Vector3()
    cam.getWorldDirection(dir)
    dir.y = 0
    dir.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(dir, new THREE.Vector3(0, 1, 0))

    if (keys.has('KeyW') || keys.has('ArrowUp')) cam.position.addScaledVector(dir, speed * delta)
    if (keys.has('KeyS') || keys.has('ArrowDown')) cam.position.addScaledVector(dir, -speed * delta)
    if (keys.has('KeyA') || keys.has('ArrowLeft')) cam.position.addScaledVector(right, -speed * delta)
    if (keys.has('KeyD') || keys.has('ArrowRight')) cam.position.addScaledVector(right, speed * delta)

    cam.position.x = Math.max(-ARENA_HALF + 1, Math.min(ARENA_HALF - 1, cam.position.x))
    cam.position.z = Math.max(-ARENA_HALF + 1, Math.min(ARENA_HALF - 1, cam.position.z))
    cam.position.y = Math.max(0.5, Math.min(8, cam.position.y))
  })

  // ── Keyboard shortcuts for selected object ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const selId = useEditorStore.getState().selectedObjectId
      if (!selId) return
      const obj = useEditorStore.getState().getSelectedObject()
      if (!obj) return

      if (e.code === 'KeyR') {
        updateObject(selId, { rotY: obj.rotY + Math.PI / 4 })
      }
      if (e.code === 'Delete' || e.code === 'Backspace') {
        useEditorStore.getState().deleteObject(selId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [updateObject])

  // ── Ground plane events ────────────────────────────────────────────────────
  const handleGroundPointerDown = (e: { point: THREE.Vector3; clientX: number; clientY: number }) => {
    mouseDownScreen.current = { x: e.clientX, y: e.clientY }
    if (selectedObjectId) isDraggingObject.current = true
  }

  const handleGroundPointerMove = (e: { point: THREE.Vector3 }) => {
    if (!isDraggingObject.current || !selectedObjectId) return
    const snappedX = Math.round(e.point.x)
    const snappedZ = Math.round(e.point.z)
    updateObject(selectedObjectId, { x: snappedX, z: snappedZ })
  }

  const handleGroundPointerUp = (e: { point: THREE.Vector3; clientX: number; clientY: number }) => {
    isDraggingObject.current = false

    // Only place/deselect on a genuine click (not drag)
    const dx = e.clientX - mouseDownScreen.current.x
    const dy = e.clientY - mouseDownScreen.current.y
    if (Math.sqrt(dx * dx + dy * dy) > 6) return

    if (toolMode === 'place') {
      const snappedX = Math.round(e.point.x)
      const snappedZ = Math.round(e.point.z)
      const bound = ARENA_HALF - 1
      if (Math.abs(snappedX) <= bound && Math.abs(snappedZ) <= bound) {
        addObject(placeType, snappedX, snappedZ)
      }
    } else if (toolMode === 'select') {
      selectObject(null) // deselect when clicking empty ground
    }
  }

  return (
    <>
      {/* Camera controls */}
      {viewMode === 'topdown' && (
        <OrbitControls
          makeDefault
          enableRotate={false}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
          minDistance={5}
          maxDistance={40}
        />
      )}
      {viewMode === 'perspective' && (
        <OrbitControls
          makeDefault
          minDistance={3}
          maxDistance={50}
          maxPolarAngle={Math.PI * 0.85}
        />
      )}
      {viewMode === 'fps' && (
        <PointerLockControls
          ref={plcRef}
          domElement={gl.domElement}
        />
      )}

      {/* Lighting */}
      <ambientLight intensity={0.5} color="#aabbff" />
      <directionalLight position={[8, 20, 8]} intensity={1.0} color="#ffffff" castShadow />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#4466aa" distance={50} />

      {/* Arena */}
      <Arena />

      {/* Grid helper */}
      <gridHelper args={[ARENA_HALF * 2, ARENA_HALF * 2, '#1a2a3a', '#0e1a22']} position={[0, 0.01, 0]} />

      {/* Level objects */}
      {level?.objects.map((obj) => (
        <EditorLevelObject key={obj.id} obj={obj} />
      ))}

      {/* Invisible ground plane for raycasting */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0, 0]}
        onPointerDown={handleGroundPointerDown as never}
        onPointerMove={handleGroundPointerMove as never}
        onPointerUp={handleGroundPointerUp as never}
        visible={false}
        renderOrder={-1}
      >
        <planeGeometry args={[ARENA_HALF * 2, ARENA_HALF * 2]} />
        <meshBasicMaterial />
      </mesh>
    </>
  )
}
