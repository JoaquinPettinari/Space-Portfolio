import { useReducedMotionRef } from '../useReducedMotionRef'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import { sampleShuttleRoute } from './shuttleRoute'
import { advanceExteriorTime } from './asterionMotion'
import { createCourierModel } from './courierModel'

/** A distant maintenance shuttle: geometry and emissive engines, no extra lights. */
export function DistantShip({ paused }: { paused: boolean }) {
  const ship = useRef<Group>(null)
  const elapsed = useRef(0)
  const tangent = useRef(new Vector3())
  const reducedMotion = useReducedMotionRef()
  const model = useMemo(() => createCourierModel(), [])
  const forward = useMemo(() => new Vector3(1, 0, 0), [])
  useEffect(() => () => model.dispose(), [model])
  useFrame((_, delta) => {
    if (!ship.current) return
    const next = advanceExteriorTime(
      elapsed.current,
      delta,
      paused || reducedMotion.current || document.hidden,
    )
    if (next === elapsed.current) return
    elapsed.current = next
    sampleShuttleRoute(
      elapsed.current * 0.025,
      ship.current.position,
      tangent.current,
    )
    ship.current.quaternion.setFromUnitVectors(
      forward,
      tangent.current.normalize(),
    )
    ship.current.rotateX(0.08 * Math.sin(next * 0.025))
  })
  return (
    <group ref={ship} name="orbital-shuttle" position={[0, 7, -26]}>
      <primitive object={model.root} dispose={null} />
    </group>
  )
}
