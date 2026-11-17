// @vitest-environment node
import { expect, it } from 'vitest'
import {
  createAstronautGloveGeometry,
  GLOVE_POINT_FINGERTIP,
} from './astronautGloveGeometry'

it('keeps the shared glove in its grip envelope with one coloured surface and a bounded mesh cost', () => {
  const geometry = createAstronautGloveGeometry()
  try {
    const position = geometry.getAttribute('position')
    const colors = geometry.getAttribute('color')
    expect(geometry.groups).toHaveLength(0)
    expect(colors.count).toBe(position.count)
    expect(position.count / 3).toBeLessThan(25_000)
    expect([...position.array].every(Number.isFinite)).toBe(true)
    expect([...colors.array].every((value) => value >= 0 && value <= 1)).toBe(
      true,
    )
    const bounds = geometry.boundingBox!
    // The palm/thumb remain beside the tablet bezel; only the sleeve extends below.
    expect(bounds.min.x).toBeGreaterThan(-0.15)
    expect(bounds.max.x).toBeLessThan(0.15)
    expect(bounds.max.y).toBeLessThan(0.23)
    expect(bounds.min.y).toBeGreaterThan(-0.72)
    expect(bounds.min.y).toBeLessThan(-0.6)
    expect(bounds.max.z).toBeLessThan(0.17)
    console.log(
      'ASTRONAUT_GLOVE',
      JSON.stringify({
        triangles: position.count / 3,
        passes: 1,
        bounds: [bounds.min.toArray(), bounds.max.toArray()],
      }),
    )
  } finally {
    geometry.dispose()
  }
})

it('extends one index for the physical radio press and keeps its contact point inside the mesh', () => {
  const grip = createAstronautGloveGeometry()
  const point = createAstronautGloveGeometry('point')
  try {
    expect(point.boundingBox!.max.y).toBeCloseTo(GLOVE_POINT_FINGERTIP[1], 2)
    expect(point.boundingBox!.max.y - grip.boundingBox!.max.y).toBeGreaterThan(
      0.15,
    )
    expect(point.getAttribute('position').count / 3).toBeLessThan(25_000)
    expect(point.getAttribute('color').count).toBe(
      point.getAttribute('position').count,
    )
    expect(point.groups).toHaveLength(0)
    expect(
      [...point.getAttribute('position').array].every(Number.isFinite),
    ).toBe(true)
  } finally {
    grip.dispose()
    point.dispose()
  }
})
