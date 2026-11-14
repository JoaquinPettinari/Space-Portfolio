/** Match the exporter's runtime metal cap, keeping binary geometry unchanged. */
import { readFileSync, writeFileSync } from 'node:fs'
const path = new URL(
  '../../public/models/cruz-del-sur-exterior.glb',
  import.meta.url,
)
const bytes = readFileSync(path)
const length = bytes.readUInt32LE(12)
const asset = JSON.parse(bytes.toString('utf8', 20, 20 + length))
for (const material of asset.materials) {
  const pbr = material.pbrMetallicRoughness
  pbr.metallicFactor = Math.min(pbr.metallicFactor ?? 1, 0.45)
}
const json = Buffer.from(JSON.stringify(asset))
const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20)
json.copy(padded)
const tail = bytes.subarray(20 + length)
const header = Buffer.from(bytes.subarray(0, 20))
header.writeUInt32LE(20 + padded.length + tail.length, 8)
header.writeUInt32LE(padded.length, 12)
writeFileSync(path, Buffer.concat([header, padded, tail]))
