// @vitest-environment node
import { readFileSync } from 'node:fs'
import { Box3, Mesh } from 'three'
import { expect, it } from 'vitest'
import { loadTacticalSource } from '../../../scripts/assets/tacticalSources'

it('keeps only the approved nose behind the fixed inspection glass, with embedded materials', async () => {
  const url = new URL(
    '../../../public/models/pampa-interior-nose.glb',
    import.meta.url,
  )
  const bytes = readFileSync(url)
  const asset = JSON.parse(
    bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)),
  ) as {
    meshes: unknown[]
    animations?: unknown[]
    cameras?: unknown[]
    extensions?: Record<string, unknown>
    images: { bufferView?: number; uri?: string }[]
  }
  expect(asset.meshes).toHaveLength(1)
  expect(asset.animations).toBeUndefined()
  expect(asset.cameras).toBeUndefined()
  expect(asset.extensions?.KHR_lights_punctual).toBeUndefined()
  expect(asset.images.length).toBeGreaterThan(0)
  expect(
    asset.images.every((image) => image.bufferView !== undefined && !image.uri),
  ).toBe(true)
  const { scene } = await loadTacticalSource(url)
  const bounds = new Box3().setFromObject(scene)
  expect(bounds.min.z).toBeCloseTo(19.35, 3)
  expect(bounds.max.z).toBeCloseTo(20.63, 3)
  expect(bounds.min.z - 18.265).toBeGreaterThan(1)
  expect(bounds.min.y).toBeGreaterThan(0.35)
  expect(bounds.max.y).toBeLessThan(2)
  expect(bounds.min.x).toBeGreaterThan(-0.8)
  expect(bounds.max.x).toBeLessThan(0.8)
  let triangles = 0
  scene.traverse((node) => {
    if (node instanceof Mesh) triangles += node.geometry.index!.count / 3
  })
  expect(triangles).toBe(55311)
})
