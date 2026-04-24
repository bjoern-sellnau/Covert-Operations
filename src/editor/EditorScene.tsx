import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useEditorStore, OBJECT_TYPE_CFGS, type LevelObject } from './editorStore'
import type { ScriptEntity } from './scriptTypes'
import { ENTITY_CFG } from './scriptTypes'
import { Arena } from '../game/Arena'
import { ARENA_HALF } from '../game/types'
import { useInput } from '../game/useInput'
import { getObjectTexture, DEFAULT_TEXTURE, type TextureKey } from '../game/textures'

// ── Shared geometry ───────────────────────────────────────────────────────────
const _boxGeo             = new THREE.BoxGeometry(1, 1, 1)
const _cylGeo             = new THREE.CylinderGeometry(0.5, 0.5, 1, 16)
const _ringGeo            = new THREE.RingGeometry(0.35, 0.5, 24)
const _planeGeo           = new THREE.PlaneGeometry(1, 1)
const _selectedOutlineMat = new THREE.MeshBasicMaterial({ color: '#00ffff', wireframe: true })

// ── Single level object ──────────────────────────────────────────────────────
function EditorLevelObject({ obj }: { obj: LevelObject }) {
  const matRef  = useRef<THREE.MeshStandardMaterial>(null)
  const { selectedObjectId, selectObject, toolMode, deleteObject } = useEditorStore()
  const isSelected = selectedObjectId === obj.id
  const cfg = OBJECT_TYPE_CFGS[obj.type]

  const material = useMemo(() => {
    if (cfg.isSpawn) return null
    const key = (obj.textureKey as TextureKey | undefined) ?? DEFAULT_TEXTURE[obj.type]
    const map = getObjectTexture(key, obj.sx, obj.sz)
    const isMetal = key === 'metal' || key === 'metal_grid'
    return new THREE.MeshStandardMaterial({
      map,
      color:             new THREE.Color(cfg.color),
      emissive:          new THREE.Color(cfg.emissive),
      emissiveIntensity: 0.35,
      roughness:         isMetal ? 0.35 : 0.7,
      metalness:         isMetal ? 0.55 : 0.15,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obj.type, obj.sx, obj.sz, obj.textureKey])

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    if (toolMode === 'delete') deleteObject(obj.id)
    else selectObject(obj.id)
  }

  useFrame(() => {
    if (!matRef.current) return
    matRef.current.color.set(isSelected ? '#88ccff' : cfg.color)
    matRef.current.emissive.set(isSelected ? '#0044aa' : cfg.emissive)
    matRef.current.emissiveIntensity = isSelected ? 0.6 : 0.35
  })

  const py = cfg.height / 2
  return (
    <group position={[obj.x, 0, obj.z]} rotation-y={obj.rotY} onPointerDown={handleClick}>
      <mesh
        ref={(m) => { if (m && material) { m.material = material; (matRef as React.MutableRefObject<THREE.MeshStandardMaterial | null>).current = material } }}
        scale={[obj.sx, cfg.height, obj.sz]}
        position={[0, py, 0]}
        geometry={cfg.isCylinder ? _cylGeo : _boxGeo}
        castShadow
      >
        {!material && <meshStandardMaterial color={cfg.color} emissive={cfg.emissive} emissiveIntensity={0.4} roughness={0.6} metalness={0.3} />}
      </mesh>

      {cfg.isSpawn && (
        <mesh geometry={_ringGeo} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
          <meshBasicMaterial color="#ff3333" side={THREE.DoubleSide} />
        </mesh>
      )}

      {isSelected && (
        <mesh scale={[obj.sx * 1.04, cfg.height * 1.04, obj.sz * 1.04]} position={[0, py, 0]}
          geometry={cfg.isCylinder ? _cylGeo : _boxGeo} material={_selectedOutlineMat} />
      )}
    </group>
  )
}

// ── Script entity overlay ────────────────────────────────────────────────────

function ScriptEntityOverlay({ entity }: { entity: ScriptEntity }) {
  const { selectedScriptId, selectScriptEntity, toolMode, deleteScriptEntity } = useEditorStore()
  const isSelected = selectedScriptId === entity.id
  const cfg = ENTITY_CFG[entity.type]
  const color = new THREE.Color(cfg.color)

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    if (toolMode === 'delete') deleteScriptEntity(entity.id)
    else selectScriptEntity(isSelected ? null : entity.id)
  }

  // Determine size for the zone visualization
  let w = 1, d = 1
  if ('w' in entity) w = (entity as { w: number }).w
  if ('d' in entity) d = (entity as { d: number }).d

  const y = 0.05

  return (
    <group position={[entity.x, 0, entity.z]} onPointerDown={handleClick}>
      {/* Zone fill */}
      <mesh
        geometry={_planeGeo}
        rotation-x={-Math.PI / 2}
        position={[0, y, 0]}
        scale={[w, d, 1]}
        renderOrder={1}
      >
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.25 : 0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Zone border */}
      <lineSegments position={[0, y + 0.01, 0]} renderOrder={2}>
        <edgesGeometry args={[new THREE.PlaneGeometry(w, d)]} />
        <lineBasicMaterial color={color} transparent opacity={isSelected ? 1 : 0.5} />
      </lineSegments>

      {/* Icon billboard — small cylinder marker */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation-x={-Math.PI / 2} position={[0, y + 0.03, 0]}>
          <ringGeometry args={[Math.max(w, d) * 0.5 + 0.1, Math.max(w, d) * 0.5 + 0.3, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Door-specific: draw a thin panel */}
      {entity.type === 'door' && (
        <mesh
          position={[0, 1.1, 0]}
          rotation-y={entity.angle}
          scale={[entity.w, 2.2, 0.15]}
        >
          <boxGeometry />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
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
    addScriptEntity, selectScriptEntity, scriptPlaceType, setScriptPlaceType,
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

    if (keys.has('KeyW') || keys.has('ArrowUp'))    cam.position.addScaledVector(dir, speed * delta)
    if (keys.has('KeyS') || keys.has('ArrowDown'))  cam.position.addScaledVector(dir, -speed * delta)
    if (keys.has('KeyA') || keys.has('ArrowLeft'))  cam.position.addScaledVector(right, -speed * delta)
    if (keys.has('KeyD') || keys.has('ArrowRight')) cam.position.addScaledVector(right, speed * delta)

    cam.position.x = Math.max(-ARENA_HALF + 1, Math.min(ARENA_HALF - 1, cam.position.x))
    cam.position.z = Math.max(-ARENA_HALF + 1, Math.min(ARENA_HALF - 1, cam.position.z))
    cam.position.y = Math.max(0.5, Math.min(8, cam.position.y))
  })

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const state = useEditorStore.getState()

      // Handle selected level object
      if (state.selectedObjectId) {
        const obj = state.getSelectedObject()
        if (!obj) return
        if (e.code === 'KeyR') state.updateObject(state.selectedObjectId, { rotY: obj.rotY + Math.PI / 4 })
        if (e.code === 'Delete' || e.code === 'Backspace') state.deleteObject(state.selectedObjectId)
      }

      // Handle selected script entity
      if (state.selectedScriptId) {
        if (e.code === 'Delete' || e.code === 'Backspace') state.deleteScriptEntity(state.selectedScriptId)
      }

      // Escape cancels script placement
      if (e.code === 'Escape') state.setScriptPlaceType(null)
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
    updateObject(selectedObjectId, { x: Math.round(e.point.x), z: Math.round(e.point.z) })
  }

  const handleGroundPointerUp = (e: { point: THREE.Vector3; clientX: number; clientY: number }) => {
    isDraggingObject.current = false

    const dx = e.clientX - mouseDownScreen.current.x
    const dy = e.clientY - mouseDownScreen.current.y
    if (Math.sqrt(dx * dx + dy * dy) > 6) return

    const snappedX = Math.round(e.point.x)
    const snappedZ = Math.round(e.point.z)
    const bound = ARENA_HALF - 1

    if (scriptPlaceType) {
      // Place a script entity
      if (Math.abs(snappedX) <= bound && Math.abs(snappedZ) <= bound) {
        addScriptEntity(scriptPlaceType, snappedX, snappedZ)
        setScriptPlaceType(null) // one-shot placement
      }
      return
    }

    if (toolMode === 'place') {
      if (Math.abs(snappedX) <= bound && Math.abs(snappedZ) <= bound) {
        addObject(placeType, snappedX, snappedZ)
      }
    } else if (toolMode === 'select') {
      selectObject(null)
      selectScriptEntity(null)
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
        <PointerLockControls ref={plcRef} domElement={gl.domElement} />
      )}

      {/* Lighting */}
      <ambientLight intensity={0.5} color="#aabbff" />
      <directionalLight position={[8, 20, 8]} intensity={1.0} color="#ffffff" castShadow />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#4466aa" distance={50} />

      <Arena />

      <gridHelper args={[ARENA_HALF * 2, ARENA_HALF * 2, '#1a2a3a', '#0e1a22']} position={[0, 0.01, 0]} />

      {/* Level objects */}
      {level?.objects.map((obj) => (
        <EditorLevelObject key={obj.id} obj={obj} />
      ))}

      {/* Script entity overlays */}
      {level?.scriptEntities?.map((entity) => (
        <ScriptEntityOverlay key={entity.id} entity={entity} />
      ))}

      {/* Ground plane for raycasting */}
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
