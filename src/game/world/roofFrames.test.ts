import { expect, it } from 'vitest'
import { Vector3 } from 'three'
import {
  ROOF_EDGES,
  ROOF_FRAME_MATRICES,
  ROOF_LIGHT_MATRICES,
} from './roofFrameLayout'

it('preserves every roof beam endpoint and section without duplicate shared edges', () => {
  expect(ROOF_EDGES).toHaveLength(45)
  const keys = ROOF_EDGES.map(([a, b]) =>
    [a.join(','), b.join(',')].sort().join('|'),
  )
  expect(new Set(keys).size).toBe(keys.length)
  ROOF_EDGES.forEach(([a, b], i) => {
    const matrix = ROOF_FRAME_MATRICES[i]
    expect(
      new Vector3(0, -0.5, 0)
        .applyMatrix4(matrix)
        .distanceTo(new Vector3(...a)),
    ).toBeLessThan(1e-6)
    expect(
      new Vector3(0, 0.5, 0).applyMatrix4(matrix).distanceTo(new Vector3(...b)),
    ).toBeLessThan(1e-6)
    const size = new Vector3().setFromMatrixScale(matrix)
    expect(size.x).toBeCloseTo(0.12)
    expect(size.z).toBeCloseTo(0.12)
    expect(matrix.determinant()).toBeGreaterThan(0)
  })
})
it('keeps four existing practical strips below the rear canopy', () => {
  expect(ROOF_LIGHT_MATRICES).toHaveLength(4)
  for (const matrix of ROOF_LIGHT_MATRICES) {
    const center = new Vector3().setFromMatrixPosition(matrix)
    expect(Math.abs(center.x)).toBe(2)
    expect(center.y).toBe(3.205)
    expect([1.1, 3.9]).toContain(center.z)
    expect(new Vector3().setFromMatrixScale(matrix).toArray()).toEqual([
      1.1, 0.025, 0.08,
    ])
  }
})
