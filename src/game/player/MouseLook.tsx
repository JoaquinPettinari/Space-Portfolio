import { useEffect, useEffectEvent } from 'react'
import { useThree } from '@react-three/fiber'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

export function MouseLook({
  onLock,
  onUnlock,
}: {
  onLock: () => void
  onUnlock: () => void
}) {
  const { camera, gl } = useThree()
  const locked = useEffectEvent(onLock)
  const unlocked = useEffectEvent(onUnlock)

  useEffect(() => {
    const controls = new PointerLockControls(camera)
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
    const button = document.getElementById('enter-station')
    button?.addEventListener('click', enter)
    document.addEventListener('pointerlockchange', changed)
    return () => {
      disposed = true
      button?.removeEventListener('click', enter)
      document.removeEventListener('pointerlockchange', changed)
      if (controls.domElement) controls.dispose()
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock()
      }
    }
  }, [camera, gl])

  return null
}
