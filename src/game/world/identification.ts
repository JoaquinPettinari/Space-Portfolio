import { PHYSICAL_CONTACT_DELAY } from './physicalPress'

export type IdentityPhase = 'idle' | 'presenting' | 'scanning' | 'verified'
export const IDENTIFICATION_CONTACT_TIME = PHYSICAL_CONTACT_DELAY

export const CARD_GESTURE_DURATION = 0.75
export const VERIFICATION_DURATION = 0.25
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
  const linear =
    elapsed < IDENTIFICATION_CONTACT_TIME
      ? Math.max(0, elapsed / IDENTIFICATION_CONTACT_TIME)
      : elapsed < CARD_GESTURE_DURATION
        ? 1
        : Math.max(
            0,
            1 - (elapsed - CARD_GESTURE_DURATION) / VERIFICATION_DURATION,
          )
  return linear * linear * (3 - 2 * linear)
}
