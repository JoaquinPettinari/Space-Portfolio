import { useReducedMotionRef } from '../useReducedMotionRef'
import { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Group } from 'three'
import { CrewStandbyScreen } from './CrewStandbyScreen'
import { useHandInteraction } from './useHandInteraction'
import {
  advanceIdentification,
  identificationReach,
  IDENTIFICATION_DURATION,
  IDENTIFICATION_SCAN_TIME,
  IDENTIFICATION_CONTACT_TIME,
  CARD_GESTURE_DURATION,
  CARD_READER_SURFACE_Z,
} from './identification'

import {
  CREW_ACCESS_POSITION,
  CREW_ACCESS_ROTATION,
} from '../interaction/station'

/** Reader and animation share this terminal's local coordinate system. */
export function CrewAccess({
  scanning,
  presenting,
  paused,
  verified,
  onComplete,
  onContact,
}: {
  scanning: boolean
  presenting: boolean
  paused: boolean
  verified: boolean
  onComplete: () => void
  onContact: () => void
}) {
  const { scene } = useGLTF('/models/cruz-del-sur-crew-access.glb')
  const model = useMemo(() => scene.clone(true), [scene])
  return (
    <group
      position={[...CREW_ACCESS_POSITION]}
      rotation={[0, CREW_ACCESS_ROTATION, 0]}
    >
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.65, 0.55, 0.12]} />
        <CuboidCollider args={[0.25, 0.25, 0.09]} position={[0, 0, -0.21]} />
        <group userData={{ interaction: 'crew' }}>
          <primitive object={model} dispose={null} />
          <CrewStandbyScreen verified={verified} scanning={scanning} />
          <mesh
            name="crew-reader-contact-surface"
            position={[0, -0.48, CARD_READER_SURFACE_Z]}
          >
            <planeGeometry args={[0.3, 0.045]} />
            <meshBasicMaterial color={verified ? '#83e5b4' : '#e4ba74'} />
          </mesh>
        </group>
      </RigidBody>
      {(presenting || scanning) && (
        <ReaderGesture
          paused={paused}
          onComplete={onComplete}
          onContact={onContact}
        />
      )}
    </group>
  )
}

function ReaderGesture({
  paused,
  onComplete,
  onContact,
}: {
  paused: boolean
  onComplete: () => void
  onContact: () => void
}) {
  const hand = useRef<Group>(null)
  const model = useHandInteraction('card')
  const elapsed = useRef(0)
  const complete = useRef(false)
  const contacted = useRef(false)
  const reduced = useReducedMotionRef()
  useFrame((_, delta) => {
    if (
      !hand.current ||
      complete.current ||
      paused ||
      document.hidden ||
      !document.hasFocus()
    )
      return
    elapsed.current = advanceIdentification(elapsed.current, delta, false)
    const reach = reduced.current ? 1 : identificationReach(elapsed.current)
    if (import.meta.env.DEV) {
      hand.current.userData.identificationElapsed = elapsed.current
      hand.current.userData.identificationReach = reach
      hand.current.userData.identificationActionCommitted = contacted.current
    }
    model.sample(
      'card_present',
      reduced.current
        ? Math.max(
            IDENTIFICATION_CONTACT_TIME,
            Math.min(CARD_GESTURE_DURATION, elapsed.current),
          )
        : elapsed.current,
    )
    // The card is already flush with the reader before scanning changes the UI.
    if (!contacted.current && elapsed.current >= IDENTIFICATION_SCAN_TIME) {
      contacted.current = true
      if (import.meta.env.DEV)
        hand.current.userData.identificationActionCommitted = true
      onContact()
    }
    if (elapsed.current >= IDENTIFICATION_DURATION) {
      complete.current = true
      onComplete()
    }
  })
  return (
    <group
      ref={hand}
      name="crew-reader-gesture"
      position={[0, -0.48, CARD_READER_SURFACE_Z]}
    >
      <primitive object={model.scene} dispose={null} />
    </group>
  )
}
