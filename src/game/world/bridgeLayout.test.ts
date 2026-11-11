import { expect, it } from 'vitest'
import {
  BOW_EDGES,
  ROOF_PANELS,
  roofHeight,
  ROOF_COLLIDER_MARGIN,
  BRIDGE_OUTLINE,
  segmentPose,
  PASSAGE_LENGTH,
} from './bridgeLayout'
import { WALK_SPEED } from '../player/movement'
it('uses a convex elongated bow with five connected facets and a broad front', () => {
  expect(BRIDGE_OUTLINE).toHaveLength(8)
  expect(segmentPose(...BOW_EDGES[2]).length).toBe(3.8)
  expect(segmentPose(...BOW_EDGES[0]).length).toBeCloseTo(Math.hypot(0.5, 3.4))
  const xs = BRIDGE_OUTLINE.map((p) => p[0]),
    zs = BRIDGE_OUTLINE.map((p) => p[1])
  expect(Math.max(...xs) - Math.min(...xs)).toBe(9.6)
  expect(Math.max(...zs) - Math.min(...zs)).toBe(10.5)
  for (let i = 0; i < BRIDGE_OUTLINE.length; i++) {
    const a = BRIDGE_OUTLINE[i],
      b = BRIDGE_OUTLINE[(i + 1) % 8],
      c = BRIDGE_OUTLINE[(i + 2) % 8]
    expect(
      (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]),
    ).toBeGreaterThanOrEqual(0)
  }
  for (const [a, b] of BOW_EDGES) {
    const p = segmentPose(a, b)
    expect(p.x + (Math.cos(p.yaw) * p.length) / 2).toBeCloseTo(b[0])
    expect(p.z - (Math.sin(p.yaw) * p.length) / 2).toBeCloseTo(b[1])
  }
})
it('crosses the passage in two seconds at the existing walking speed', () => {
  expect(PASSAGE_LENGTH / WALK_SPEED).toBe(2)
})

it('lowers the canopy while preserving walking clearance and free jumps in the rear', () => {
  expect(roofHeight(5.1)).toBe(3.3)
  expect(roofHeight(-3)).toBe(3.05)
  expect(roofHeight(-5.4)).toBe(2.75)
  const min = Math.min(...ROOF_PANELS.flatMap((p) => p.points.map((v) => v[1])))
  expect(min - ROOF_COLLIDER_MARGIN).toBeGreaterThan(1.9 + 0.6)
  expect(roofHeight(1) - ROOF_COLLIDER_MARGIN).toBeGreaterThan(
    1.9 + 16 / (2 * 9.81),
  )
  expect(
    ROOF_PANELS.filter((p) => p.glass).every((p) =>
      p.points.every((v) => v[2] <= 0.4),
    ),
  ).toBe(true)
})
it('covers the entire main footprint with planar canopy panels and matching boundary heights', () => {
  const area = (points: readonly (readonly [number, number])[]) =>
    Math.abs(
      points.reduce((sum, p, i) => {
        const q = points[(i + 1) % points.length]
        return sum + p[0] * q[1] - q[0] * p[1]
      }, 0),
    ) / 2
  const main = ROOF_PANELS
  expect(
    main.reduce(
      (sum, p) => sum + area(p.points.map((v) => [v[0], v[2]] as const)),
      0,
    ),
  ).toBeCloseTo(area(BRIDGE_OUTLINE), 6)
  for (const panel of main)
    for (const [x, y, z] of panel.points) {
      expect(y).toBeCloseTo(roofHeight(z))
      expect(Number.isFinite(x)).toBe(true)
    }
  for (const point of BRIDGE_OUTLINE) {
    expect(
      main.some((panel) =>
        panel.points.some(
          (v) =>
            Math.abs(v[0] - point[0]) < 1e-6 &&
            Math.abs(v[2] - point[1]) < 1e-6,
        ),
      ),
    ).toBe(true)
  }
})
