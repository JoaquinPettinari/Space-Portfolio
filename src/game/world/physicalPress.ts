import gestureTiming from './gestureTiming.json'

/** Shared with the Blender gesture authoring script; all times are seconds. */
export const PHYSICAL_CONTACT_DELAY = gestureTiming.radio.contact
export const RADIO_ACTUATION_TIME = gestureTiming.radio.action
export const RADIO_RELEASE_TIME = gestureTiming.radio.release
export const RADIO_PRESS_DURATION = gestureTiming.radio.duration
export const RADIO_BUTTON_DEPTH = 0.045

export const smoothGesture = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return Math.max(0, Math.min(1, t * t * t * (t * (t * 6 - 15) + 10)))
}

/** A stalled frame must display the contact pose before an action can fire. */
export function advanceContactGesture(
  elapsed: number,
  delta: number,
  timing: { contact: number; action: number; duration: number },
) {
  const next = Math.min(timing.duration, elapsed + Math.max(0, delta))
  if (elapsed < timing.contact && next >= timing.contact) return timing.contact
  if (elapsed < timing.action && next >= timing.action) return timing.action
  return next
}
