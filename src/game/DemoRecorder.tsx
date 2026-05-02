import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { entityStore } from './entityStore'
import { useDemoStore, type DemoFrame } from '../store/demoStore'

const SAMPLE_MS = 50  // record at 20 fps

export function DemoRecorder() {
  const frames     = useRef<DemoFrame[]>([])
  const startTime  = useRef(0)
  const wasActive  = useRef(false)

  useFrame(() => {
    const { isRecording, finishRecording } = useDemoStore.getState()

    // Transition: started
    if (isRecording && !wasActive.current) {
      frames.current  = []
      startTime.current = performance.now()
      wasActive.current = true
    }

    // Transition: stopped
    if (!isRecording && wasActive.current) {
      wasActive.current = false
      const es = entityStore
      finishRecording(frames.current, es.score, es.wave, performance.now() - startTime.current)
      return
    }

    if (!isRecording) return

    // Throttle to SAMPLE_MS
    const elapsed = performance.now() - startTime.current
    const last = frames.current[frames.current.length - 1]
    if (last && elapsed - last.t < SAMPLE_MS) return

    const es = entityStore
    frames.current.push({
      t:   elapsed,
      px:  es.player.position.x,
      pz:  es.player.position.y,
      pa:  es.player.angle,
      php: es.player.health,
      e:   Array.from(es.enemies.values()).map(e => ({
        id: e.id, x: e.position.x, z: e.position.y, tp: e.type,
      })),
      s:   es.score,
      w:   es.wave,
    })
  })

  return null
}
