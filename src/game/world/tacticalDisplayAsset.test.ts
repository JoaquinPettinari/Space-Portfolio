// @vitest-environment node
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { BufferAttribute, LineSegments, Mesh } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import { createTacticalShipModel } from '../../../scripts/assets/tacticalShipGeometry'
import {
  assembleCurrentShip,
  CABIN_MASTER_ASSET,
  CABIN_MASTER_LEAVES_ASSET,
} from './cabinMaster'
import { UNIFIED_ENVELOPE_ASSET } from './unifiedShipAssets'
import { readTacticalShipModel } from './tacticalShipModel'
import { loadTacticalSource } from '../../../scripts/assets/tacticalSources'

function attributeBytes(attribute: BufferAttribute) {
  return Buffer.from(
    attribute.array.buffer,
    attribute.array.byteOffset,
    attribute.array.byteLength,
  )
}

it('retains every projected triangle and edge byte-for-byte from the current ship sources', async () => {
  const paths = [
    UNIFIED_ENVELOPE_ASSET,
    CABIN_MASTER_ASSET,
    CABIN_MASTER_LEAVES_ASSET,
  ]
  const sources = await Promise.all(
    paths.map((path) =>
      loadTacticalSource(new URL('../../../public' + path, import.meta.url)),
    ),
  )
  const expected = createTacticalShipModel(
    assembleCurrentShip(sources[0].scene, sources[1].scene, sources[2].scene),
  )
  try {
    const bytes = readFileSync(
      new URL(
        '../../../public/models/tactical-ship-display.glb',
        import.meta.url,
      ),
    )
    const compressed = readFileSync(
      new URL(
        '../../../public/models/tactical-ship-display.glb.gz',
        import.meta.url,
      ),
    )
    expect(gunzipSync(compressed).equals(bytes)).toBe(true)
    const parsed = await new GLTFLoader().parseAsync(
      new Uint8Array(bytes).buffer,
      '',
    )
    const surface = parsed.scene.getObjectByName('tactical_surface')
    const edges = parsed.scene.getObjectByName('tactical_edges')
    expect(surface).toBeInstanceOf(Mesh)
    expect(edges).toBeInstanceOf(LineSegments)
    if (!(surface instanceof Mesh) || !(edges instanceof LineSegments))
      throw new Error('Missing tactical geometry')
    for (const [actual, original] of [
      [surface.geometry, expected.surface],
      [edges.geometry, expected.edges],
    ]) {
      expect(
        attributeBytes(
          actual.getAttribute('position') as BufferAttribute,
        ).equals(
          attributeBytes(original.getAttribute('position') as BufferAttribute),
        ),
      ).toBe(true)
    }
    expect(
      attributeBytes(surface.geometry.getIndex()!).equals(
        attributeBytes(expected.surface.getIndex()!),
      ),
    ).toBe(true)
    expect(parsed.userData.sourceHashes).toEqual(
      Object.fromEntries(paths.map((path, i) => [path, sources[i].sha256])),
    )
    expect(parsed.userData.size).toEqual(expected.size.toArray())
    const runtime = readTacticalShipModel(parsed.scene)
    expect(runtime.surface).toBe(surface.geometry)
    expect(runtime.edges).toBe(edges.geometry)
    expect(runtime.size.toArray()).toEqual(expected.size.toArray())
    expect(parsed.userData.triangleCount).toBe(expected.triangleCount)
    expect(parsed.userData.edgeSegments).toBe(expected.edgeSegments)
    expect(parsed.scene.children).toHaveLength(2)
  } finally {
    expected.dispose()
  }
}, 120_000)
