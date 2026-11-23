// @vitest-environment node
import { readFileSync } from 'node:fs'
import { Box3, Group, Mesh, Raycaster, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import { batchPanoramicPassage } from './batchPanoramicPassage'
import { BAY_CENTERS, PANORAMIC_BAY_ASSET } from './passageLayout'
import { createCoffeeGeometry } from './coffeeGeometry'

it('batches the real panoramic bays without losing triangles, placement or sight boundaries', async () => {
  const bytes = readFileSync(
    new URL('../../../public' + PANORAMIC_BAY_ASSET, import.meta.url),
  )
  const { scene } = await new GLTFLoader().parseAsync(
    new Uint8Array(bytes).buffer,
    '',
  )
  const original = new Group()
  for (const z of BAY_CENTERS) {
    const copy = scene.clone(true)
    copy.position.z = z
    original.add(copy)
  }
  original.updateMatrixWorld(true)
  const batched = batchPanoramicPassage(scene, BAY_CENTERS)
  batched.root.updateMatrixWorld(true)
  const count = (root: Group) => {
    let meshes = 0,
      triangles = 0
    root.traverse((o) => {
      if (o instanceof Mesh) {
        meshes++
        triangles +=
          (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3
      }
    })
    return { meshes, triangles }
  }
  try {
    expect(count(batched.root).triangles).toBe(count(original).triangles)
    expect(count(batched.root).meshes).toBeLessThan(count(original).meshes / 2)
    const a = new Box3().setFromObject(original),
      b = new Box3().setFromObject(batched.root)
    expect(a.min.distanceTo(b.min)).toBeLessThan(0.00001)
    expect(a.max.distanceTo(b.max)).toBeLessThan(0.00001)
    for (const z of BAY_CENTERS)
      for (const side of [-1, 1])
        for (const y of [0.5, 1.7, 2.8]) {
          const ray = new Raycaster(
            new Vector3(0, y, z),
            new Vector3(side, 0, 0),
            0,
            4,
          )
          const before = ray.intersectObject(original, true)[0],
            after = ray.intersectObject(batched.root, true)[0]
          expect(Boolean(after)).toBe(Boolean(before))
          if (before)
            expect(after.point.distanceTo(before.point)).toBeLessThan(0.00001)
        }
  } finally {
    batched.dispose()
    scene.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose()
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          m.dispose()
      }
    })
  }
})

it('fits the detailed coffee machine and cup within the existing interaction collider', () => {
  const model = createCoffeeGeometry()
  try {
    let triangles = 0
    for (const geometry of Object.values(model.geometries)) {
      geometry.computeBoundingBox()
      const b = geometry.boundingBox!
      expect(b.min.x).toBeGreaterThanOrEqual(-0.401)
      expect(b.max.x).toBeLessThanOrEqual(0.401)
      expect(b.min.y).toBeGreaterThanOrEqual(-0.001)
      expect(b.max.y).toBeLessThanOrEqual(1.501)
      expect(b.min.z).toBeGreaterThanOrEqual(-0.361)
      expect(b.max.z).toBeLessThanOrEqual(0.361)
      triangles +=
        (geometry.index?.count ?? geometry.attributes.position.count) / 3
    }
    expect(triangles).toBeLessThan(15000)
    model.cup.computeBoundingBox()
    expect(model.cup.boundingBox!.max.y + 1.018).toBeLessThan(1.11)
  } finally {
    model.dispose()
  }
})
