export const CARD_GESTURE_DURATION = 1.2
export const VERIFICATION_DURATION = 1.5
export const IDENTIFICATION_DURATION =
  CARD_GESTURE_DURATION + VERIFICATION_DURATION

export function advanceIdentification(
  elapsed: number,
  delta: number,
  paused: boolean,
  reducedMotion: boolean,
) {
  if (paused) return elapsed
  const start = reducedMotion
    ? Math.max(elapsed, CARD_GESTURE_DURATION)
    : elapsed
  return Math.min(IDENTIFICATION_DURATION, start + Math.max(0, delta))
}

/** Reach, hold against the reader, withdraw. Returns a scalar without allocating. */
export function identificationReach(elapsed: number) {
  const t = Math.max(0, Math.min(1, elapsed / CARD_GESTURE_DURATION))
  const linear = t < 0.45 ? t / 0.45 : t < 0.7 ? 1 : (1 - t) / 0.3
  return linear * linear * (3 - 2 * linear)
}
