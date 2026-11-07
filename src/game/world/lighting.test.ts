import { describe, expect, it } from 'vitest'
import { restorationIntensity } from './lighting'

describe('auxiliary lighting restoration', () => {
  it('starts illuminated, makes one bounded dip and settles', () => {
    expect(restorationIntensity(0, false)).toBe(1)
    expect(restorationIntensity(0.45, false)).toBeCloseTo(0.75)
    expect(restorationIntensity(0.9, false)).toBe(1)
    expect(restorationIntensity(30, false)).toBe(1)
    for (let time = 0; time <= 0.9; time += 0.01) {
      expect(restorationIntensity(time, false)).toBeGreaterThanOrEqual(0.75)
    }
  })

  it('keeps power steady for reduced motion', () => {
    expect(restorationIntensity(0.45, true)).toBe(1)
  })
})
