import { useEffect, useEffectEvent, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  CapsuleCollider,
  RigidBody,
  useBeforePhysicsStep,
  useRapier,
  type RapierRigidBody,
} from '@react-three/rapier'
import { Group, Quaternion, Vector3 } from 'three'
import { calculateMovement, MOVEMENT_KEYS } from './movement'
import {
  JumpInput,
  JUMP_SPEED,
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
  PLAYER_EYE_OFFSET,
  PLAYER_SPAWN_POSITION,
} from './jump'
import {
  archiveFocusZ,
  monitorDistance,
  wallMonitorDistance,
  WALL_SCREEN_POSES,
  stationView,
  type StationMode,
} from '../interaction/station'

export function Player({
  active,
  mode,
  transitioning,
  onRest,
}: {
  active: boolean
  mode: StationMode
  transitioning: boolean
  onRest: () => void
}) {
  const body = useRef<RapierRigidBody>(null)
  const anchor = useRef<Group>(null)
  const camera = useThree((state) => state.camera)
  const canvas = useThree((state) => state.gl.domElement)
  const size = useThree((state) => state.size)
  const keys = useRef(new Set<string>())
  const jump = useRef(new JumpInput())
  const { world, rapier } = useRapier()
  const groundRay = useRef(
    new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }),
  )
  const pose = useRef({
    previousMode: 'walking' as StationMode,
    returnRotation: new Quaternion(),
    startPosition: new Vector3(),
    startRotation: new Quaternion(),
    endRotation: new Quaternion(),
    destination: new Vector3(),
    elapsed: 0,
  })
  const reducedMotion = useRef(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reducedMotion.current = query.matches
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const vectors = useRef({
    forward: new Vector3(),
    move: new Vector3(),
  })

  const down = useEffectEvent((event: KeyboardEvent) => {
    // Native capture can precede React's active commit. Preserve that first
    // key press; physics still waits for active before applying its velocity.
    if (
      document.pointerLockElement !== canvas ||
      mode !== 'walking' ||
      transitioning
    )
      return
    if (event.code === 'Space') {
      event.preventDefault()
      jump.current.press(event.repeat)
    } else if (MOVEMENT_KEYS.has(event.code)) {
      event.preventDefault()
      keys.current.add(event.code)
    }
  })

  useEffect(() => {
    if (mode !== 'walking' || transitioning) {
      keys.current.clear()
      jump.current.clear()
    }
  }, [mode, transitioning])

  useEffect(() => {
    const clear = () => {
      keys.current.clear()
      jump.current.clear()
    }
    const changedLock = () => {
      if (document.pointerLockElement !== canvas) clear()
    }
    const changedVisibility = () => {
      if (document.hidden) clear()
    }
    const up = (event: KeyboardEvent) => {
      keys.current.delete(event.code)
      if (event.code === 'Space') jump.current.release()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', changedVisibility)
    document.addEventListener('pointerlockchange', changedLock)
    return () => {
      clear()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', changedVisibility)
      document.removeEventListener('pointerlockchange', changedLock)
    }
  }, [canvas])

  useBeforePhysicsStep(() => {
    if (!body.current) return
    const { forward, move } = vectors.current
    // Proyectamos la mirada sobre el piso: mirar arriba no permite volar.
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    calculateMovement(
      move,
      forward,
      keys.current,
      active && mode === 'walking' && !transitioning,
    )
    let verticalSpeed = body.current.linvel().y
    const requested = jump.current.takeRequest()
    if (
      requested &&
      active &&
      mode === 'walking' &&
      !transitioning &&
      verticalSpeed <= 0.1
    ) {
      const position = body.current.translation()
      const ray = groundRay.current
      ray.origin.x = position.x
      ray.origin.y = position.y
      ray.origin.z = position.z
      // Exclude our capsule; a wall or ceiling is not a supporting surface.
      const support = world.castRayAndGetNormal(
        ray,
        PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_CAPSULE_RADIUS + 0.04,
        true,
        rapier.QueryFilterFlags.EXCLUDE_SENSORS,
        undefined,
        undefined,
        body.current,
      )
      if (support && support.normal.y > 0.6) verticalSpeed = JUMP_SPEED
    }
    body.current.setLinvel({ x: move.x, y: verticalSpeed, z: move.z }, true)
  })

  useFrame((_, delta) => {
    if (!anchor.current) return
    const state = pose.current
    if (mode !== state.previousMode) {
      if (state.previousMode === 'walking')
        state.returnRotation.copy(camera.quaternion)
      state.startPosition.copy(camera.position)
      state.startRotation.copy(camera.quaternion)
      if (mode === 'walking') {
        state.endRotation.copy(state.returnRotation)
      } else {
        const view = stationView(mode)
        camera.position.fromArray(view.position)
        const lookAt = view.lookAt
        camera.lookAt(lookAt[0], lookAt[1], lookAt[2])
        state.endRotation.copy(camera.quaternion)
        camera.position.copy(state.startPosition)
        camera.quaternion.copy(state.startRotation)
      }
      state.elapsed = 0
      state.previousMode = mode
    }
    if (mode === 'walking') anchor.current.getWorldPosition(state.destination)
    else state.destination.fromArray(stationView(mode).position)
    if (mode === 'computer')
      state.destination.z = archiveFocusZ(size.width / size.height)
    if (mode === 'communications')
      state.destination.z =
        WALL_SCREEN_POSES.communications.position[2] +
        monitorDistance(size.width / size.height)
    if (mode === 'personal')
      state.destination.x =
        WALL_SCREEN_POSES.personal.position[0] -
        wallMonitorDistance(size.width / size.height)
    if (mode === 'crew')
      state.destination.z =
        WALL_SCREEN_POSES.crew.position[2] -
        wallMonitorDistance(size.width / size.height)
    if (transitioning) {
      state.elapsed += delta
      const t = reducedMotion.current ? 1 : Math.min(state.elapsed / 0.65, 1)
      const eased = t * t * (3 - 2 * t)
      camera.position.lerpVectors(state.startPosition, state.destination, eased)
      camera.quaternion.slerpQuaternions(
        state.startRotation,
        state.endRotation,
        eased,
      )
      if (t === 1) onRest()
      return
    }
    // Rapier interpolates the rendered transform before this callback.
    // Following raw translation() instead would move the camera in 60 Hz steps.
    camera.position.copy(state.destination)
  }, -0.5)

  return (
    <RigidBody
      ref={body}
      position={[...PLAYER_SPAWN_POSITION]}
      colliders={false}
      lockRotations
      ccd
      canSleep={false}
    >
      {/* A 1.9 m capsule keeps the 1.7 m eye position inside its collision volume. */}
      <CapsuleCollider
        args={[PLAYER_CAPSULE_HALF_HEIGHT, PLAYER_CAPSULE_RADIUS]}
        friction={0}
        restitution={0}
      />
      <group ref={anchor} position={[0, PLAYER_EYE_OFFSET, 0]} />
    </RigidBody>
  )
}
