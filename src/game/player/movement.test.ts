import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { calculateMovement, WALK_SPEED } from './movement'

describe('walking on the floor', () => {
  const forward = new Vector3(0, 0, -1)
  it('stops when paused even with keys held', () => {
    expect(
      calculateMovement(
        new Vector3(),
        forward,
        new Set(['KeyW']),
        false,
      ).length(),
    ).toBe(0)
  })
  it('keeps diagonal speed equal to straight speed', () => {
    const result = calculateMovement(
      new Vector3(),
      forward,
      new Set(['KeyW', 'KeyD']),
      true,
    )
    expect(result.length()).toBeCloseTo(WALK_SPEED)
    expect(result.x).toBeGreaterThan(0)
    expect(result.z).toBeLessThan(0)
  })
  it('cancels opposite keys', () => {
    expect(
      calculateMovement(
        new Vector3(),
        forward,
        new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD']),
        true,
      ).length(),
    ).toBe(0)
  })
  it('follows camera heading without vertical motion', () => {
    const result = calculateMovement(
      new Vector3(),
      new Vector3(0.5, 0.8, 0),
      new Set(['KeyW']),
      true,
    )
    expect(result.toArray()).toEqual([WALK_SPEED, 0, 0])
  })
  it('strafes right relative to heading and ignores unrelated keys', () => {
    expect(
      calculateMovement(
        new Vector3(),
        new Vector3(1, 0, 0),
        new Set(['KeyD', 'Space']),
        true,
      ).toArray(),
    ).toEqual([0, 0, WALK_SPEED])
  })
})
