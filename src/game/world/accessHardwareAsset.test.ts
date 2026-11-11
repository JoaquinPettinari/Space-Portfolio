/// <reference types="node" />
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

type Asset = {
  nodes: { name: string; translation?: number[] }[]
  meshes: {
    primitives: { attributes: { POSITION: number }; indices: number }[]
  }[]
  accessors: { count: number; min: number[]; max: number[] }[]
  materials: { alphaMode?: string; doubleSided?: boolean }[]
  images?: unknown[]
}
function inspect(name: string) {
  const bytes = readFileSync(
    new URL(`../../../public/models/${name}.glb`, import.meta.url),
  )
  const asset = JSON.parse(
    bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)),
  ) as Asset
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity]
  let triangles = 0
  for (const mesh of asset.meshes)
    for (const primitive of mesh.primitives) {
      const position = asset.accessors[primitive.attributes.POSITION]
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], position.min[i])
        max[i] = Math.max(max[i], position.max[i])
      }
      triangles += asset.accessors[primitive.indices].count / 3
    }
  expect(
    asset.nodes.every(
      (n) => !n.translation || n.translation.every((v) => v === 0),
    ),
  ).toBe(true)
  expect(asset.images ?? []).toHaveLength(0)
  expect(
    asset.materials
      .filter((m) => m.alphaMode !== 'BLEND')
      .every((m) => !m.doubleSided),
  ).toBe(true)
  return { asset, min, max, triangles }
}

it('keeps the docking asset isolated, floor aligned and within the rear frame envelope', () => {
  const { asset, min, max, triangles } = inspect('cruz-del-sur-docking-door')
  expect(asset.nodes.every((n) => n.name.startsWith('DOCK_'))).toBe(true)
  expect(asset.materials).toHaveLength(8)
  expect(min[1]).toBeCloseTo(0)
  expect(max[0] - min[0]).toBeCloseTo(2.85)
  expect(max[1]).toBeCloseTo(2.8)
  expect(max[2] - min[2]).toBeLessThan(0.3)
  expect(triangles).toBeLessThan(25000)
})

it('keeps the Crew screen and reader enclosure within the original interaction footprint', () => {
  const { asset, min, max, triangles } = inspect('cruz-del-sur-crew-access')
  expect(asset.nodes.every((n) => n.name.startsWith('CREW_'))).toBe(true)
  expect(asset.materials).toHaveLength(7)
  expect(min[0]).toBeCloseTo(-0.65)
  expect(max[0]).toBeCloseTo(0.65)
  expect(min[1]).toBeGreaterThan(-0.58)
  expect(max[1]).toBeCloseTo(0.55)
  expect(min[2]).toBeCloseTo(-0.3)
  expect(max[2]).toBeLessThan(0.16)
  expect(triangles).toBeLessThan(8000)
})
