/** Run with node scripts/assets/prepare-tactical-display.ts. */
import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { createServer } from 'vite'
import { encodeTacticalGlb } from './tacticalGlb.ts'
import { loadTacticalSource } from './tacticalSources.ts'
import type * as CabinModule from '../../src/game/world/cabinMaster.ts'
import { createTacticalShipModel } from './tacticalShipGeometry.ts'
import { UNIFIED_ENVELOPE_ASSET } from '../../src/game/world/unifiedShipAssets.ts'

// Use the project's TS resolver so the exporter shares runtime assembly rules.
const server = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.cache/tactical-export',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null },
  appType: 'custom',
})
try {
  const cabin = (await server.ssrLoadModule(
    '/src/game/world/cabinMaster.ts',
  )) as typeof CabinModule
  const paths = [
    UNIFIED_ENVELOPE_ASSET,
    cabin.CABIN_MASTER_ASSET,
    cabin.CABIN_MASTER_LEAVES_ASSET,
  ]
  const inputs = await Promise.all(
    paths.map((path) =>
      loadTacticalSource(new URL('../../public' + path, import.meta.url)),
    ),
  )
  const model = createTacticalShipModel(
    cabin.assembleCurrentShip(
      inputs[0].scene,
      inputs[1].scene,
      inputs[2].scene,
    ),
  )
  try {
    const bytes = encodeTacticalGlb(model.surface, model.edges, {
      sourceHashes: Object.fromEntries(
        paths.map((path, i) => [path, inputs[i].sha256]),
      ),
      sourceMeshCount: model.sourceMeshCount,
      triangleCount: model.triangleCount,
      edgeSegments: model.edgeSegments,
      size: model.size.toArray(),
    })
    writeFileSync(
      new URL('../../public/models/tactical-ship-display.glb', import.meta.url),
      bytes,
    )
    const compressed = gzipSync(bytes, { level: 9 })
    writeFileSync(
      new URL(
        '../../public/models/tactical-ship-display.glb.gz',
        import.meta.url,
      ),
      compressed,
    )
    console.log(
      JSON.stringify({
        bytes: bytes.length,
        gzipBytes: compressed.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        triangles: model.triangleCount,
        edgeSegments: model.edgeSegments,
      }),
    )
  } finally {
    model.dispose()
  }
} finally {
  await server.close()
}
