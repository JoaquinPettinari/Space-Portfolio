import { useEffect, useRef } from 'react'
import {
  CuboidCollider,
  RigidBody,
  useBeforePhysicsStep,
  type RapierRigidBody,
} from '@react-three/rapier'
import type { Mesh } from 'three'
import {
  advanceBulkheadElapsed,
  bulkheadLeafOffset,
  nextBulkheadPhase,
  BULKHEAD_DEPTH,
  BULKHEAD_LEAF_HALF_WIDTH,
  BULKHEAD_UNLOCK_SECONDS,
  type BulkheadPhase,
} from './bulkhead'

const bulkheadInteraction = { interaction: 'bulkhead' }

/** The existing doorway is retained. Leaves slide behind the bulkhead wall,
 * keeping the relocated Crew Access terminal in front of the moving pocket. */
export function Bulkhead({
  phase,
  onPhaseChange,
}: {
  phase: BulkheadPhase
  onPhaseChange: (phase: BulkheadPhase) => void
}) {
  const left = useRef<RapierRigidBody>(null)
  const right = useRef<RapierRigidBody>(null)
  const latch = useRef<Mesh>(null)
  const reduced = useRef(false)
  const motion = useRef({ lastPhase: phase, elapsed: 0, notified: false })
  const leftPosition = useRef({
    x: -BULKHEAD_LEAF_HALF_WIDTH,
    y: 1.65,
    z: BULKHEAD_DEPTH,
  })
  const rightPosition = useRef({
    x: BULKHEAD_LEAF_HALF_WIDTH,
    y: 1.65,
    z: BULKHEAD_DEPTH,
  })
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
    if (!left.current || !right.current || document.hidden) return
    if (phase === 'closed' || phase === 'open') return
    const state = motion.current
    if (state.lastPhase !== phase) {
      state.lastPhase = phase
      state.elapsed = 0
      state.notified = false
    }
    state.elapsed = advanceBulkheadElapsed(
      phase,
      state.elapsed,
      world.timestep,
      reduced.current,
    )
    const offset = bulkheadLeafOffset(phase, state.elapsed)
    leftPosition.current.x = -BULKHEAD_LEAF_HALF_WIDTH - offset
    rightPosition.current.x = BULKHEAD_LEAF_HALF_WIDTH + offset
    left.current.setNextKinematicTranslation(leftPosition.current)
    right.current.setNextKinematicTranslation(rightPosition.current)
    if (latch.current) {
      const retraction =
        phase === 'unlocking' ? state.elapsed / BULKHEAD_UNLOCK_SECONDS : 0
      latch.current.position.z = BULKHEAD_DEPTH + 0.14 - retraction * 0.14
    }
    const next = nextBulkheadPhase(phase, state.elapsed)
    if (next !== phase && !state.notified) {
      state.notified = true
      onPhaseChange(next)
    }
  })

  const status = phase === 'open' ? '#83e5b4' : '#e4ba74'
  return (
    <group name="animated-bulkhead">
      {([-1, 1] as const).map((side) => (
        <RigidBody
          key={side}
          ref={side === -1 ? left : right}
          type="kinematicPosition"
          colliders={false}
          friction={0}
          position={[
            side * (BULKHEAD_LEAF_HALF_WIDTH + bulkheadLeafOffset(phase, 0)),
            1.65,
            BULKHEAD_DEPTH,
          ]}
          userData={bulkheadInteraction}
        >
          <CuboidCollider args={[BULKHEAD_LEAF_HALF_WIDTH, 1.65, 0.1]} />
          <mesh
            name={side === -1 ? 'bulkhead-left-leaf' : 'bulkhead-right-leaf'}
          >
            <boxGeometry args={[1.25, 3.3, 0.2]} />
            <meshStandardMaterial
              color="#35556c"
              emissive="#173b50"
              emissiveIntensity={0.35}
              roughness={0.65}
            />
          </mesh>
          {([-1, 1] as const).map((face) => (
            <group key={face} position={[0, 0, face * 0.108]}>
              <mesh>
                <boxGeometry args={[1.05, 2.94, 0.012]} />
                <meshStandardMaterial
                  color="#293b49"
                  metalness={0.4}
                  roughness={0.6}
                />
              </mesh>
              <mesh position={[side * 0.47, 0, face * 0.01]}>
                <boxGeometry args={[0.025, 2.8, 0.012]} />
                <meshBasicMaterial color={status} />
              </mesh>
            </group>
          ))}
        </RigidBody>
      ))}
      {(phase === 'closed' || phase === 'unlocking') && (
        <mesh
          ref={latch}
          position={[0, 1.65, BULKHEAD_DEPTH + 0.14]}
          userData={bulkheadInteraction}
        >
          <boxGeometry args={[0.32, 0.12, 0.06]} />
          <meshStandardMaterial
            color="#bcc5c5"
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      )}
      <mesh position={[0, 3.35, 5.27]}>
        <boxGeometry args={[1.05, 0.04, 0.015]} />
        <meshBasicMaterial color={status} />
      </mesh>
    </group>
  )
}
