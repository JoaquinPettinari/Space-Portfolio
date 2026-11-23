import { expect, it } from 'vitest'
import {
  advanceTabletPose,
  tabletAllowsMovement,
  tabletTransition,
} from './tablet'
import gestureTiming from './world/gestureTiming.json'

it('raises a read-only tablet while retaining movement', () => {
  const held = tabletTransition('lowered', 'toggle')
  expect(held).toBe('held')
  expect(tabletAllowsMovement(held)).toBe(true)
  expect(tabletTransition(held, 'resume')).toBe('held')
  expect(tabletAllowsMovement('lowered')).toBe(true)
})

it('uses the authored raise/lower durations and reverses without a position jump', () => {
  expect(advanceTabletPose(0, 1, gestureTiming.tablet.raise, false)).toBe(1)
  expect(advanceTabletPose(1, 0, gestureTiming.tablet.lower, false)).toBe(0)
  const halfway = advanceTabletPose(0, 1, gestureTiming.tablet.raise / 2, false)
  expect(halfway).toBeCloseTo(0.5)
  expect(advanceTabletPose(halfway, 0, 0, false)).toBe(halfway)
  expect(advanceTabletPose(halfway, 0, 0.1, false)).toBeLessThan(halfway)
})

it('lowers the reader and dismisses for other station interactions', () => {
  expect(tabletTransition('held', 'toggle')).toBe('lowered')
  expect(tabletTransition('held', 'dismiss')).toBe('lowered')
})

it('animates independently of frame rate, bounds overshoot and respects reduced motion', () => {
  let coarse = 0,
    fine = 0
  for (let i = 0; i < 10; i++)
    coarse = advanceTabletPose(coarse, 1, 0.02, false)
  for (let i = 0; i < 20; i++) fine = advanceTabletPose(fine, 1, 0.01, false)
  expect(coarse).toBeCloseTo(fine, 10)
  expect(advanceTabletPose(0, 1, 10, false)).toBe(1)
  expect(advanceTabletPose(0.5, 0, 0.016, true)).toBe(0)
})
