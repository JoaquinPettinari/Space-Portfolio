import type { Vector3 } from 'three'

export const METEOR_COUNT = 6
const starts = [
  [-58, 30, -85],
  [75, 18, -45],
  [-72, 18, 24],
  [25, 35, 80],
  [-38, 45, -110],
  [90, 30, 52],
] as const
const directions = [
  [0.91, -0.21, 0.35],
  [-0.4, -0.3, -0.86],
  [0.3, -0.35, -0.88],
  [-0.85, -0.2, -0.48],
  [0.75, -0.4, 0.53],
  [-0.3, -0.25, -0.92],
] as const

/** Sparse, repeatable flybys: at most one short trail at a time, no random jumps. */
export function sampleMeteor(
  seconds: number,
  index: number,
  position: Vector3,
  direction: Vector3,
) {
  const age = (seconds + index * 4) % 24
  direction.fromArray(directions[index]).normalize()
  position.fromArray(starts[index]).addScaledVector(direction, age * 20)
  return age < 1.8 ? Math.sin((Math.PI * age) / 1.8) ** 2 : 0
}
