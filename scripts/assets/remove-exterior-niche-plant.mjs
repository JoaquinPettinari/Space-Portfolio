/** Remove obsolete dressing; --arrival removes three detached legacy locker faces. */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
const root = process.cwd()
const arrival = process.argv.includes('--arrival')
const filename = arrival
  ? 'cruz-del-sur-arrival-room.glb'
  : 'cruz-del-sur-bridge-interior.glb'
const target = resolve(root, 'public/models', filename)
const folder = resolve(
  root,
  'docs/assets/station-reference-interior/runtime-before-placement',
)
mkdirSync(folder, { recursive: true })
const backup = resolve(folder, filename)
if (!existsSync(backup)) writeFileSync(backup, readFileSync(target))
const bytes = readFileSync(backup)
const length = bytes.readUInt32LE(12)
const asset = JSON.parse(bytes.toString('utf8', 20, 20 + length))
const binary = bytes.subarray(28 + length)
const chunks = [Buffer.from(binary)]
let offset = binary.length
let removedTriangles = 0
const read = (id, components) => {
  const accessor = asset.accessors[id],
    view = asset.bufferViews[accessor.bufferView]
  assert(!view.byteStride)
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const output = []
  for (let i = 0; i < accessor.count * components; i++)
    output.push(
      accessor.componentType === 5126
        ? binary.readFloatLE(start + i * 4)
        : accessor.componentType === 5123
          ? binary.readUInt16LE(start + i * 2)
          : binary.readUInt32LE(start + i * 4),
    )
  return output
}
const remap = new Map()
const meshes = []
for (const [meshIndex, mesh] of asset.meshes.entries()) {
  mesh.primitives = mesh.primitives.filter((primitive) => {
    const material = asset.materials[primitive.material].name
    const indices = read(primitive.indices, 1)
    if (!arrival && /BRIDGE (Leaf|Stem)$/.test(material)) {
      removedTriangles += indices.length / 3
      return false
    }
    const points = read(primitive.attributes.POSITION, 3)
    const kept = []
    for (let i = 0; i < indices.length; i += 3) {
      const triangle = indices.slice(i, i + 3)
      const inPlanter = triangle.every((id) => {
        const [x, y, z] = points.slice(id * 3, id * 3 + 3)
        if (arrival) {
          // Source: ARR10 locker inset face[.001/.002], hidden in station study.
          return [
            [-3.756, -3.735, 2.19, 3.21],
            [-3.614, -3.593, 3.465, 4.485],
            [-3.027, -3.006, 4.74, 5.76],
          ].some(
            ([minX, maxX, minZ, maxZ]) =>
              x > minX - 0.004 &&
              x < maxX + 0.004 &&
              z > minZ - 0.004 &&
              z < maxZ + 0.004 &&
              y > 0.071 &&
              y < 0.409,
          )
        }
        return (
          x > 3.77 && x < 4.17 && y > 0.79 && y < 1.05 && z > 1.86 && z < 2.08
        )
      })
      if (inPlanter) removedTriangles++
      else kept.push(...triangle)
    }
    if (kept.length !== indices.length) {
      if (arrival) {
        const accessor = asset.accessors[primitive.indices]
        const view = asset.bufferViews[accessor.bufferView]
        const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
        kept.forEach((value, i) =>
          accessor.componentType === 5123
            ? chunks[0].writeUInt16LE(value, start + i * 2)
            : chunks[0].writeUInt32LE(value, start + i * 4),
        )
        accessor.count = kept.length
      } else {
        const data = Buffer.alloc(kept.length * 4)
        kept.forEach((value, i) => data.writeUInt32LE(value, i * 4))
        const view =
          asset.bufferViews.push({
            buffer: 0,
            byteOffset: offset,
            byteLength: data.length,
            target: 34963,
          }) - 1
        primitive.indices =
          asset.accessors.push({
            bufferView: view,
            componentType: 5125,
            count: kept.length,
            type: 'SCALAR',
          }) - 1
        chunks.push(data)
        offset += data.length
      }
    }
    return kept.length > 0
  })
  if (mesh.primitives.length) {
    remap.set(meshIndex, meshes.length)
    meshes.push(mesh)
  }
}
for (const node of asset.nodes)
  if (node.mesh !== undefined) {
    if (remap.has(node.mesh)) node.mesh = remap.get(node.mesh)
    else delete node.mesh
  }
asset.meshes = meshes
asset.buffers[0].byteLength = offset
const json = Buffer.from(JSON.stringify(asset))
const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20)
json.copy(padded)
const header = Buffer.alloc(20)
header.writeUInt32LE(0x46546c67, 0)
header.writeUInt32LE(2, 4)
header.writeUInt32LE(28 + padded.length + offset, 8)
header.writeUInt32LE(padded.length, 12)
header.writeUInt32LE(0x4e4f534a, 16)
const binaryHeader = Buffer.alloc(8)
binaryHeader.writeUInt32LE(offset, 0)
binaryHeader.writeUInt32LE(0x004e4942, 4)
const result = Buffer.concat([header, padded, binaryHeader, ...chunks])
const current = readFileSync(target)
assert(
  current.equals(bytes) || current.equals(result),
  'Asset changed independently after backup; review before applying placement cleanup',
)
writeFileSync(target, result)
const report = {
  removedTriangles,
  remainingMeshes: meshes.length,
  imagesReencoded: false,
  backup,
}
writeFileSync(
  resolve(
    root,
    arrival
      ? 'docs/assets/station-reference-interior/arrival-placement-cleanup.json'
      : 'docs/assets/station-reference-interior/placement-cleanup.json',
  ),
  JSON.stringify(report, null, 2),
)
console.log(report)
