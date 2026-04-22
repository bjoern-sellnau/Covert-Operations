import { useEffect, useRef } from 'react'

export interface InputState {
  keys: Set<string>
  mouseButtons: Set<number>
}

export function useInput() {
  const input = useRef<InputState>({ keys: new Set(), mouseButtons: new Set() })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      input.current.keys.add(e.code)
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => input.current.keys.delete(e.code)
    const onMouseDown = (e: MouseEvent) => input.current.mouseButtons.add(e.button)
    const onMouseUp = (e: MouseEvent) => input.current.mouseButtons.delete(e.button)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return input
}
