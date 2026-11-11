import { useEffect, useRef } from 'react'
import {
  CuboidCollider,
  RigidBody,
  useBeforePhysicsStep,
  type RapierRigidBody,
} from '@react-three/rapier'
import { Quaternion, Vector3 } from 'three'
import {
  advanceBulkheadElapsed,
  nextBulkheadPhase,
  BULKHEAD_OPEN_SECONDS,
  type BulkheadPhase,
} from './bulkhead'
import { ENTRY_DOCKING_DEPTH } from './entryLayout'
export const DOCKING_HATCH_Z = ENTRY_DOCKING_DEPTH
/** Independent docking door; same timing/phase rules, no power or mission gate. */
export function DockingHatch({
  phase,
  onPhaseChange,
}: {
  phase: BulkheadPhase
  onPhaseChange?: (phase: BulkheadPhase) => void
}) {
  const left = useRef<RapierRigidBody>(null),
    right = useRef<RapierRigidBody>(null)
  const elapsed = useRef(0),
    notified = useRef(false),
    reduced = useRef(false)
  const axis = useRef(new Vector3(0, 1, 0)),
    rotation = useRef(new Quaternion())
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reduced.current = query.matches
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useBeforePhysicsStep((world) => {
    if (phase !== 'opening' || document.hidden) return
    elapsed.current = advanceBulkheadElapsed(
      phase,
      elapsed.current,
      world.timestep,
      reduced.current,
    )
    const t = Math.min(1, elapsed.current / BULKHEAD_OPEN_SECONDS),
      angle = (t * t * (3 - 2 * t) * Math.PI) / 2
    left.current?.setNextKinematicRotation(
      rotation.current.setFromAxisAngle(axis.current, -angle),
    )
    right.current?.setNextKinematicRotation(
      rotation.current.setFromAxisAngle(axis.current, angle),
    )
    if (
      nextBulkheadPhase(phase, elapsed.current) === 'open' &&
      !notified.current
    ) {
      notified.current = true
      onPhaseChange?.('open')
    }
  })
  return (
    <group name="docking-hatch">
      {([-1, 1] as const).map((side) => (
        <RigidBody
          key={side}
          ref={side < 0 ? left : right}
          type="kinematicPosition"
          colliders={false}
          position={[side * 1.2, 1.25, DOCKING_HATCH_Z]}
          rotation={[0, phase === 'open' ? (side * Math.PI) / 2 : 0, 0]}
          userData={{ interaction: phase === 'open' ? undefined : 'docking' }}
        >
          <CuboidCollider
            args={[0.6, 1.25, 0.08]}
            position={[-side * 0.6, 0, 0]}
          />
          <mesh
            name={side < 0 ? 'docking-left-leaf' : 'docking-right-leaf'}
            position={[-side * 0.6, 0, 0]}
          >
            <boxGeometry args={[1.2, 2.5, 0.16]} />
            <meshStandardMaterial
              color="#b1b0a6"
              metalness={0.4}
              roughness={0.55}
            />
          </mesh>
          <mesh position={[-side * 0.6, 0, 0.09]}>
            <boxGeometry args={[0.9, 2.1, 0.03]} />
            <meshStandardMaterial color="#29343c" />
          </mesh>
          <mesh position={[-side * 1.1, 0, 0.12]}>
            <boxGeometry args={[0.025, 1.8, 0.02]} />
            <meshBasicMaterial color="#7cd6df" />
          </mesh>
        </RigidBody>
      ))}
    </group>
  )
}
