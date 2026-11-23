// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('ships the four photographs and textured finishes without Blender preview content', () => {
  const bytes = readFileSync(
    new URL(
      '../../../public/models/cruz-del-sur-transition.glb',
      import.meta.url,
    ),
  )
  const length = bytes.readUInt32LE(12)
  const asset = JSON.parse(bytes.toString('utf8', 20, 20 + length)) as {
    cameras?: unknown[]
    extensions?: { KHR_lights_punctual?: unknown }
    nodes: { name: string }[]
    meshes: { primitives: { attributes: { TEXCOORD_0?: number } }[] }[]
    materials: {
      name: string
      pbrMetallicRoughness?: { baseColorTexture?: { index: number } }
      normalTexture?: { index: number }
    }[]
    images: { bufferView?: number; uri?: string }[]
  }
  expect(asset.cameras).toBeUndefined()
  expect(asset.extensions?.KHR_lights_punctual).toBeUndefined()
  expect(
    asset.nodes.every((node) => node.name.startsWith('TRANSITION_STATIC_')),
  ).toBe(true)
  const photographs = asset.materials.filter((material) =>
    material.name.includes('Personal_photograph_'),
  )
  expect(photographs).toHaveLength(4)
  expect(
    new Set(
      photographs.map(
        (material) => material.pbrMetallicRoughness?.baseColorTexture?.index,
      ),
    ).size,
  ).toBe(4)
  expect(
    photographs.every(
      (material) => material.pbrMetallicRoughness?.baseColorTexture,
    ),
  ).toBe(true)
  expect(
    asset.images.every((image) => image.bufferView !== undefined && !image.uri),
  ).toBe(true)
  expect(asset.materials.some((material) => material.normalTexture)).toBe(true)
  expect(
    asset.meshes
      .flatMap((mesh) => mesh.primitives)
      .every((primitive) => primitive.attributes.TEXCOORD_0 !== undefined),
  ).toBe(true)
})
