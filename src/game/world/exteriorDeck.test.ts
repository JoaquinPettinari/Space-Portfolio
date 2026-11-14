// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'
import { buildExteriorDeck } from './exteriorDeck'

describe('detailed exterior deck', () => {
  it('keeps all detail outside the cabin, low-profile and batched', () => {
    const geometry = buildExteriorDeck()
    try {
      expect(geometry.groups).toHaveLength(4)
      expect(geometry.getAttribute('position').count / 3).toBeLessThan(2000)
      const p = geometry.getAttribute('position')
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i),
          y = p.getY(i),
          z = p.getZ(i)
        expect(Number.isFinite(x + y + z)).toBe(true)
        expect(z).toBeLessThanOrEqual(-5.399)
        expect(z).toBeGreaterThanOrEqual(-8.201)
        expect(y).toBeLessThan(0.95)
        const halfWidth = 2.1 + ((z + 5.4) / -2.8) * -1.3
        expect(Math.abs(x)).toBeLessThanOrEqual(halfWidth + 0.002)
      }
    } finally {
      geometry.dispose()
    }
  })
  it('retains an opaque skin and separates raised panels from it', () => {
    const geometry = buildExteriorDeck()
    const material = new MeshBasicMaterial()
    const mesh = new Mesh(geometry, [material, material, material, material])
    try {
      // Panel center, away from its seams and service fittings.
      const z = -6.25
      const hits = new Raycaster(
        new Vector3(0.3, 3, z),
        new Vector3(0, -1, 0),
      ).intersectObject(mesh)
      const heights = [
        ...new Set(hits.map((hit) => Number(hit.point.y.toFixed(5)))),
      ]
      const skin = 0.8 + (z + 5.4) * (0.25 / 2.8)
      expect(heights[0]).toBeCloseTo(skin + 0.024, 4)
      expect(heights.some((y) => Math.abs(y - skin) < 0.0001)).toBe(true)
      expect(heights[0] - heights[1]).toBeGreaterThan(0.005)
    } finally {
      geometry.dispose()
      material.dispose()
    }
  })
})
