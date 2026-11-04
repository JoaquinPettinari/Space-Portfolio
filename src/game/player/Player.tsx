import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  CapsuleCollider,
  RigidBody,
  useBeforePhysicsStep,
  type RapierRigidBody,
} from '@react-three/rapier'
import { Group, Vector3 } from 'three'
import { calculateMovement, MOVEMENT_KEYS } from './movement'

export function Player({ active }: { active: boolean }) {
  const body = useRef<RapierRigidBody>(null)
  const anchor = useRef<Group>(null)
  const camera = useThree((state) => state.camera)
  const keys = useRef(new Set<string>())
  const vectors = useRef({
    forward: new Vector3(),
    move: new Vector3(),
  })

  useEffect(() => {
    const clear = () => keys.current.clear()
    const down = (event: KeyboardEvent) => {
      if (active && MOVEMENT_KEYS.has(event.code)) {
        event.preventDefault()
        keys.current.add(event.code)
      }
    }
    const up = (event: KeyboardEvent) => keys.current.delete(event.code)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', clear)
    document.addEventListener('pointerlockchange', clear)
    return () => {
      clear()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', clear)
      document.removeEventListener('pointerlockchange', clear)
    }
  }, [active])

  useBeforePhysicsStep(() => {
    if (!body.current) return
    const { forward, move } = vectors.current
    // Proyectamos la mirada sobre el piso: mirar arriba no permite volar.
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    calculateMovement(move, forward, keys.current, active)
    body.current.setLinvel(
      { x: move.x, y: body.current.linvel().y, z: move.z },
      true,
    )
  })

  useFrame(() => {
    // Rapier interpolates the rendered transform before this callback.
    // Following raw translation() instead would move the camera in 60 Hz steps.
    if (anchor.current) anchor.current.getWorldPosition(camera.position)
  })

  return (
    <RigidBody
      ref={body}
      position={[0, 0.9, 3.5]}
      colliders={false}
      lockRotations
      ccd
      canSleep={false}
    >
      {/* Altura total: 2 × (0.55 + 0.3) = 1.7 metros. */}
      <CapsuleCollider args={[0.55, 0.3]} friction={0} restitution={0} />
      <group ref={anchor} position={[0, 0.65, 0]} />
    </RigidBody>
  )
}
