// @vitest-environment node
import { readFileSync } from 'node:fs'
import { Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import { BRIDGE_OFFSET_Z } from './bridgePlacement'
import { roofHalfWidth, roofHeight } from './bridgeLayout'

it('keeps furnishing vertices inside the ship and clear of the central aisle within a small render budget', async () => {
  const bytes = readFileSync(
    new URL(
      '../../../public/models/cruz-del-sur-furnishings.glb',
      import.meta.url,
    ),
  )
  expect(bytes.length).toBeLessThan(1_000_000)
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
  let meshes = 0
  let triangles = 0
  let foliage = 0
  const vertex = new Vector3()
  try {
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      meshes++
      const positions = object.geometry.attributes.position
      triangles += (object.geometry.index?.count ?? positions.count) / 3
      for (let i = 0; i < positions.count; i++) {
        vertex
          .fromBufferAttribute(positions, i)
          .applyMatrix4(object.matrixWorld)
        const localZ = vertex.z - BRIDGE_OFFSET_Z
        expect([vertex.x, vertex.y, vertex.z].every(Number.isFinite)).toBe(true)
        expect(localZ).toBeGreaterThan(-5.4)
        expect(localZ).toBeLessThan(5.1)
        expect(Math.abs(vertex.x)).toBeLessThan(roofHalfWidth(localZ) - 0.12)
        expect(vertex.y).toBeGreaterThan(0)
        expect(vertex.y).toBeLessThan(roofHeight(localZ) - 0.12)
        expect(Math.abs(vertex.x)).toBeGreaterThan(1.1)
      }
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      for (const material of materials) {
        expect(material).toBeInstanceOf(MeshStandardMaterial)
        if (material.name.includes('Leaf')) foliage++
      }
    })
    expect(meshes).toBe(6)
    expect(triangles).toBeLessThan(18_000)
    expect(foliage).toBe(2)
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
