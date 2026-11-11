import { useEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import {
  CuboidCollider,
  RigidBody,
  useBeforePhysicsStep,
  type RapierRigidBody,
} from '@react-three/rapier'
import {
  advanceBulkheadElapsed,
  bulkheadLeafOffset,
  nextBulkheadPhase,
  BULKHEAD_DEPTH,
  type BulkheadPhase,
} from './bulkhead'
import { prepareBulkhead } from './bulkheadAsset'

const interaction = { interaction: 'bulkhead' }

export function Bulkhead({
  phase,
  powered,
  onPhaseChange,
}: {
  phase: BulkheadPhase
  powered: boolean
  onPhaseChange: (phase: BulkheadPhase) => void
}) {
  const { scene } = useGLTF('/models/cruz-del-sur-sliding-bulkhead.glb')
  const model = useMemo(() => prepareBulkhead(scene), [scene])
  const left = useRef<RapierRigidBody>(null)
  const right = useRef<RapierRigidBody>(null)
  const reduced = useRef(false)
  const motion = useRef({ lastPhase: phase, elapsed: 0, notified: false })
  const leftPosition = useRef({ x: 0, y: -0.18, z: BULKHEAD_DEPTH })
  const rightPosition = useRef({ x: 0, y: -0.18, z: BULKHEAD_DEPTH })
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reduced.current = query.matches
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    for (const material of model.indicators) {
      material.color.set(
        !powered ? '#d53c32' : phase === 'closed' ? '#e8ad70' : '#32e68b',
      )
      material.emissive.copy(material.color)
    }
  }, [model, powered, phase])
  useEffect(
    () => () => model.indicators.forEach((material) => material.dispose()),
    [model],
  )
  useBeforePhysicsStep((world) => {
    if (
      !left.current ||
      !right.current ||
      document.hidden ||
      phase === 'closed' ||
      phase === 'open'
    )
      return
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
    leftPosition.current.x = model.leaves[0].initial.x - offset
    rightPosition.current.x = model.leaves[1].initial.x + offset
    left.current.setNextKinematicTranslation(leftPosition.current)
    right.current.setNextKinematicTranslation(rightPosition.current)
    const next = nextBulkheadPhase(phase, state.elapsed)
    if (next !== phase && !state.notified) {
      state.notified = true
      onPhaseChange(next)
    }
  })
  return (
    <group name="animated-bulkhead">
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0, 0, BULKHEAD_DEPTH - 0.48]}
      >
        {[-1, 1].map((side) => (
          <CuboidCollider
            key={side}
            args={[0.21, 1.3, 0.3]}
            position={[side * 1.55, 1.3, 0]}
          />
        ))}
        <CuboidCollider args={[1.7, 0.575, 0.3]} position={[0, 3.1, 0]} />
      </RigidBody>
      <group
        position={[0, -0.18, BULKHEAD_DEPTH]}
        rotation={[0, 0, 0]}
        userData={interaction}
      >
        <primitive object={model.frame} dispose={null} />
      </group>
      {model.leaves.map(({ visual, initial }, index) => (
        <RigidBody
          key={visual.name}
          ref={index === 0 ? left : right}
          type="kinematicPosition"
          colliders={false}
          friction={0}
          position={[
            initial.x + (index === 0 ? -1 : 1) * bulkheadLeafOffset(phase, 0),
            initial.y - 0.18,
            BULKHEAD_DEPTH + initial.z,
          ]}
          rotation={[0, 0, 0]}
          userData={interaction}
        >
          <CuboidCollider
            args={[0.69, 1.25, 0.18]}
            position={[0, 1.43, 0.06]}
          />
          <primitive object={visual} dispose={null} />
        </RigidBody>
      ))}
    </group>
  )
}
