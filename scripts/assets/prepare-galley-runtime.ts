import { writeFileSync } from 'node:fs'
import { prepareStaticAsset } from './prepare-transition-runtime.ts'

// Remove only complete connected solids. The neighboring portal ring crosses
// this volume and is retained whole; corridor shelves start beyond Z=2.53.
const jobs = [
  {
    source: 'cruz-del-sur-transition',
    volume: {
      min: [1.815, -0.05, 1.9] as const,
      max: [2.91, 2.8, 2.5] as const,
    },
  },
  {
    source: 'cruz-del-sur-reference-details',
    volume: { min: [3.8, 1.02, 0.05] as const, max: [4.6, 1.4, 1.02] as const },
  },
]
const reports = []
for (const { source, volume } of jobs) {
  const report = await prepareStaticAsset(
    source,
    source + '-galley-ready',
    [volume],
    () => true,
    true,
  )
  if (!report.changedMeshes)
    throw new Error(`No legacy geometry removed from ${source}`)
  reports.push({
    ...report,
    volume,
    removal: 'whole connected components only',
  })
  console.log(JSON.stringify(report))
}
writeFileSync(
  new URL(
    '../../docs/assets/bridge-ceiling-study/galley-legacy-cleanup.json',
    import.meta.url,
  ),
  JSON.stringify(reports, null, 2) + '\n',
)
