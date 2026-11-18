// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

type Asset = {
  nodes: {
    name: string
    mesh?: number
    translation?: number[]
    rotation?: number[]
    scale?: number[]
    camera?: number
  }[]
  meshes: {
    primitives: { attributes: { POSITION: number }; indices: number }[]
  }[]
  accessors: { count: number; min?: number[]; max?: number[] }[]
  materials: {
    name: string
    alphaMode?: string
    pbrMetallicRoughness?: { baseColorFactor?: number[] }
  }[]
  images: { bufferView?: number; uri?: string }[]
  cameras?: unknown[]
  extensions?: Record<string, unknown>
}
function read(name: string): Asset {
  const bytes = readFileSync(
    new URL(`../../../public/models/${name}.glb`, import.meta.url),
  )
  expect(bytes.toString('ascii', 0, 4)).toBe('glTF')
  return JSON.parse(
    bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)),
  ) as Asset
}

it('ships the master in world metres with its vestibule, embedded textures and no studio lights', () => {
  const asset = read('cabin-master-static')
  expect(
    asset.nodes.some((node) => node.name.startsWith('CABIN_MASTER_vestibule_')),
  ).toBe(true)
  expect(
    asset.nodes.some((node) =>
      node.name.startsWith('CABIN_MASTER_access_status_'),
    ),
  ).toBe(true)
  expect(
    asset.nodes.some(
      (node) =>
        node.name === 'LEAF_LEFT_SLIDE' || node.name === 'LEAF_RIGHT_SLIDE',
    ),
  ).toBe(false)
  expect(asset.nodes.every((node) => node.camera === undefined)).toBe(true)
  expect(asset.extensions?.KHR_lights_punctual).toBeUndefined()
  expect(asset.images.length).toBeGreaterThan(2)
  expect(
    asset.images.every((image) => image.bufferView !== undefined && !image.uri),
  ).toBe(true)
  const positions = asset.meshes.flatMap((mesh) =>
    mesh.primitives.map(
      (primitive) => asset.accessors[primitive.attributes.POSITION],
    ),
  )
  expect(
    Math.min(...positions.map((position) => position.min![2])),
  ).toBeGreaterThan(10)
  expect(
    Math.max(...positions.map((position) => position.max![2])),
  ).toBeGreaterThan(21)
  expect(
    Math.max(...positions.map((position) => position.max![2])),
  ).toBeLessThan(22)
  const glass = asset.materials.filter(
    (material) => material.alphaMode === 'BLEND',
  )
  expect(glass.length).toBeGreaterThan(0)
  expect(
    glass.some(
      (material) =>
        (material.pbrMetallicRoughness?.baseColorFactor?.[3] ?? 1) < 0.1,
    ),
  ).toBe(true)
})

it('exports independent door pivots with unscaled axes and unchanged opening travel', () => {
  const asset = read('cabin-master-sliding-leaves')
  for (const [name, x] of [
    ['LEAF_LEFT_SLIDE', -0.685],
    ['LEAF_RIGHT_SLIDE', 0.685],
  ] as const) {
    const pivot = asset.nodes.find((node) => node.name === name)!
    expect(pivot).toBeDefined()
    expect(pivot.translation?.[0]).toBeCloseTo(x)
    expect(pivot.translation?.slice(1)).toEqual([0, 0])
    expect(pivot.scale ?? [1, 1, 1]).toEqual([1, 1, 1])
    expect(pivot.rotation ?? [0, 0, 0, 1]).toEqual([0, 0, 0, 1])
  }
  expect(asset.nodes.filter((node) => node.mesh === undefined)).toHaveLength(2)
  expect(asset.extensions?.KHR_lights_punctual).toBeUndefined()
})
