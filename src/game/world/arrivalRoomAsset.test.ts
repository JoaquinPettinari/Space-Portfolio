/// <reference types="node" />
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

type Asset = {
  scenes: unknown[]
  nodes: { name: string }[]
  images: { bufferView?: number; uri?: string }[]
  meshes: { primitives: { attributes: Record<string, number> }[] }[]
  materials: {
    pbrMetallicRoughness?: {
      baseColorTexture?: unknown
      metallicRoughnessTexture?: unknown
    }
    normalTexture?: unknown
  }[]
}

it('ships only runtime geometry with embedded PBR textures and UVs', () => {
  const bytes = readFileSync(
    new URL(
      '../../../public/models/cruz-del-sur-arrival-room.glb',
      import.meta.url,
    ),
  )
  expect(bytes.toString('ascii', 0, 4)).toBe('glTF')
  const asset = JSON.parse(
    bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)),
  ) as Asset
  expect(asset.scenes).toHaveLength(1)
  expect(
    asset.nodes.every((node) => node.name.startsWith('ARRIVAL_RUNTIME_')),
  ).toBe(true)
  expect(
    asset.nodes.some((node) => /reserved|reference/i.test(node.name)),
  ).toBe(false)
  expect(asset.images.length).toBeGreaterThan(0)
  expect(
    asset.images.every((image) => image.bufferView !== undefined && !image.uri),
  ).toBe(true)
  expect(
    asset.meshes.every((mesh) =>
      mesh.primitives.every(
        (primitive) => primitive.attributes.TEXCOORD_0 !== undefined,
      ),
    ),
  ).toBe(true)
  expect(
    asset.materials.some(
      (material) => material.pbrMetallicRoughness?.metallicRoughnessTexture,
    ),
  ).toBe(true)
  expect(asset.materials.some((material) => material.normalTexture)).toBe(true)
})
