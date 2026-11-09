export type LeverMotion = { elapsed: number; moving: boolean; latched: boolean }

/** Stop 5° short of vertical to clear the lower maintenance plate. */
export function leverAngle(progress: number) {
  const t = Math.max(0, Math.min(progress, 1))
  return (t * t * (3 - 2 * t) * Math.PI * 175) / 180
}

export function startLever(motion: LeverMotion, restored: boolean) {
  if (restored || motion.moving || motion.latched) return
  motion.moving = true
}

/** Returns true exactly once at the stop; caps hidden/slow frame catch-up. */
export function advanceLever(
  motion: LeverMotion,
  delta: number,
  paused: boolean,
) {
  if (!motion.moving || paused) return false
  motion.elapsed = Math.min(0.6, motion.elapsed + Math.min(delta, 0.05))
  if (motion.elapsed < 0.6) return false
  motion.moving = false
  motion.latched = true
  return true
}
