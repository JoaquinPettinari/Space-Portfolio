import { expect, it } from 'vitest'
import {
  PHYSICAL_CONTACT_DELAY,
  RADIO_PRESS_DURATION,
  RADIO_ACTUATION_TIME,
  RADIO_RELEASE_TIME,
  advanceContactGesture,
} from './physicalPress'
import gestureTiming from './gestureTiming.json'

it('reserves visible contact before action and release before withdrawal', () => {
  expect(PHYSICAL_CONTACT_DELAY).toBe(0.5)
  expect(RADIO_ACTUATION_TIME).toBeGreaterThan(PHYSICAL_CONTACT_DELAY)
  expect(RADIO_RELEASE_TIME).toBeGreaterThan(RADIO_ACTUATION_TIME)
  expect(RADIO_RELEASE_TIME).toBeLessThan(RADIO_PRESS_DURATION)
  for (const fps of [5, 30, 60, 144]) {
    let elapsed = 0
    let contactSeen = false
    for (let frame = 0; frame < fps * 2; frame++) {
      elapsed = advanceContactGesture(elapsed, 1 / fps, gestureTiming.radio)
      if (elapsed === PHYSICAL_CONTACT_DELAY) contactSeen = true
      if (elapsed >= RADIO_ACTUATION_TIME) expect(contactSeen).toBe(true)
    }
    expect(elapsed).toBe(RADIO_PRESS_DURATION)
  }
})

it('renders both contact and depression before a stalled frame can finish the gesture', () => {
  let elapsed = advanceContactGesture(0, 20, gestureTiming.radio)
  expect(elapsed).toBe(PHYSICAL_CONTACT_DELAY)
  elapsed = advanceContactGesture(elapsed, 20, gestureTiming.radio)
  expect(elapsed).toBe(RADIO_ACTUATION_TIME)
  expect(advanceContactGesture(elapsed, 20, gestureTiming.radio)).toBe(
    RADIO_PRESS_DURATION,
  )
})
