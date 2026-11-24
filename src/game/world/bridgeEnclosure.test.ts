// @vitest-environment node
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'
import { expect, it } from 'vitest'
import { createBridgeEnclosureGeometry } from './bridgeEnclosureGeometry'

function withEnclosure(check: (mesh: Mesh) => void) {
  const geometry = createBridgeEnclosureGeometry()
  const material = new MeshBasicMaterial()
  const mesh = new Mesh(geometry, material)
  mesh.updateMatrixWorld(true)
  try {
    check(mesh)
  } finally {
    geometry.dispose()
    material.dispose()
  }
}

it('closes the sky gaps above the arch and both niche headers from either side', () => {
  withEnclosure((mesh) => {
    for (const [x, y] of [
      [0, 3.2],
      [-1.45, 3.0],
      [1.45, 3.0],
      [-2.65, 2.9],
      [2.65, 2.9],
      [-4.7, 3.2],
      [4.7, 3.2],
    ]) {
      for (const direction of [-1, 1]) {
        const ray = new Raycaster(
          new Vector3(x, y, direction > 0 ? 1.8 : 2.8),
          new Vector3(0, 0, direction),
          0,
          1,
        )
        expect(ray.intersectObject(mesh).length).toBeGreaterThan(0)
      }
    }
  })
})

it('caps the roof seam but leaves the passage, niche openings and shelves unobstructed', () => {
  withEnclosure((mesh) => {
    for (const x of [-4.6, -2.6, 0, 2.6, 4.6]) {
      const up = new Raycaster(
        new Vector3(x, 3.15, 2.1),
        new Vector3(0, 1, 0),
        0,
        0.3,
      )
      expect(up.intersectObject(mesh)[0]?.point.y).toBeCloseTo(3.31)
    }
    for (const x of [-1.3, 0, 1.3, -2.36, 2.36]) {
      for (const y of [0.9, 1.6, 2.25]) {
        const forward = new Raycaster(
          new Vector3(x, y, 1.8),
          new Vector3(0, 0, 1),
          0,
          1,
        )
        expect(forward.intersectObject(mesh)).toHaveLength(0)
      }
    }
    // The first longitudinal bay begins at Z=2.48; no closure enters that bay.
    expect(mesh.geometry.boundingBox!.max.z).toBeLessThan(2.48)
    expect(mesh.geometry.boundingBox!.min.y).toBeCloseTo(2.62)
  })
})
