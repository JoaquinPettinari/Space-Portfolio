import { expect, it } from 'vitest'
import {
  PHYSICAL_CONTACT_DELAY,
  RADIO_PRESS_DURATION,
  radioButtonTravel,
  radioHandReach,
} from './physicalPress'

it('does not depress the radio key until the hand reaches it after half a second', () => {
  expect(PHYSICAL_CONTACT_DELAY).toBe(0.5)
  for (const elapsed of [0, 0.1, 0.3, 0.49]) {
    expect(radioButtonTravel(elapsed)).toBe(0)
    expect(radioHandReach(elapsed)).toBeLessThan(1)
  }
  expect(radioHandReach(0.5)).toBe(1)
  expect(radioHandReach(0.6)).toBe(1)
  expect(radioButtonTravel(0.6)).toBeCloseTo(1)
  expect(radioHandReach(RADIO_PRESS_DURATION)).toBeCloseTo(0)
  expect(radioButtonTravel(RADIO_PRESS_DURATION)).toBe(0)
})
