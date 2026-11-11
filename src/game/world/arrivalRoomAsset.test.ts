/// <reference types="node" />
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

type Asset = {
  scenes: unknown[]
  nodes: { name: string }[]
  images: { bufferView?: number; uri?: string }[]
  meshes: {
    primitives: { attributes: Record<string, number>; indices: number }[]
  }[]
  accessors: {
    bufferView: number
    byteOffset?: number
    count: number
    componentType: number
  }[]
  bufferViews: { byteOffset?: number; byteStride?: number }[]
  materials: {
    name: string
    doubleSided?: boolean
    alphaMode?: string
    pbrMetallicRoughness?: {
      baseColorFactor?: number[]
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
  for (const slot of ['01', '02', '03']) {
    expect(
      asset.materials.filter((m) => m.name.includes(`ARRIVAL_MEMORY_${slot}`)),
    ).toHaveLength(1)
    expect(
      asset.nodes.some((n) => n.name.includes(`ARRIVAL_MEMORY_${slot}`)),
    ).toBe(true)
  }
  const flagWhite = asset.materials.find((m) => m.name.includes('Flag white'))
  expect(flagWhite).toBeDefined()
  expect(flagWhite?.pbrMetallicRoughness?.baseColorTexture).toBeUndefined()
  expect(
    flagWhite?.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1, 1],
  ).toEqual([1, 1, 1, 1])
  expect(
    asset.materials
      .filter((m) => m.alphaMode !== 'BLEND')
      .every((m) => !m.doubleSided),
  ).toBe(true)
  // Signed volumes detect the original inward box winding masked by DoubleSide.
  const binaryStart = 28 + bytes.readUInt32LE(12)
  const read = (accessorId: number, element: number, component = 0) => {
    const accessor = asset.accessors[accessorId]
    const view = asset.bufferViews[accessor.bufferView]
    const size = accessor.componentType === 5123 ? 2 : 4
    const stride =
      view.byteStride ?? (accessor.componentType === 5126 ? 12 : size)
    const offset =
      binaryStart +
      (view.byteOffset ?? 0) +
      (accessor.byteOffset ?? 0) +
      element * stride +
      component * size
    return accessor.componentType === 5126
      ? bytes.readFloatLE(offset)
      : size === 2
        ? bytes.readUInt16LE(offset)
        : bytes.readUInt32LE(offset)
  }
  for (const mesh of asset.meshes) {
    let volume = 0
    for (const primitive of mesh.primitives) {
      for (let i = 0; i < asset.accessors[primitive.indices].count; i += 3) {
        const [a, b, c] = [0, 1, 2].map((j) =>
          [0, 1, 2].map((axis) =>
            read(
              primitive.attributes.POSITION,
              read(primitive.indices, i + j),
              axis,
            ),
          ),
        )
        volume +=
          (a[0] * (b[1] * c[2] - b[2] * c[1]) +
            a[1] * (b[2] * c[0] - b[0] * c[2]) +
            a[2] * (b[0] * c[1] - b[1] * c[0])) /
          6
      }
    }
    expect(volume).toBeGreaterThan(0)
  }
})
