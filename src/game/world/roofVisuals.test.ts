// @vitest-environment node
import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector3,
} from 'three'
import { expect, it } from 'vitest'
import { createRoofVisuals } from './roofVisuals'
import {
  ROOF_PANELS,
  ROOF_COLLIDER_MARGIN,
  BOW_EDGES,
  segmentPose,
} from './bridgeLayout'
import { EXTERIOR_PANELS } from './exteriorPanels'

it('keeps every roof triangle, collision vertex and upward ray hit while batching the visuals', () => {
  const roof = createRoofVisuals()
  const original = new Group(),
    batched = new Group()
  const material = new MeshBasicMaterial({ side: DoubleSide })
  for (const [i, panel] of ROOF_PANELS.entries()) {
    const geometry = new BufferGeometry()
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(panel.points.flat()), 3),
    )
    geometry.setIndex([0, 1, 2, 0, 2, 3])
    original.add(new Mesh(geometry, material))
    expect(roof.colliders[i]).toEqual(
      new Float32Array(
        [-ROOF_COLLIDER_MARGIN, 0.1].flatMap((dy) =>
          panel.points.flatMap(([x, y, z]) => [x, y + dy, z]),
        ),
      ),
    )
  }
  batched.add(new Mesh(roof.opaque, material), new Mesh(roof.glass, material))
  original.updateMatrixWorld(true)
  batched.updateMatrixWorld(true)
  try {
    const count = (group: Group) =>
      group.children.reduce(
        (n, child) => n + (child as Mesh).geometry.index!.count / 3,
        0,
      )
    expect(count(batched)).toBe(count(original))
    const before = new Box3().setFromObject(original),
      after = new Box3().setFromObject(batched)
    expect(before.min.distanceTo(after.min)).toBeLessThan(0.00001)
    expect(before.max.distanceTo(after.max)).toBeLessThan(0.00001)
    for (const x of [-3, -1, 0, 1, 3])
      for (const z of [-3.5, -1, 1, 4]) {
        const ray = new Raycaster(
          new Vector3(x, 1, z),
          new Vector3(0, 1, 0),
          0,
          5,
        )
        const a = ray.intersectObject(original, true)[0],
          b = ray.intersectObject(batched, true)[0]
        expect(Boolean(b)).toBe(Boolean(a))
        if (a) expect(b.point.distanceTo(a.point)).toBeLessThan(0.00001)
      }
  } finally {
    original.children.forEach((o) => (o as Mesh).geometry.dispose())
    material.dispose()
    roof.dispose()
  }
})

it('retains each exterior box pose and material finish when converted to instances', () => {
  let i = 0
  for (const [a, b] of BOW_EDGES) {
    const edge = segmentPose(a, b)
    for (const [x, y, z] of [
      [0, 0.45, -0.35],
      [-0.32 * edge.length, 0.62, -0.35],
      [0.32 * edge.length, 0.62, -0.35],
    ]) {
      const expected = new Vector3(x, y, z)
        .applyMatrix4(new Matrix4().makeRotationY(edge.yaw))
        .add(new Vector3(edge.x, 0, edge.z))
      expect(
        new Vector3(...EXTERIOR_PANELS[i].at).distanceTo(expected),
      ).toBeLessThan(0.000001)
      expect(EXTERIOR_PANELS[i].yaw).toBe(edge.yaw)
      expect(EXTERIOR_PANELS[i].metalness).toBe(i % 3 === 0 ? 0.35 : 0)
      expect(EXTERIOR_PANELS[i].roughness).toBe(i % 3 === 0 ? 0.65 : 0.75)
      i++
    }
  }
  expect(EXTERIOR_PANELS).toHaveLength(i + 2)
})
