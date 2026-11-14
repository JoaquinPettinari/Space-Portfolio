// @vitest-environment node
import { readFileSync } from 'node:fs'
import {
  Box3,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  Vector3,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'

it('fits the real hull beneath the complete playable upper deck without sealing its windows', async () => {
  const bytes = readFileSync(
    new URL(
      '../../../public/models/cruz-del-sur-player-hull.glb',
      import.meta.url,
    ),
  )
  expect(bytes.length).toBeLessThan(6_000_000)
  const metadata = JSON.parse(
    bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)),
  )
  expect(metadata.images).toBeUndefined()
  expect(metadata.cameras).toBeUndefined()
  expect(metadata.extensions?.KHR_lights_punctual).toBeUndefined()
  const { scene } = await new GLTFLoader().parseAsync(
    new Uint8Array(bytes).buffer,
    '',
  )
  scene.updateMatrixWorld(true)
  let meshes = 0,
    triangles = 0
  try {
    const bounds = new Box3().setFromObject(scene)
    expect(bounds.min.z).toBeLessThan(-25)
    expect(bounds.max.z).toBeGreaterThan(20)
    expect(bounds.min.x).toBeLessThan(-7)
    expect(bounds.max.x).toBeGreaterThan(7)
    expect(bounds.min.y).toBeLessThan(-5)
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      meshes++
      triangles +=
        (object.geometry.index?.count ??
          object.geometry.attributes.position.count) / 3
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      for (const material of materials) {
        expect(material).toBeInstanceOf(MeshStandardMaterial)
        material.side = DoubleSide
      }
    })
    expect(meshes).toBeLessThanOrEqual(16)
    expect(triangles).toBeLessThan(90_000)
    for (const z of [-6, 0, 6, 14, 17]) {
      // Actual hull lies below all three modules, rather than in a distant berth.
      const down = new Raycaster(
        new Vector3(0, -0.1, z),
        new Vector3(0, -1, 0),
        0,
        15,
      ).intersectObjects(scene.children, true)
      expect(down.length, `hull under deck at ${z}`).toBeGreaterThan(0)
      expect(down[0].point.y).toBeLessThanOrEqual(-0.249)
      for (const direction of [
        new Vector3(1, 0, 0),
        new Vector3(-1, 0, 0),
        new Vector3(0, 1, 0),
      ]) {
        const hits = new Raycaster(
          new Vector3(0, 1.7, z),
          direction,
          0,
          20,
        ).intersectObjects(scene.children, true)
        expect(hits, `exterior must not cap the window at ${z}`).toHaveLength(0)
      }
    }
  } finally {
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      materials.forEach((material) => material.dispose())
    })
  }
})
