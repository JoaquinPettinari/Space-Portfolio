import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'

/** Readiness includes committed physics, compiled shaders and an actual draw.
 * App keeps the entire game invisible while the independent video covers it. */
export function InteriorReady({
  active,
  onReady,
}: {
  active: boolean
  onReady: (ready: boolean) => void
}) {
  const { gl, scene, camera } = useThree()
  const { world } = useRapier()
  const compiled = useRef(false)
  const drawn = useRef(false)
  const notified = useRef(false)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    if (!active) return
    let disposed = false
    compiled.current = drawn.current = notified.current = false
    void gl
      .compileAsync(scene, camera)
      .then(() => {
        if (!disposed) compiled.current = true
      })
      .catch((reason: unknown) => {
        if (!disposed)
          setError(
            reason instanceof Error
              ? reason
              : new Error('Interior preparation failed'),
          )
      })
    return () => {
      disposed = true
      onReady(false)
    }
  }, [active, gl, scene, camera, onReady])
  useFrame(() => {
    if (
      !active ||
      !compiled.current ||
      notified.current ||
      !world.bodies.len() ||
      !world.colliders.len()
    )
      return
    if (!drawn.current) {
      gl.render(scene, camera)
      drawn.current = true
      return
    }
    notified.current = true
    onReady(true)
  })
  if (error) throw error
  return null
}
