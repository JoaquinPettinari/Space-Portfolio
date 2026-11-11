import { expect, it } from 'vitest'
import { COMMAND_POSES, COMMAND_SEGMENTS } from './commandLayout'
import { BRIDGE_OUTLINE } from './bridgeLayout'
import { stationView } from '../interaction/station'

it('joins three console prisms exactly and keeps every corner inside the hull', () => {
  expect(COMMAND_SEGMENTS).toHaveLength(3)
  for (let i = 0; i < 2; i++) {
    expect(COMMAND_SEGMENTS[i].footprint[1]).toEqual(
      COMMAND_SEGMENTS[i + 1].footprint[0],
    )
    expect(COMMAND_SEGMENTS[i].footprint[2]).toEqual(
      COMMAND_SEGMENTS[i + 1].footprint[3],
    )
  }
  for (const { footprint, collider } of COMMAND_SEGMENTS) {
    expect(collider.length).toBe(24)
    for (const [x, z] of footprint) {
      for (let i = 0; i < BRIDGE_OUTLINE.length; i++) {
        const a = BRIDGE_OUTLINE[i],
          b = BRIDGE_OUTLINE[(i + 1) % BRIDGE_OUTLINE.length]
        const signedDistance =
          ((b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0])) /
          Math.hypot(b[0] - a[0], b[1] - a[1])
        expect(signedDistance).toBeGreaterThan(0.1)
      }
    }
  }
})

it('faces both screens and chairs inward at 45 degrees with unobstructed straight-on focus', () => {
  for (const [kind, sign] of [
    ['computer', 1],
    ['communications', -1],
  ] as const) {
    const pose = COMMAND_POSES[kind]
    expect(pose.rotation).toBeCloseTo((sign * Math.PI) / 4)
    expect(pose.position[0]).toBeCloseTo(-sign * 2.379289)
    expect(pose.position[2]).toBeCloseTo(-3.729289)
    const focus = stationView(kind).position
    expect(focus[0]).toBeCloseTo(-sign * 1.634821)
    expect(focus[2]).toBeCloseTo(-2.984821)
    expect(focus[1]).toBeGreaterThan(1.3 + 0.2) // Above low chair backs.
    const approach = [-sign * 0.75, -2.1]
    expect(
      Math.hypot(approach[0] - pose.chair[0], approach[1] - pose.chair[2]),
    ).toBeGreaterThan(Math.SQRT2 * 0.42 + 0.3)
    expect(
      Math.hypot(
        approach[0] - pose.position[0],
        approach[1] - pose.position[2],
      ),
    ).toBeLessThan(2.8)
  }
})
