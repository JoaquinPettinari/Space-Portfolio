/** Derive the runtime envelope, cutting only the hull inside the new vestibule. */
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Vector3 } from 'three'
const source = new URL(
  '../../public/models/cruz-del-sur-straight-envelope.glb',
  import.meta.url,
)
const output = new URL(
  '../../public/models/cruz-del-sur-vestibule-envelope.glb',
  import.meta.url,
)
const bytes = readFileSync(source)
const jsonLength = bytes.readUInt32LE(12)
const asset = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength))
const binary = bytes.subarray(28 + jsonLength)
// Within the master walls, below its floor, and behind the docking threshold.
const clearance = { min: [-1.75, -0.15, 18.55], max: [1.75, 3.3, 21.125] }
function half(poly, axis, bound, greater) {
  const result = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length]
    const da = (a[axis] - bound) * (greater ? 1 : -1)
    const db = (b[axis] - bound) * (greater ? 1 : -1)
    if (da >= 0) result.push(a)
    if (da >= 0 !== db >= 0)
      result.push(a.map((v, j) => v + ((b[j] - v) * da) / (da - db)))
  }
  return result
}
function subtract(poly) {
  let inside = poly
  const outside = []
  for (let axis = 0; axis < 3 && inside.length; axis++) {
    const low = half(inside, axis, clearance.min[axis], false)
    if (low.length >= 3) outside.push(low)
    inside = half(inside, axis, clearance.min[axis], true)
    const high = half(inside, axis, clearance.max[axis], true)
    if (high.length >= 3) outside.push(high)
    inside = half(inside, axis, clearance.max[axis], false)
  }
  return outside
}
const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }
function read(index) {
  const a = asset.accessors[index],
    view = asset.bufferViews[a.bufferView]
  const count = components[a.type]
  const width = a.componentType === 5126 || a.componentType === 5125 ? 4 : 2
  const stride = view.byteStride ?? width * count
  const offset = (view.byteOffset ?? 0) + (a.byteOffset ?? 0)
  const reader =
    a.componentType === 5126
      ? 'readFloatLE'
      : a.componentType === 5125
        ? 'readUInt32LE'
        : 'readUInt16LE'
  return Array.from({ length: a.count }, (_, i) =>
    Array.from({ length: count }, (_, k) =>
      binary[reader](offset + i * stride + k * width),
    ),
  )
}
const chunks = [binary]
let offset = binary.length
function append(values, size, bounds) {
  const data = Buffer.from(new Float32Array(values.flat()).buffer)
  const bufferView =
    asset.bufferViews.push({
      buffer: 0,
      byteOffset: offset,
      byteLength: data.length,
      target: 34962,
    }) - 1
  chunks.push(data)
  offset += data.length
  const a = {
    bufferView,
    componentType: 5126,
    count: values.length,
    type: `VEC${size}`,
  }
  if (bounds) {
    a.min = Array.from({ length: size }, (_, axis) =>
      values.reduce((v, p) => Math.min(v, p[axis]), Infinity),
    )
    a.max = Array.from({ length: size }, (_, axis) =>
      values.reduce((v, p) => Math.max(v, p[axis]), -Infinity),
    )
  }
  return asset.accessors.push(a) - 1
}
let before = 0,
  after = 0,
  changed = 0
