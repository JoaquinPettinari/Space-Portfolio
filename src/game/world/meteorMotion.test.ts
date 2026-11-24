import { expect, it } from 'vitest'
import { Vector3 } from 'three'
import { METEOR_COUNT, sampleMeteor } from './meteorMotion'

it('keeps sparse flybys outside the ship and fades before recycling their positions', () => {
  const position = new Vector3(),
    direction = new Vector3()
  for (let t = 0; t <= 48; t += 0.05) {
    let active = 0
    for (let i = 0; i < METEOR_COUNT; i++) {
      const intensity = sampleMeteor(t, i, position, direction)
      expect(intensity).toBeGreaterThanOrEqual(0)
      expect(intensity).toBeLessThanOrEqual(1)
      expect(direction.length()).toBeCloseTo(1)
      if (intensity > 0) {
        active++
        expect(position.length()).toBeGreaterThan(35)
        expect(position.length()).toBeLessThan(160)
      }
    }
    expect(active).toBeLessThanOrEqual(1)
  }
  expect(sampleMeteor(23.999, 0, position, direction)).toBe(0)
  expect(sampleMeteor(24, 0, position, direction)).toBe(0)
  expect(sampleMeteor(24.001, 0, position, direction)).toBeLessThan(0.00001)
})
