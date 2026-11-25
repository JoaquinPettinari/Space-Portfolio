// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  Vector3,
} from 'three'
import { prepareTransitionModel } from './transitionModel'

it('ships the four photographs and textured finishes without Blender preview content', () => {
  const bytes = readFileSync(
    new URL(
      '../../../public/models/cruz-del-sur-transition-galley-ready.glb',
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

it('keeps the exported portal reveals solid from both directions with runtime culling', () => {
  const bytes = readFileSync(
    new URL(
      '../../../public/models/cruz-del-sur-transition-galley-ready.glb',
      import.meta.url,
    ),
  )
  const jsonLength = bytes.readUInt32LE(12)
  const asset = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength)) as {
    nodes: { name: string; mesh: number; matrix?: number[] }[]
    meshes: {
      primitives: { attributes: { POSITION: number }; indices: number }[]
    }[]
    accessors: {
      bufferView: number
      byteOffset?: number
      count: number
      componentType: number
    }[]
    bufferViews: { byteOffset?: number; byteStride?: number }[]
  }
  const node = asset.nodes.find((entry) =>
    entry.name.endsWith('_TRANSITION_Brushed_titanium'),
  )!
  expect(node.matrix).toBeUndefined()
  const primitive = asset.meshes[node.mesh].primitives[0]
  const attribute = (index: number, size: number) => {
    const accessor = asset.accessors[index]
    const view = asset.bufferViews[accessor.bufferView]
    expect(view.byteStride).toBeUndefined()
    const ArrayType =
      accessor.componentType === 5126
        ? Float32Array
        : accessor.componentType === 5125
          ? Uint32Array
          : Uint16Array
    const start =
      28 + jsonLength + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    const data = Uint8Array.from(
      bytes.subarray(
        start,
        start + accessor.count * size * ArrayType.BYTES_PER_ELEMENT,
      ),
    )
    return new BufferAttribute(new ArrayType(data.buffer), size)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', attribute(primitive.attributes.POSITION, 3))
  geometry.setIndex(attribute(primitive.indices, 1))
  const material = new MeshStandardMaterial()
  material.name = 'TRANSITION_PBR_TRANSITION_Brushed_titanium'
  const prepared = prepareTransitionModel(new Mesh(geometry, material))
  try {
    for (const z of [2.28, 4.96]) {
      for (const [x, y] of [
        [0, 2.68],
        [-1.42, 0.3],
        [1.42, 0.3],
      ]) {
        for (const direction of [-1, 1]) {
          const hits = new Raycaster(
            new Vector3(x, y, z - direction * 0.4),
            new Vector3(0, 0, direction),
            0,
            0.8,
          ).intersectObject(prepared.root)
          expect(hits.length).toBeGreaterThan(0)
          expect(hits[0].point.z).toBeCloseTo(z - direction * 0.09, 3)
        }
      }
    }
  } finally {
    prepared.dispose()
    material.dispose()
    geometry.dispose()
  }
})
