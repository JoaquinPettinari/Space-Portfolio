// @vitest-environment node
import { Vector3 } from 'three'
import { expect, it } from 'vitest'
import {
  advanceExteriorTime,
  ASTERION_MAX_DRIFT,
  sampleAsterionDrift,
} from './asterionMotion'

it('starts at the authored pose and closes both gentle paths without a reset', () => {
  const worlds = new Vector3(),
    debris = new Vector3()
  sampleAsterionDrift(0, worlds, debris)
  expect(worlds.length()).toBe(0)
  expect(debris.length()).toBe(0)
  sampleAsterionDrift(480, worlds, debris)
  expect(worlds.length()).toBeLessThan(1e-12)
  expect(debris.length()).toBeLessThan(1e-12)
  const before = new Vector3(),
    after = new Vector3()
  sampleAsterionDrift(479.999, before, debris)
  sampleAsterionDrift(480.001, after, debris)
  expect(before.distanceTo(after)).toBeLessThan(0.001)
})

it('keeps the authored worlds and their relative debris inside the camera safety margin', () => {
  const worlds = new Vector3(),
    debris = new Vector3(),
    combined = new Vector3()
  for (let seconds = 0; seconds <= 480; seconds += 0.25) {
    sampleAsterionDrift(seconds, worlds, debris)
    expect(Math.abs(worlds.x)).toBeLessThanOrEqual(3.6)
    expect(Math.abs(worlds.y)).toBeLessThanOrEqual(0.2)
    expect(worlds.z).toBeGreaterThanOrEqual(-2.4)
    expect(worlds.z).toBeLessThanOrEqual(0)
    expect(Math.abs(debris.x)).toBeLessThanOrEqual(6)
    expect(Math.abs(debris.y)).toBeLessThanOrEqual(0.5)
    expect(debris.z).toBeGreaterThanOrEqual(-6)
    expect(debris.z).toBeLessThanOrEqual(0)
    expect(combined.copy(worlds).add(debris).length()).toBeLessThan(
      ASTERION_MAX_DRIFT,
    )
  }
})

it('advances equally at 15, 30, 60 and 144 FPS and freezes paused or stalled frames', () => {
  for (const fps of [15, 30, 60, 144]) {
    let elapsed = 0
    for (let frame = 0; frame < fps * 20; frame++)
      elapsed = advanceExteriorTime(elapsed, 1 / fps, false)
    expect(elapsed).toBeCloseTo(20, 9)
    expect(advanceExteriorTime(elapsed, 1 / fps, true)).toBe(elapsed)
    for (const delta of [0, -1, 0.251, 30, Infinity, NaN])
      expect(advanceExteriorTime(elapsed, delta, false)).toBe(elapsed)
    expect(advanceExteriorTime(elapsed, 1 / fps, false)).toBeCloseTo(
      elapsed + 1 / fps,
      12,
    )
  }
})
