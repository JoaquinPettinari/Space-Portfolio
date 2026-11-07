import { expect, it } from 'vitest'
import {
  advanceTabletPose,
  tabletAllowsMovement,
  tabletTransition,
} from './tablet'

it('raises a readable tablet without suspending movement and focuses only explicitly', () => {
  const held = tabletTransition('lowered', 'toggle')
  expect(held).toBe('held')
  expect(tabletAllowsMovement(held)).toBe(true)
  expect(tabletTransition('lowered', 'focus')).toBe('lowered')
  expect(tabletTransition(held, 'focus')).toBe('focused')
  expect(tabletAllowsMovement('focused')).toBe(false)
  expect(tabletTransition('focused', 'resume')).toBe('held')
})

it('lowers from either open mode and dismisses for other station interactions', () => {
  expect(tabletTransition('held', 'toggle')).toBe('lowered')
  expect(tabletTransition('focused', 'toggle')).toBe('lowered')
  expect(tabletTransition('focused', 'dismiss')).toBe('lowered')
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
