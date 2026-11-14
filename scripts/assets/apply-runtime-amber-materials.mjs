/** Update glTF material metadata only; retain existing geometry/images byte-for-byte. */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import assert from 'node:assert/strict'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const out = resolve(root, 'docs/assets/station-reference-interior')
const backup = resolve(out, 'runtime-before-amber')
mkdirSync(backup, { recursive: true })
const manifest = JSON.parse(
  readFileSync(resolve(out, 'runtime-amber-materials.json'), 'utf8'),
)
const reportPath = resolve(out, 'runtime-amber-patch.json')
const previous = existsSync(reportPath)
  ? JSON.parse(readFileSync(reportPath, 'utf8'))
  : null
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const reports = []
for (const filename of [
  'cruz-del-sur-bridge-interior.glb',
  'cruz-del-sur-arrival-room.glb',
]) {
  const target = resolve(root, 'public/models', filename)
  const baseline = resolve(backup, filename)
  const current = readFileSync(target)
  if (!existsSync(baseline)) writeFileSync(baseline, current)
  const bytes = readFileSync(baseline)
  const oldReport = previous?.assets.find(
    (asset) => asset.filename === filename,
  )
  assert(
    sha(current) === sha(bytes) || sha(current) === oldReport?.outputSha256,
    'Runtime asset changed independently; preserve and review it before patching: ' +
      filename,
  )
  assert.equal(bytes.readUInt32LE(0), 0x46546c67)
  assert.equal(bytes.readUInt32LE(4), 2)
  const jsonLength = bytes.readUInt32LE(12)
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a)
  const asset = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength))
  const source = structuredClone(asset)
  const changed = []
  for (const material of asset.materials) {
    const settings = manifest[material.name.replace(/ runtime$/, '')]
    if (!settings) continue
    const pbr = (material.pbrMetallicRoughness ??= {})
    pbr.baseColorFactor = settings.baseColorFactor
    if (settings.constantMetalRoughness) {
      delete pbr.metallicRoughnessTexture
      pbr.roughnessFactor = settings.roughnessFactor
      pbr.metallicFactor = settings.metallicFactor
    }
    if (settings.emissiveFactor) {
      material.emissiveFactor = settings.emissiveFactor
      material.extensions ??= {}
      material.extensions.KHR_materials_emissive_strength = {
        emissiveStrength: settings.emissiveStrength,
      }
      asset.extensionsUsed ??= []
      if (!asset.extensionsUsed.includes('KHR_materials_emissive_strength'))
        asset.extensionsUsed.push('KHR_materials_emissive_strength')
    }
    changed.push(material.name)
  }
  assert(changed.length > 0, 'No approved material names matched ' + filename)
  for (const key of [
    'nodes',
    'meshes',
    'accessors',
    'bufferViews',
    'images',
    'textures',
    'buffers',
  ])
    assert.deepEqual(asset[key], source[key], key + ' must remain unchanged')
  const tail = bytes.subarray(20 + jsonLength)
  const encoded = Buffer.from(JSON.stringify(asset))
  const padded = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20)
  encoded.copy(padded)
  const header = Buffer.alloc(20)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(20 + padded.length + tail.length, 8)
  header.writeUInt32LE(padded.length, 12)
  header.writeUInt32LE(0x4e4f534a, 16)
  const result = Buffer.concat([header, padded, tail])
  assert.equal(sha(result.subarray(20 + result.readUInt32LE(12))), sha(tail))
  writeFileSync(target, result)
  reports.push({
    filename,
    changedMaterials: changed,
    bytesBefore: bytes.length,
    bytesAfter: result.length,
    sourceSha256: sha(bytes),
    outputSha256: sha(result),
    binaryChunkSha256: sha(tail),
    geometryAndEmbeddedImagesUnchanged: true,
    meshBatches: asset.meshes.length,
  })
}
const passage = readFileSync(
  resolve(root, 'public/models/cruz-del-sur-panoramic-bay.glb'),
)
const report = {
  assets: reports,
  panoramicPassageSha256: sha(passage),
  panoramicPassageModified: false,
}
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
