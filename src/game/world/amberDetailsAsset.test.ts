// @vitest-environment node
import { readFileSync } from 'node:fs'
import { Mesh, MeshStandardMaterial, Raycaster, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'

async function geometryOnlyAsset(filename: string) {
  const bytes = readFileSync(
    new URL(`../../../public/models/${filename}`, import.meta.url),
  )
  const length = bytes.readUInt32LE(12)
  const asset = JSON.parse(bytes.toString('utf8', 20, 20 + length)) as {
    meshes: { primitives: { material: number }[] }[]
    materials: unknown[]
    images?: unknown[]
    textures?: unknown[]
  }
  // Geometry-only inspection avoids decoding PBR images in Node. This changes
  // only the test material, never mesh data, transforms or the runtime files.
  asset.materials = [{ doubleSided: true }]
  for (const mesh of asset.meshes)
    for (const primitive of mesh.primitives) primitive.material = 0
  delete asset.images
  delete asset.textures
  const json = Buffer.from(JSON.stringify(asset))
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20)
  json.copy(padded)
  const header = Buffer.from(bytes.subarray(0, 20))
  const tail = bytes.subarray(20 + length)
  header.writeUInt32LE(20 + padded.length + tail.length, 8)
  header.writeUInt32LE(padded.length, 12)
  const buffer = Buffer.concat([header, padded, tail])
  const { scene } = await new GLTFLoader().parseAsync(
    new Uint8Array(buffer).buffer,
    '',
  )
  scene.updateMatrixWorld(true)
  return scene
}

it('the mounted amber diffuser is visible from the room ahead of the existing facade', async () => {
  const room = await geometryOnlyAsset('cruz-del-sur-bridge-interior.glb')
  const details = await geometryOnlyAsset('cruz-del-sur-amber-details.glb')
  try {
    for (const side of [-1, 1]) {
      const origin = new Vector3(side * 2.15, 1.8, 0)
      const target = new Vector3(side * 2.15, 1.8, 1.56)
      const direction = target.clone().sub(origin).normalize()
      const hit = new Raycaster(origin, direction, 0, 3).intersectObjects(
        [...room.children, ...details.children],
        true,
      )[0]
      expect(
        hit?.object.name,
        JSON.stringify({ point: hit?.point, name: hit?.object.name }),
      ).toMatch(/^BRIDGE_AMBER_DETAIL_/)
      expect(hit.object.name).toContain('Honey_amber')
    }
  } finally {
    for (const scene of [room, details])
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

it('keeps the passage opening clear of both decorative alcoves', async () => {
  const details = await geometryOnlyAsset('cruz-del-sur-amber-details.glb')
  try {
    for (const x of [-0.9, 0, 0.9])
      for (const y of [1.1, 1.7, 2.4]) {
        const origin = new Vector3(x, y, 3)
        const hits = new Raycaster(
          origin,
          new Vector3(0, 0, -1),
          0,
          2.5,
        ).intersectObjects(details.children, true)
        expect(hits).toHaveLength(0)
      }
  } finally {
    details.traverse((object) => {
      if (!(object instanceof Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      materials.forEach((material) => material.dispose())
    })
  }
})

it('loads the warm details in five small untextured batches outside the walking aisle', async () => {
  const bytes = readFileSync(
    new URL(
      '../../../public/models/cruz-del-sur-amber-details.glb',
      import.meta.url,
    ),
  )
  expect(bytes.length).toBeLessThan(400_000)
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
  let warmEmitters = 0
  const vertex = new Vector3()
  try {
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      meshes++
      expect(object.name).toMatch(/^BRIDGE_AMBER_DETAIL_/)
      const positions = object.geometry.attributes.position
      triangles += (object.geometry.index?.count ?? positions.count) / 3
      for (let i = 0; i < positions.count; i++) {
        vertex
          .fromBufferAttribute(positions, i)
          .applyMatrix4(object.matrixWorld)
        expect([vertex.x, vertex.y, vertex.z].every(Number.isFinite)).toBe(true)
        expect(Math.abs(vertex.x)).toBeGreaterThan(2)
        expect(vertex.y).toBeGreaterThan(0.9)
        expect(vertex.z).toBeGreaterThan(1.3)
        expect(vertex.z).toBeLessThan(1.9)
      }
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      for (const material of materials) {
        expect(material).toBeInstanceOf(MeshStandardMaterial)
        if (
          material instanceof MeshStandardMaterial &&
          material.emissive.r > 0
        ) {
          warmEmitters++
          expect(material.emissive.r).toBeGreaterThan(material.emissive.b * 2)
        }
      }
    })
    expect(meshes).toBe(5)
    expect(triangles).toBeLessThan(10_000)
    expect(warmEmitters).toBeGreaterThan(0)
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
