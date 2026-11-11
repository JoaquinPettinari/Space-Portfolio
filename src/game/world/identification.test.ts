import { expect, it } from 'vitest'
import {
  advanceIdentification,
  identificationReach,
  IDENTIFICATION_DURATION,
  CARD_GESTURE_DURATION,
  VERIFICATION_DURATION,
} from './identification'

it('advances by elapsed seconds independent of frame rate and clamps completion', () => {
  for (const fps of [5, 30, 60, 144]) {
    let elapsed = 0
    for (let frame = 0; frame < fps * 4; frame++)
      elapsed = advanceIdentification(elapsed, 1 / fps, false, false)
    expect(elapsed).toBe(IDENTIFICATION_DURATION)
  }
  expect(advanceIdentification(0.4, 100, false, false)).toBe(
    IDENTIFICATION_DURATION,
  )
})
it('freezes while paused and skips only the hand motion with reduced motion', () => {
  expect(advanceIdentification(0.4, 1, true, false)).toBe(0.4)
  expect(advanceIdentification(0.4, 1, true, true)).toBe(0.4)
  expect(advanceIdentification(0.4, 0, false, true)).toBe(CARD_GESTURE_DURATION)
})
it('keeps verification pending for 1.5 seconds after withdrawing the card', () => {
  expect(VERIFICATION_DURATION).toBe(1.5)
  expect(identificationReach(CARD_GESTURE_DURATION)).toBe(0)
  expect(
    advanceIdentification(CARD_GESTURE_DURATION, 1.49, false, false),
  ).toBeLessThan(IDENTIFICATION_DURATION)
  expect(advanceIdentification(CARD_GESTURE_DURATION, 1.5, false, false)).toBe(
    IDENTIFICATION_DURATION,
  )
  expect(advanceIdentification(0, 1.49, false, true)).toBeLessThan(
    IDENTIFICATION_DURATION,
  )
})
it('reaches the reader, holds the card and withdraws without overshoot', () => {
  expect(identificationReach(0)).toBe(0)
  expect(identificationReach(0.6)).toBe(1)
  expect(identificationReach(IDENTIFICATION_DURATION)).toBe(0)
  for (let time = 0; time <= 1.3; time += 0.01) {
    expect(identificationReach(time)).toBeGreaterThanOrEqual(0)
    expect(identificationReach(time)).toBeLessThanOrEqual(1)
  }
})
