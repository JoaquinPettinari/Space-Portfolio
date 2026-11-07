import { expect, it } from 'vitest'
import {
  advanceBulkheadElapsed,
  bulkheadLeafOffset,
  nextBulkheadPhase,
  BULKHEAD_LEAF_HALF_WIDTH,
  BULKHEAD_LEAF_TRAVEL,
  BULKHEAD_UNLOCK_SECONDS,
  BULKHEAD_OPEN_SECONDS,
  type BulkheadPhase,
} from './bulkhead'

it('never opens from the closed state without an explicit powered interaction', () => {
  expect(nextBulkheadPhase('closed', 100)).toBe('closed')
  expect(advanceBulkheadElapsed('closed', 0, 100, true)).toBe(0)
  expect(bulkheadLeafOffset('closed', 100)).toBe(0)
  expect(bulkheadLeafOffset('unlocking', BULKHEAD_UNLOCK_SECONDS)).toBe(0)
  expect(nextBulkheadPhase('unlocking', BULKHEAD_UNLOCK_SECONDS - 0.01)).toBe(
    'unlocking',
  )
})

it.each([5, 30, 60, 144])(
  'unlocks then opens once using elapsed seconds at %i updates per second',
  (fps) => {
    let phase: BulkheadPhase = 'unlocking'
    let elapsed = 0
    let seconds = 0
    let lastOffset = 0
    const transitions: BulkheadPhase[] = []
    while (phase !== 'open' && seconds < 3) {
      elapsed = advanceBulkheadElapsed(phase, elapsed, 1 / fps, false)
      const offset = bulkheadLeafOffset(phase, elapsed)
      expect(offset).toBeGreaterThanOrEqual(lastOffset)
      expect(offset).toBeLessThanOrEqual(BULKHEAD_LEAF_TRAVEL)
      lastOffset = offset
      const next = nextBulkheadPhase(phase, elapsed)
      if (next !== phase) {
        transitions.push(next)
        phase = next
        elapsed = 0
      }
      seconds += 1 / fps
    }
    expect(transitions).toEqual(['opening', 'open'])
    expect(seconds).toBeGreaterThanOrEqual(
      BULKHEAD_UNLOCK_SECONDS + BULKHEAD_OPEN_SECONDS - 1e-6,
    )
    expect(seconds).toBeLessThanOrEqual(
      BULKHEAD_UNLOCK_SECONDS + BULKHEAD_OPEN_SECONDS + 2 / fps + 1e-6,
    )
    expect(nextBulkheadPhase('open', 100)).toBe('open')
  },
)

it('reduced motion preserves both phase boundaries while eliminating the slide', () => {
  const unlocked = advanceBulkheadElapsed('unlocking', 0, 0, true)
  expect(nextBulkheadPhase('unlocking', unlocked)).toBe('opening')
  const opened = advanceBulkheadElapsed('opening', 0, 0, true)
  expect(nextBulkheadPhase('opening', opened)).toBe('open')
  expect(bulkheadLeafOffset('opening', opened)).toBe(BULKHEAD_LEAF_TRAVEL)
})

it('moves leaf inner edges outside the full 2.5 m doorway and clamps malformed deltas', () => {
  const center = BULKHEAD_LEAF_HALF_WIDTH + bulkheadLeafOffset('open', 0)
  expect(center - BULKHEAD_LEAF_HALF_WIDTH).toBeGreaterThan(1.25)
  expect(advanceBulkheadElapsed('opening', 0.3, -4, false)).toBe(0.3)
  expect(advanceBulkheadElapsed('opening', 0.3, 100, false)).toBe(
    BULKHEAD_OPEN_SECONDS,
  )
})
