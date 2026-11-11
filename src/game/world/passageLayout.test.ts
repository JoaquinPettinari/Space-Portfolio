import { expect, it } from 'vitest'
import {
  BAY_CENTERS,
  BAY_DEPTH,
  COLLAR_CENTERS,
  COLLAR_DEPTH,
  COLLAR_OPENING,
  COLLAR_POLYGONS,
  PASSAGE_DEPTH,
  PASSAGE_PROFILE,
  PASSAGE_START,
  PASSAGE_WALLS,
} from './passageLayout'

it('tiles three native bays without longitudinal gaps between the unchanged room anchors', () => {
  expect(BAY_CENTERS[0] - BAY_DEPTH / 2).toBeCloseTo(5.1)
  expect(BAY_CENTERS[2] + BAY_DEPTH / 2).toBeCloseTo(11.2)
  BAY_CENTERS.slice(1).forEach((center, i) =>
    expect(center - BAY_CENTERS[i]).toBeCloseTo(BAY_DEPTH),
  )
})
it('follows the outward, straight, inward glazing profile on both sides', () => {
  expect(PASSAGE_WALLS).toHaveLength(6)
  for (const wall of PASSAGE_WALLS) {
    const i = PASSAGE_WALLS.indexOf(wall) % 3
    const dx = Math.sin(-wall.rotation[2]) * wall.halfLength
    const dy = Math.cos(wall.rotation[2]) * wall.halfLength
    expect(Math.abs(wall.position[0] - dx)).toBeCloseTo(PASSAGE_PROFILE[i][0])
    expect(wall.position[1] - dy).toBeCloseTo(PASSAGE_PROFILE[i][1])
    expect(Math.abs(wall.position[0] + dx)).toBeCloseTo(
      PASSAGE_PROFILE[i + 1][0],
    )
    expect(wall.position[1] + dy).toBeCloseTo(PASSAGE_PROFILE[i + 1][1])
  }
})
it('keeps adapter collisions inside the passage and outside the existing clear doorway', () => {
  expect(COLLAR_OPENING).toEqual({ width: 2.68, height: 2.5 })
  for (const z of COLLAR_CENTERS) {
    expect(z - COLLAR_DEPTH / 2).toBeGreaterThanOrEqual(PASSAGE_START)
    expect(z + COLLAR_DEPTH / 2).toBeLessThanOrEqual(
      PASSAGE_START + PASSAGE_DEPTH,
    )
  }
  for (const polygon of COLLAR_POLYGONS.slice(0, 2)) {
    expect(
      polygon.every(([x]) => Math.abs(x) >= COLLAR_OPENING.width / 2),
    ).toBe(true)
  }
  expect(COLLAR_POLYGONS[2].every(([, y]) => y >= COLLAR_OPENING.height)).toBe(
    true,
  )
})
