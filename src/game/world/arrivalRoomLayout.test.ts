import { expect, it } from 'vitest'
import {
  ARRIVAL_BOXES,
  ARRIVAL_DEPTH,
  ARRIVAL_FURNITURE,
  ARRIVAL_ORIGIN_Z,
  ARRIVAL_SHELL_HULLS,
  arrivalPortExpansion,
  arrivalSurface,
} from './arrivalRoomLayout'
import { ENTRY_CREW_SCREEN, ENTRY_DOCKING_DEPTH } from './entryLayout'

it('widens the lounge while retaining door and docking anchors', () => {
  expect(ARRIVAL_ORIGIN_Z + ARRIVAL_DEPTH).toBeCloseTo(ENTRY_DOCKING_DEPTH)
  expect(arrivalPortExpansion(0)).toBe(0)
  expect(arrivalPortExpansion(ARRIVAL_DEPTH)).toBeCloseTo(0)
  expect(arrivalPortExpansion(ARRIVAL_DEPTH / 2)).toBeCloseTo(0.65)
  expect(arrivalSurface(-2.76, 0.8, ARRIVAL_DEPTH / 2)[0]).toBeCloseTo(-3.41)
  expect(arrivalSurface(0, 3, ARRIVAL_DEPTH / 2)[1]).toBeCloseTo(3.38)
})
it('leaves the central walk route and Crew approach clear', () => {
  for (const { position: p, halfSize: h } of [
    ...ARRIVAL_BOXES,
    ...ARRIVAL_FURNITURE,
  ]) {
    if (p[1] - h[1] < 2.3)
      expect(Math.abs(p[0]) - h[0]).toBeGreaterThanOrEqual(1.16)
  }
  const crewLocalZ = ENTRY_CREW_SCREEN[2] - ARRIVAL_ORIGIN_Z
  for (const { position: p, halfSize: h } of ARRIVAL_FURNITURE) {
    if (Math.abs(p[0] - ENTRY_CREW_SCREEN[0]) < h[0] + 0.3)
      expect(p[2] - h[2]).toBeGreaterThan(crewLocalZ + 0.5)
  }
})
it('uses finite convex shell strips across the room depth', () => {
  expect(ARRIVAL_SHELL_HULLS.length).toBeGreaterThan(0)
  for (const vertices of ARRIVAL_SHELL_HULLS) {
    expect(vertices).toHaveLength(24)
    expect(Array.from(vertices).every(Number.isFinite)).toBe(true)
  }
  const z = ARRIVAL_SHELL_HULLS.flatMap((v) =>
    Array.from(v).filter((_, i) => i % 3 === 2),
  )
  expect(Math.min(...z)).toBe(0)
  expect(Math.max(...z)).toBeCloseTo(ARRIVAL_DEPTH)
})

it('covers the fitted curved bench continuously without a straight invisible barrier', () => {
  const bench = ARRIVAL_FURNITURE.filter((b) => b.position[1] === 0.545)
  for (let z = 1.39; z < 3.91; z += 0.02) {
    const x = -2.24 - arrivalPortExpansion(z)
    const section = bench.find(
      (b) => Math.abs(b.position[2] - z) <= b.halfSize[2] + 0.0001,
    )
    expect(section).toBeDefined()
    if (!section) throw new Error('Missing bench collider')
    expect(Math.abs(x - section.position[0]) + 0.42).toBeLessThanOrEqual(
      section.halfSize[0],
    )
    expect(section.position[0] + section.halfSize[0] - (x + 0.42)).toBeLessThan(
      0.15,
    )
  }
})
