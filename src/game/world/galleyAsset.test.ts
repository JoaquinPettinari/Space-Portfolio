// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('ships only the static kitchenette, with textured materials and a separately addressable coffee machine', () => {
  const bytes = readFileSync(
    new URL('../../../public/models/cruz-del-sur-galley.glb', import.meta.url),
  )
  const document = JSON.parse(
    bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
  ) as {
    nodes: { name?: string; extras?: { runtime_zone?: string } }[]
    meshes: { primitives: unknown[] }[]
    materials: {
      normalTexture?: unknown
      pbrMetallicRoughness?: { metallicRoughnessTexture?: unknown }
    }[]
    cameras?: unknown[]
    animations?: unknown[]
  }
  expect(bytes.subarray(0, 4).toString()).toBe('glTF')
  expect(bytes.readUInt32LE(8)).toBe(bytes.length)
  expect(bytes.length).toBeLessThan(3_000_000)
  expect(
    new Set(
      document.nodes.flatMap((n) =>
        n.extras?.runtime_zone ? [n.extras.runtime_zone] : [],
      ),
    ),
  ).toEqual(new Set(['coffee', 'static']))
  expect(
    document.meshes.reduce((n, mesh) => n + mesh.primitives.length, 0),
  ).toBeLessThanOrEqual(24)
  expect(
    document.materials.filter((m) => m.normalTexture).length,
  ).toBeGreaterThanOrEqual(4)
  expect(
    document.materials.filter(
      (m) => m.pbrMetallicRoughness?.metallicRoughnessTexture,
    ).length,
  ).toBeGreaterThanOrEqual(4)
  expect(document.cameras).toBeUndefined()
  expect(document.animations).toBeUndefined()
})
