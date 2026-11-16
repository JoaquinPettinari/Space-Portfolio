/** Remove identified low-poly display-support islands, retaining all cloth data. */
import fs from 'node:fs'
import { analyzeEmu } from './inspect-emu-components.mjs'

const { bytes, faces, find, components } = await analyzeEmu()
const approved = [
  { n: 91, center: [0.152, 0.351, -0.318] },
  { n: 72, center: [0.171, 0.076, 0.257] },
  { n: 43, center: [0.275, 0.404, -0.283] },
  { n: 30, center: [-0.26, 0.144, -0.189] },
  { n: 28, center: [0.218, 0.132, -0.001] },
  { n: 6, center: [-0.271, 0.653, -0.313] },
  { n: 5, center: [-0.236, 0.214, -0.322] },
  { n: 4, center: [-0.264, 0.626, -0.353] },
]
const selected = components.filter(
  (c) =>
    approved.some(
      (a) =>
        c.triangles === a.n &&
        a.center.every((v, k) => Math.abs(v - c.center[k]) < 0.003),
    ) && c.materials['EVA woven pressure fabric'] === c.triangles,
)
if (!selected.length) {
  console.log('EMU display islands already absent')
  process.exit(0)
}
if (selected.length !== approved.length)
  throw Error(`Expected 8 approved support islands; found ${selected.length}`)
const selectedIds = new Set(selected.map((c) => c.id))
const removed = new Map()
for (const f of faces)
  if (selectedIds.has(find(f.a))) {
    const offsets = removed.get(f.primitive) ?? new Set()
    offsets.add(f.offset)
    removed.set(f.primitive, offsets)
  }
const jsonLength = bytes.readUInt32LE(12)
const document = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength))
const binStart = 28 + jsonLength
const binLength = bytes.readUInt32LE(20 + jsonLength)
const chunks = [bytes.subarray(binStart, binStart + binLength)]
let offset = binLength,
  primitiveIndex = 0,
  removedTriangles = 0
for (const mesh of document.meshes)
  for (const primitive of mesh.primitives) {
    const omit = removed.get(primitiveIndex++)
    if (!omit) continue
    const accessor = document.accessors[primitive.indices]
    if (![5123, 5125].includes(accessor.componentType))
      throw Error('Unsupported prepared index representation')
    const view = document.bufferViews[accessor.bufferView]
    const byteWidth = accessor.componentType === 5123 ? 2 : 4
    const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    const index = []
    for (let i = 0; i < accessor.count; i += 3) {
      if (omit.has(i)) {
        removedTriangles++
        continue
      }
      for (let j = 0; j < 3; j++)
        index.push(
          byteWidth === 2
            ? chunks[0].readUInt16LE(start + (i + j) * 2)
            : chunks[0].readUInt32LE(start + (i + j) * 4),
        )
    }
    const padding = (4 - (offset % 4)) % 4
    if (padding) {
      chunks.push(Buffer.alloc(padding))
      offset += padding
    }
    const data = Buffer.alloc(index.length * byteWidth)
    index.forEach((v, i) =>
      byteWidth === 2
        ? data.writeUInt16LE(v, i * 2)
        : data.writeUInt32LE(v, i * 4),
    )
    const bufferView = document.bufferViews.length
    document.bufferViews.push({
      buffer: 0,
      byteOffset: offset,
      byteLength: data.length,
      target: 34963,
    })
    document.accessors[primitive.indices] = {
      ...accessor,
      bufferView,
      byteOffset: 0,
      count: index.length,
      min: [index.reduce((a, b) => Math.min(a, b), Infinity)],
      max: [index.reduce((a, b) => Math.max(a, b), -Infinity)],
    }
    chunks.push(data)
    offset += data.length
  }
const padding = (4 - (offset % 4)) % 4
if (padding) chunks.push(Buffer.alloc(padding))
const binary = Buffer.concat(chunks)
document.buffers[0].byteLength = binary.length
let json = Buffer.from(JSON.stringify(document))
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)])
const header = Buffer.alloc(20),
  binHeader = Buffer.alloc(8)
header.writeUInt32LE(0x46546c67, 0)
header.writeUInt32LE(2, 4)
header.writeUInt32LE(28 + json.length + binary.length, 8)
header.writeUInt32LE(json.length, 12)
header.writeUInt32LE(0x4e4f534a, 16)
binHeader.writeUInt32LE(binary.length, 0)
binHeader.writeUInt32LE(0x004e4942, 4)
const output = Buffer.concat([header, json, binHeader, binary])
fs.writeFileSync(
  new URL('../../public/models/cruz-del-sur-eva-suit.glb', import.meta.url),
  output,
)
const reportURL = new URL(
  '../../docs/assets/nasa-emu/audit.json',
  import.meta.url,
)
const report = JSON.parse(fs.readFileSync(reportURL, 'utf8'))
report.triangles -= removedTriangles
report.bytes = output.length
report.supportIslandsRemoved = selected.map((c) => ({
  triangles: c.triangles,
  boundsMin: c.min,
  boundsMax: c.max,
}))
report.indexOnlyCleanup = true
fs.writeFileSync(reportURL, JSON.stringify(report, null, 2))
console.log(
  JSON.stringify({
    removedTriangles,
    selectedIslands: selected.length,
    bytes: output.length,
    triangles: report.triangles,
    preserved:
      'All vertex attributes, normals, materials, poses and declared bounds',
  }),
)
