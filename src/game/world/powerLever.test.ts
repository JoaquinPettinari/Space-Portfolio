import { describe, expect, it } from 'vitest'
import {
  advanceLever,
  leverAngle,
  startLever,
  type LeverMotion,
} from './powerLever'

const fresh = (): LeverMotion => ({ elapsed: 0, moving: false, latched: false })

describe('auxiliary lever', () => {
  it('swings forward from upright to downward without overshooting the panel', () => {
    expect(leverAngle(0)).toBe(0)
    expect(Math.cos(leverAngle(1))).toBeLessThan(-0.99)
    expect(leverAngle(2)).toBe(leverAngle(1))
    let previous = 0
    for (let step = 1; step <= 100; step++) {
      const angle = leverAngle(step / 100)
      expect(angle).toBeGreaterThan(previous)
      expect(Math.sin(angle)).toBeGreaterThan(0)
      previous = angle
    }
    // GLB grip's lower/back corner at the ON stop clears the plate's Z=0.068 face.
    const back =
      0.091 +
      0.11 * Math.sin(leverAngle(1)) -
      0.027 * Math.abs(Math.cos(leverAngle(1)))
    expect(back).toBeGreaterThan(0.068)
  })
  it('requires interaction and emits completion only after movement, once', () => {
    const motion = fresh()
    expect(advanceLever(motion, 1, false)).toBe(false)
    startLever(motion, false)
    for (let frame = 0; frame < 11; frame++) {
      expect(advanceLever(motion, 0.05, false)).toBe(false)
      startLever(motion, false) // repeated E cannot restart the animation
    }
    expect(advanceLever(motion, 0.05, false)).toBe(true)
    startLever(motion, false)
    expect(advanceLever(motion, 1, false)).toBe(false)
    expect(motion.latched).toBe(true)
  })
  it('pauses progress and refuses an already powered interaction', () => {
    const motion = fresh()
    startLever(motion, true)
    expect(motion.moving).toBe(false)
    startLever(motion, false)
    advanceLever(motion, 1, true)
    expect(motion.elapsed).toBe(0)
    advanceLever(motion, 10, false)
    expect(motion.elapsed).toBe(0.05)
  })
  it('starts a fresh session OFF without persisting the latch', () => {
    const first = fresh()
    startLever(first, false)
    for (let frame = 0; frame < 12; frame++) advanceLever(first, 0.05, false)
    expect(first.latched).toBe(true)
    expect(fresh()).toEqual({ elapsed: 0, moving: false, latched: false })
  })
})
