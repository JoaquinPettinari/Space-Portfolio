import { useEffect, useEffectEvent, useRef, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

export function MouseLook({
  onLock,
  onUnlock,
  enabled,
  canCapture = true,
  captureRef,
}: {
  onLock: () => void
  onUnlock: () => void
  enabled: boolean
  canCapture?: boolean
  captureRef: RefObject<(() => void) | null>
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
      if (pending || disposed || document.pointerLockElement === gl.domElement)
        return
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
    // Called synchronously by the UI's close gesture (click, T or E).
    // Waiting for a render/camera animation could lose browser activation.
    captureRef.current = () => {
      void enter()
    }
    const click = (event: MouseEvent) => {
      const target = event.target
      if (
        (target === gl.domElement && captureAllowed()) ||
        (target instanceof Element && target.closest('#enter-station'))
      ) {
        if (!document.pointerLockElement) void enter()
      }
    }
    document.addEventListener('click', click)
    document.addEventListener('pointerlockchange', changed)
    return () => {
      disposed = true
      captureRef.current = null
      controlsRef.current = null
      document.removeEventListener('click', click)
      document.removeEventListener('pointerlockchange', changed)
      if (controls.domElement) controls.dispose()
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock()
      }
    }
  }, [camera, gl, captureRef])

  return null
}
