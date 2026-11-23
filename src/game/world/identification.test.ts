import { expect, it } from 'vitest'
import {
  advanceIdentification,
  identificationReach,
  IDENTIFICATION_DURATION,
  CARD_GESTURE_DURATION,
  IDENTIFICATION_CONTACT_TIME,
  IDENTIFICATION_SCAN_TIME,
} from './identification'

it('reaches contact before scanning even when a frame stalls', () => {
  const contact = advanceIdentification(0.4, 100, false)
  expect(contact).toBe(IDENTIFICATION_CONTACT_TIME)
  expect(contact).toBeLessThan(IDENTIFICATION_SCAN_TIME)
  expect(identificationReach(contact)).toBe(1)
  const scan = advanceIdentification(contact, 100, false)
  expect(scan).toBe(IDENTIFICATION_SCAN_TIME)
  expect(identificationReach(scan)).toBe(1)
  expect(advanceIdentification(scan, 100, false)).toBe(IDENTIFICATION_DURATION)
})

it('freezes every phase while paused without consuming a pending action', () => {
  for (const elapsed of [
    0,
    0.4,
    IDENTIFICATION_CONTACT_TIME,
    IDENTIFICATION_SCAN_TIME,
    1,
  ])
    expect(advanceIdentification(elapsed, 10, true)).toBe(elapsed)
  expect(advanceIdentification(0.4, -1, false)).toBe(0.4)
})

it('finishes after holding and withdrawing across ordinary frame rates', () => {
  for (const fps of [5, 30, 60, 144]) {
    let elapsed = 0
    let contactSeen = false
    for (let frame = 0; frame < fps * 4; frame++) {
      elapsed = advanceIdentification(elapsed, 1 / fps, false)
      if (elapsed === IDENTIFICATION_CONTACT_TIME) contactSeen = true
      if (elapsed >= IDENTIFICATION_SCAN_TIME) expect(contactSeen).toBe(true)
    }
    expect(elapsed).toBe(IDENTIFICATION_DURATION)
  }
  expect(IDENTIFICATION_DURATION).toBe(1.25)
  expect(identificationReach(CARD_GESTURE_DURATION)).toBe(1)
  expect(identificationReach(1.1)).toBeGreaterThan(0)
  expect(identificationReach(1.1)).toBeLessThan(1)
})

it('reports bounded semantic progress through reach, hold and withdrawal', () => {
  expect(identificationReach(0)).toBe(0)
  expect(identificationReach(IDENTIFICATION_CONTACT_TIME)).toBe(1)
  expect(identificationReach(IDENTIFICATION_DURATION)).toBe(0)
  for (let time = -0.1; time <= 1.4; time += 0.01) {
    expect(identificationReach(time)).toBeGreaterThanOrEqual(0)
    expect(identificationReach(time)).toBeLessThanOrEqual(1)
  }
})
