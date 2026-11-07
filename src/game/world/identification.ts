export const IDENTIFICATION_DURATION = 1.2

export function advanceIdentification(
  elapsed: number,
  delta: number,
  paused: boolean,
  reducedMotion: boolean,
) {
  if (paused) return elapsed
  if (reducedMotion) return IDENTIFICATION_DURATION
  return Math.min(IDENTIFICATION_DURATION, elapsed + Math.max(0, delta))
}

/** Reach, hold against the reader, withdraw. Returns a scalar without allocating. */
export function identificationReach(elapsed: number) {
  const t = Math.max(0, Math.min(1, elapsed / IDENTIFICATION_DURATION))
  const linear = t < 0.45 ? t / 0.45 : t < 0.7 ? 1 : (1 - t) / 0.3
  return linear * linear * (3 - 2 * linear)
}
