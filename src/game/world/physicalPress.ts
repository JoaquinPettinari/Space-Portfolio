/** Seconds from starting a reach until the fingertip/card touches its target. */
export const PHYSICAL_CONTACT_DELAY = 0.5
export const RADIO_PRESS_DURATION = PHYSICAL_CONTACT_DELAY + 0.35

const smoothstep = (value: number) => value * value * (3 - 2 * value)

export function radioHandReach(elapsed: number) {
  if (elapsed < PHYSICAL_CONTACT_DELAY)
    return smoothstep(Math.max(0, elapsed / PHYSICAL_CONTACT_DELAY))
  return (
    1 -
    smoothstep(
      Math.max(0, Math.min(1, (elapsed - PHYSICAL_CONTACT_DELAY - 0.2) / 0.15)),
    )
  )
}

export function radioButtonTravel(elapsed: number) {
  const time = elapsed - PHYSICAL_CONTACT_DELAY
  if (time <= 0 || time >= 0.2) return 0
  return Math.sin((Math.PI * time) / 0.2)
}
