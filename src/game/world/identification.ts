import { advanceContactGesture, smoothGesture } from './physicalPress'
import gestureTiming from './gestureTiming.json'

export type IdentityPhase = 'idle' | 'presenting' | 'scanning' | 'verified'
export const IDENTIFICATION_CONTACT_TIME = gestureTiming.card.contact
export const IDENTIFICATION_SCAN_TIME = gestureTiming.card.action

export const CARD_GESTURE_DURATION = gestureTiming.card.holdUntil
export const IDENTIFICATION_DURATION = gestureTiming.card.duration
export const VERIFICATION_DURATION =
  IDENTIFICATION_DURATION - CARD_GESTURE_DURATION
export const CARD_READER_SURFACE_Z = 0.157

export function advanceIdentification(
  elapsed: number,
  delta: number,
  paused: boolean,
) {
  if (paused) return elapsed
  return advanceContactGesture(elapsed, delta, gestureTiming.card)
}

/** Semantic phase progress for diagnostics; the imported clip owns the pose. */
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
  return smoothGesture(linear)
}
