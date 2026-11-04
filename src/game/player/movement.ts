import { Vector3 } from 'three'

export const WALK_SPEED = 3
export const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD'])

// Writes into a caller-owned vector, avoiding garbage on every physics step.
export function calculateMovement(
  target: Vector3,
  forward: Vector3,
  keys: ReadonlySet<string>,
  active: boolean,
) {
  if (!active) return target.set(0, 0, 0)
  const longitudinal = Number(keys.has('KeyW')) - Number(keys.has('KeyS'))
  const lateral = Number(keys.has('KeyD')) - Number(keys.has('KeyA'))
  return target
    .set(
      forward.x * longitudinal - forward.z * lateral,
      0,
      forward.z * longitudinal + forward.x * lateral,
    )
    .normalize()
    .multiplyScalar(WALK_SPEED)
}
