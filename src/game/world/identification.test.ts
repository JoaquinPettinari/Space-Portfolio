import { expect, it } from 'vitest'
import {
  advanceIdentification,
  identificationReach,
  IDENTIFICATION_DURATION,
  CARD_GESTURE_DURATION,
  VERIFICATION_DURATION,
  IDENTIFICATION_CONTACT_TIME,
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
it('finishes the card gesture and verification within one second', () => {
  expect(IDENTIFICATION_DURATION).toBe(1)
  expect(VERIFICATION_DURATION).toBe(0.25)
  expect(identificationReach(CARD_GESTURE_DURATION)).toBe(1)
  expect(
    advanceIdentification(CARD_GESTURE_DURATION, 0.24, false, false),
  ).toBeLessThan(IDENTIFICATION_DURATION)
  expect(advanceIdentification(CARD_GESTURE_DURATION, 0.25, false, false)).toBe(
    IDENTIFICATION_DURATION,
  )
  expect(advanceIdentification(0, 0.24, false, true)).toBeLessThan(
    IDENTIFICATION_DURATION,
  )
})
it('reaches the reader, holds the card and withdraws without overshoot', () => {
  expect(identificationReach(0)).toBe(0)
  expect(IDENTIFICATION_CONTACT_TIME).toBe(0.5)
  expect(identificationReach(IDENTIFICATION_CONTACT_TIME)).toBe(1)
  expect(identificationReach(IDENTIFICATION_CONTACT_TIME - 0.01)).toBeLessThan(
    1,
  )
  expect(identificationReach(IDENTIFICATION_DURATION)).toBe(0)
  for (let time = 0; time <= 1.3; time += 0.01) {
    expect(identificationReach(time)).toBeGreaterThanOrEqual(0)
    expect(identificationReach(time)).toBeLessThanOrEqual(1)
  }
})
