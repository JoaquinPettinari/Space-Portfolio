import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Group } from 'three'
import {
  advanceIdentification,
  identificationReach,
  IDENTIFICATION_DURATION,
} from './identification'

import { CREW_ACCESS_POSITION } from '../interaction/station'
const ignoreRaycast = () => {}

/** Reader and animation share this terminal's local coordinate system. */
export function CrewAccess({
  scanning,
  paused,
  verified,
  onComplete,
}: {
  scanning: boolean
  paused: boolean
  verified: boolean
  onComplete: () => void
}) {
  return (
    <group position={[...CREW_ACCESS_POSITION]} rotation={[0, Math.PI / 2, 0]}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.65, 0.55, 0.12]} />
        <group userData={{ interaction: 'crew' }}>
          <mesh>
            <boxGeometry args={[1.3, 1.1, 0.24]} />
            <meshStandardMaterial color="#293239" />
          </mesh>
          <mesh position={[0, 0.03, 0.13]}>
            <planeGeometry args={[1.1, 0.8]} />
            <meshBasicMaterial color={verified ? '#155f4c' : '#174559'} />
          </mesh>
          <mesh position={[0, -0.48, 0.09]}>
            <boxGeometry args={[0.42, 0.18, 0.12]} />
            <meshStandardMaterial color="#bcc5c5" />
          </mesh>
          <mesh position={[0, -0.48, 0.155]}>
            <planeGeometry args={[0.3, 0.13]} />
            <meshBasicMaterial color={verified ? '#83e5b4' : '#e4ba74'} />
          </mesh>
        </group>
      </RigidBody>
      {scanning && <ReaderGesture paused={paused} onComplete={onComplete} />}
    </group>
  )
}

function ReaderGesture({
  paused,
  onComplete,
}: {
  paused: boolean
  onComplete: () => void
}) {
  const hand = useRef<Group>(null)
  const elapsed = useRef(0)
  const complete = useRef(false)
  const reduced = useRef(false)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reduced.current = query.matches
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useFrame((_, delta) => {
    if (!hand.current || complete.current || paused || document.hidden) return
    elapsed.current = advanceIdentification(
      elapsed.current,
      Math.min(delta, 0.05),
      false,
      reduced.current,
    )
    const reach = identificationReach(elapsed.current)
    hand.current.position.set(
      -0.22 * (1 - reach),
      -0.7 + 0.22 * reach,
      0.75 - 0.57 * reach,
    )
    if (elapsed.current >= IDENTIFICATION_DURATION) {
      complete.current = true
      onComplete()
    }
  })
  return (
    <group ref={hand} name="crew-reader-gesture" position={[-0.22, -0.7, 0.75]}>
      <mesh
        position={[0, -0.24, 0.11]}
        rotation={[-0.4, 0, 0]}
        raycast={ignoreRaycast}
      >
        <capsuleGeometry args={[0.07, 0.27, 6, 10]} />
        <meshStandardMaterial color="#d6dbd8" />
      </mesh>
      <mesh
        position={[0, -0.06, 0.06]}
        scale={[1, 1.2, 0.7]}
        raycast={ignoreRaycast}
      >
        <sphereGeometry args={[0.085, 12, 8]} />
        <meshStandardMaterial color="#adb8bb" />
      </mesh>
      <mesh raycast={ignoreRaycast}>
        <boxGeometry args={[0.23, 0.14, 0.012]} />
        <meshStandardMaterial color="#eee7d7" />
      </mesh>
      <mesh position={[0, 0, 0.008]} raycast={ignoreRaycast}>
        <planeGeometry args={[0.16, 0.025]} />
        <meshBasicMaterial color="#226b86" />
      </mesh>
    </group>
  )
}
