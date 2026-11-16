// @vitest-environment node
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'
import { expect, it } from 'vitest'
import { createArrivalShoulderClosure } from './arrivalShoulderClosure'

it('seals the exposed starboard shoulder from the starting position without crossing the doorway', () => {
  const geometry = createArrivalShoulderClosure()
  const material = new MeshBasicMaterial()
  const panel = new Mesh(geometry, material)
  panel.updateMatrixWorld(true)
  const origin = new Vector3(0, 1.69886154, 17.06500053)
  try {
    // These native-view rays previously escaped through the triangular opening.
    for (const direction of [
      [0.656545, 0.124784, -0.743893],
      [0.668295, 0.118003, -0.734478],
      [0.680915, 0.10383, -0.724965],
    ]) {
      const hit = new Raycaster(
        origin,
        new Vector3(...direction).normalize(),
        0,
        10,
      ).intersectObject(panel)
      expect(hit.length).toBeGreaterThan(0)
      expect(hit[0].point.z).toBeCloseTo(11.95)
    }
    for (const x of [-1, 0, 1])
      expect(
        new Raycaster(
          new Vector3(x, 1.7, 17.065),
          new Vector3(0, 0, -1),
          0,
          10,
        ).intersectObject(panel),
      ).toHaveLength(0)
    expect(geometry.index!.count / 3).toBe(8)
  } finally {
    geometry.dispose()
    material.dispose()
  }
})