for (const node of asset.nodes) {
  if (!node.name?.startsWith('UNIFIED_RUNTIME_lower-hull_')) continue
  if (node.translation || node.rotation || node.scale || node.matrix)
    throw new Error('Expected world-baked hull')
  for (const primitive of asset.meshes[node.mesh].primitives) {
    const entries = Object.entries(primitive.attributes).sort(([a], [b]) =>
      a === 'POSITION' ? -1 : b === 'POSITION' ? 1 : a.localeCompare(b),
    )
    const attrs = entries.map(([name, index]) => ({
      name,
      values: read(index),
      size: components[asset.accessors[index].type],
    }))
    const indices =
      primitive.indices === undefined
        ? attrs[0].values.map((_, i) => i)
        : read(primitive.indices).flat()
    const out = []
    before += indices.length / 3
    for (let i = 0; i < indices.length; i += 3) {
      const tri = indices
        .slice(i, i + 3)
        .map((id) => attrs.flatMap((a) => a.values[id]))
      // Keep unrelated triangles byte-equivalent, avoiding unnecessary subdivision.
      const outside = [0, 1, 2].some(
        (axis) =>
          tri.every((p) => p[axis] <= clearance.min[axis]) ||
          tri.every((p) => p[axis] >= clearance.max[axis]),
      )
      const polygons = outside ? [tri] : subtract(tri)
      for (const poly of polygons)
        for (let j = 1; j < poly.length - 1; j++) {
          const triangle = [poly[0], poly[j], poly[j + 1]]
          const a = new Vector3(...triangle[0]),
            b = new Vector3(...triangle[1]),
            c = new Vector3(...triangle[2])
          if (b.sub(a).cross(c.sub(a)).lengthSq() > 1e-14) out.push(...triangle)
        }
    }
    after += out.length / 3
    if (!out.length) throw new Error('Unexpected entirely removed batch')
    let start = 0
    for (const attr of attrs) {
      const values = out.map((v) => v.slice(start, start + attr.size))
      if (attr.name === 'NORMAL')
        for (const v of values) new Vector3(...v).normalize().toArray(v)
      primitive.attributes[attr.name] = append(
        values,
        attr.size,
        attr.name === 'POSITION',
      )
      start += attr.size
    }
    delete primitive.indices
    changed++
  }
}
asset.buffers[0].byteLength = offset
// Drop superseded accessors and bytes; keep every unrelated primitive intact.
const combined = Buffer.concat(chunks)
const usedAccessors = new Set()
for (const mesh of asset.meshes)
  for (const primitive of mesh.primitives) {
    Object.values(primitive.attributes).forEach((index) =>
      usedAccessors.add(index),
    )
    if (primitive.indices !== undefined) usedAccessors.add(primitive.indices)
  }
const accessorMap = new Map(),
  viewMap = new Map(),
  accessors = [],
  views = [],
  compact = []
offset = 0
for (const index of usedAccessors) {
  const accessor = asset.accessors[index]
  if (!viewMap.has(accessor.bufferView)) {
    const view = asset.bufferViews[accessor.bufferView]
    const data = combined.subarray(
      view.byteOffset ?? 0,
      (view.byteOffset ?? 0) + view.byteLength,
    )
    viewMap.set(accessor.bufferView, views.length)
    views.push({ ...view, byteOffset: offset })
    const paddedData = Buffer.alloc(Math.ceil(data.length / 4) * 4)
    data.copy(paddedData)
    compact.push(paddedData)
    offset += paddedData.length
  }
  accessorMap.set(index, accessors.length)
  accessors.push({ ...accessor, bufferView: viewMap.get(accessor.bufferView) })
}
for (const mesh of asset.meshes)
  for (const primitive of mesh.primitives) {
    for (const name of Object.keys(primitive.attributes))
      primitive.attributes[name] = accessorMap.get(primitive.attributes[name])
    if (primitive.indices !== undefined)
      primitive.indices = accessorMap.get(primitive.indices)
  }
asset.accessors = accessors
asset.bufferViews = views
asset.buffers[0].byteLength = offset
const json = Buffer.from(JSON.stringify(asset)),
  padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20)
json.copy(padded)
const header = Buffer.alloc(20),
  binHeader = Buffer.alloc(8)
header.writeUInt32LE(0x46546c67)
header.writeUInt32LE(2, 4)
header.writeUInt32LE(28 + padded.length + offset, 8)
header.writeUInt32LE(padded.length, 12)
header.writeUInt32LE(0x4e4f534a, 16)
binHeader.writeUInt32LE(offset)
binHeader.writeUInt32LE(0x004e4942, 4)
const result = Buffer.concat([header, padded, binHeader, ...compact])
writeFileSync(output, result)
const report = {
  source: source.pathname,
  sourceSha256: createHash('sha256').update(bytes).digest('hex'),
  clearance,
  batches: changed,
  trianglesBefore: before,
  trianglesAfter: after,
  bytes: result.length,
}
writeFileSync(
  new URL(
    '../../docs/assets/cabin-master/vestibule-clearance.json',
    import.meta.url,
  ),
  JSON.stringify(report, null, 2) + '\n',
)
console.log(report)
