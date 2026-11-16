// @vitest-environment node
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'
import { expect, it } from 'vitest'
import { createBridgeThroatGeometry } from './bridgeThroatGeometry'

it('leaves the walking aperture open and closes only the upper shoulders with a bounded static ring', () => {
  const geometry = createBridgeThroatGeometry()
  const material = new MeshBasicMaterial({ side: DoubleSide })
  const mesh = new Mesh(geometry, material)
  mesh.updateMatrixWorld(true)
  const ray = new Raycaster()
  const hits = (x: number, y: number) => {
    ray.set(new Vector3(x, y, 1), new Vector3(0, 0, -1))
    return ray.intersectObject(mesh).length
  }
  try {
    for (const x of [-1.1, 0, 1.1]) {
      expect(hits(x, 1.7)).toBe(0)
      expect(hits(x, 0.3)).toBe(0)
    }
    expect(hits(1.339, 1.7)).toBe(0)
    expect(hits(0, 2.4)).toBe(0)
    expect(hits(1.27, 2.45)).toBeGreaterThan(0)
    expect(hits(1.6, 1.7)).toBeGreaterThan(0)
    expect(hits(0, 2.9)).toBeGreaterThan(0)
    expect(geometry.getAttribute('position').count / 3).toBeLessThan(2500)
  } finally {
    geometry.dispose()
    material.dispose()
  }
})
