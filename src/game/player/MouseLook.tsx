import { useEffect, useEffectEvent, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

export function MouseLook({
  onLock,
  onUnlock,
  enabled,
  canCapture = true,
}: {
  onLock: () => void
  onUnlock: () => void
  enabled: boolean
  canCapture?: boolean
}) {
  const { camera, gl } = useThree()
  const locked = useEffectEvent(onLock)
  const unlocked = useEffectEvent(onUnlock)
  const controlsRef = useRef<PointerLockControls | null>(null)
  useEffect(() => {
    if (controlsRef.current) controlsRef.current.enabled = enabled
  }, [enabled])
  const isEnabled = useEffectEvent(() => enabled)
  const captureAllowed = useEffectEvent(() => canCapture)

  useEffect(() => {
    const controls = new PointerLockControls(camera)
    controlsRef.current = controls
    controls.enabled = isEnabled()
    controls.minPolarAngle = 0.1
    controls.maxPolarAngle = Math.PI - 0.1
    const changed = () => {
      if (document.pointerLockElement === gl.domElement) {
        // Connect only after capture succeeds; a rejected raw-input attempt
        // must not be reported by Three as a terminal controls error.
        if (!controls.isLocked) controls.connect(gl.domElement)
        controls.isLocked = true
        locked()
      } else if (controls.isLocked) {
        controls.disconnect()
        controls.isLocked = false
        unlocked()
      }
    }
    let disposed = false
    let pending = false
    const enter = async () => {
      if (pending) return
      pending = true
      try {
        // Raw input avoids OS mouse acceleration when supported.
        await gl.domElement.requestPointerLock({ unadjustedMovement: true })
      } catch (error) {
        if (
          !disposed &&
          error instanceof DOMException &&
          error.name === 'NotSupportedError'
        ) {
          try {
            await gl.domElement.requestPointerLock()
          } catch {
            // Game handles the browser's pointerlockerror event.
          }
        }
      } finally {
        pending = false
      }
    }
    const click = (event: MouseEvent) => {
      const target = event.target
      if (
        (target === gl.domElement && captureAllowed()) ||
        (target instanceof Element && target.closest('[data-capture-pointer]'))
      ) {
        if (!document.pointerLockElement) void enter()
      }
    }
    document.addEventListener('click', click)
    document.addEventListener('pointerlockchange', changed)
    return () => {
      disposed = true
      controlsRef.current = null
      document.removeEventListener('click', click)
      document.removeEventListener('pointerlockchange', changed)
      if (controls.domElement) controls.dispose()
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock()
      }
    }
  }, [camera, gl])

  return null
}
