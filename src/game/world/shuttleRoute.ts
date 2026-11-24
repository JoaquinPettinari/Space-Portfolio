import type { Vector3 } from 'three'

/** Closed flight path and its tangent; the model's nose points along local +X. */
export function sampleShuttleRoute(
  phase: number,
  position: Vector3,
  tangent: Vector3,
) {
  position.set(
    Math.sin(phase) * 24,
    7 + 1.8 * Math.sin(phase * 2),
    -43 + Math.cos(phase) * 17,
  )
  tangent.set(
    Math.cos(phase) * 24,
    3.6 * Math.cos(phase * 2),
    -Math.sin(phase) * 17,
  )
}
