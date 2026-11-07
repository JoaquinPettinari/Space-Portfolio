import { expect, it } from 'vitest'
import {
  advanceIdentification,
  identificationReach,
  IDENTIFICATION_DURATION,
} from './identification'

it('advances by elapsed seconds independent of frame rate and clamps completion', () => {
  for (const fps of [30, 60, 144]) {
    let elapsed = 0
    for (let frame = 0; frame < fps * 2; frame++)
      elapsed = advanceIdentification(elapsed, 1 / fps, false, false)
    expect(elapsed).toBe(IDENTIFICATION_DURATION)
  }
  expect(advanceIdentification(0.4, 100, false, false)).toBe(
    IDENTIFICATION_DURATION,
  )
})
it('freezes while paused and completes immediately with reduced motion', () => {
  expect(advanceIdentification(0.4, 1, true, false)).toBe(0.4)
  expect(advanceIdentification(0.4, 1, true, true)).toBe(0.4)
  expect(advanceIdentification(0.4, 0, false, true)).toBe(
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
