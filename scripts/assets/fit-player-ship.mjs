/** Fit a copy of the exterior around the playable upper deck. Source GLB is preserved.
 * Subtract convex clearance boxes by clipping triangles, rather than discarding
 * whole hull faces whose bounds happen to overlap the cabin.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Mesh, Vector3, Matrix4, Matrix3 } from 'three'
const input = new URL(
  '../../public/models/cruz-del-sur-exterior.glb',
  import.meta.url,
)
const bytes = readFileSync(input)
const original = JSON.parse(
  bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)),
)
const { scene } = await new GLTFLoader().parseAsync(
  new Uint8Array(bytes).buffer,
  '',
)
scene.updateMatrixWorld(true)
const translation = [0, -2.64, 2.01],
  scale = [1, 1.6, 1.2]
const transform = new Matrix4().makeScale(...scale).setPosition(...translation)
// Remove the old closed display tower, whose glazing was an opaque backing.
// The actual playable bridge/passage/arrival architecture becomes the upper skin.
const cutters = [
  { min: [-6.3, -0.25, -9.3], max: [6.3, 30, 14.1] },
  { min: [-5.6, -0.25, 11.8], max: [5.6, 30, 18.55] },
]
// A vertex contains both position and normal; interpolate normals at cut edges.
function half(poly, axis, bound, greater) {
  const result = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length]
    const da = (a[axis] - bound) * (greater ? 1 : -1),
      db = (b[axis] - bound) * (greater ? 1 : -1)
    if (da >= 0) result.push(a)
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db)
      result.push(a.map((v, j) => v + (b[j] - v) * t))
    }
  }
  return result
}
function subtract(poly, box) {
  let inside = poly
  const outside = []
  for (let axis = 0; axis < 3; axis++) {
    if (!inside.length) break
    const low = half(inside, axis, box.min[axis], false)
    if (low.length >= 3) outside.push(low)
    inside = half(inside, axis, box.min[axis], true)
    const high = half(inside, axis, box.max[axis], true)
    if (high.length >= 3) outside.push(high)
    inside = half(inside, axis, box.max[axis], false)
  }
  return outside
}
const parts = []
scene.traverse((ob) => {
  if (!(ob instanceof Mesh)) return
  const position = ob.geometry.attributes.position,
    normal = ob.geometry.attributes.normal,
    index = ob.geometry.index
  const matrix = transform.clone().multiply(ob.matrixWorld)
  const normalMatrix = new Matrix3().getNormalMatrix(matrix)
  const vertices = [],
    normals = []
  for (let i = 0; i < (index?.count ?? position.count); i += 3) {
    const triangle = []
    for (let j = 0; j < 3; j++) {
      const id = index ? index.getX(i + j) : i + j
      const p = new Vector3()
        .fromBufferAttribute(position, id)
        .applyMatrix4(matrix)
      const n = new Vector3().fromBufferAttribute(normal, id)
      // Inverse transpose for the nonuniform fitting scale.
      n.applyMatrix3(normalMatrix).normalize()
      triangle.push([...p.toArray(), ...n.toArray()])
    }
    let polygons = [triangle]
    for (const box of cutters)
      polygons = polygons.flatMap((poly) => subtract(poly, box))
    for (const poly of polygons)
      for (let j = 1; j < poly.length - 1; j++) {
        const tri = [poly[0], poly[j], poly[j + 1]]
        const a = new Vector3(...tri[0]),
          b = new Vector3(...tri[1]),
          c = new Vector3(...tri[2])
        if (b.sub(a).cross(c.sub(a)).lengthSq() < 1e-14) continue
        for (const v of tri) {
          vertices.push(...v.slice(0, 3))
          const n = new Vector3(...v.slice(3)).normalize()
          normals.push(...n.toArray())
        }
      }
  }
  if (vertices.length)
    parts.push({
      vertices,
      normals,
      material: original.materials.findIndex(
        (m) => m.name === ob.material.name,
      ),
    })
})
// Close the cut with a low foundation below the existing floors. It also forms
// the visible roof/deck around the panoramic connector, without coplanar floors.
const steelId = original.materials.findIndex((m) =>
  m.name.includes('Titanium armor'),
)
const foundation = parts.find((p) => p.material === steelId)
if (!foundation) throw Error('Missing hull foundation material')
for (const [x, z0, z1] of [
  [6.3, -9.3, 14.1],
  [5.6, 14.1, 18.55],
]) {
  const a = [-x, -0.251, z0],
    b = [-x, -0.251, z1],
    c = [x, -0.251, z1],
    d = [x, -0.251, z0]
  for (const v of [a, b, c, a, c, d]) {
    foundation.vertices.push(...v)
    foundation.normals.push(0, 1, 0)
  }
}
const asset = {
  asset: { version: '2.0', generator: 'Space Portfolio upper-deck hull fit' },
  scene: 0,
  scenes: [{ nodes: [] }],
  nodes: [],
  meshes: [],
  materials: original.materials,
  accessors: [],
  bufferViews: [],
  buffers: [],
}
const chunks = []
let offset = 0
function attribute(values, bounds = false) {
  const data = Buffer.from(new Float32Array(values).buffer)
  const view =
    asset.bufferViews.push({
      buffer: 0,
      byteOffset: offset,
      byteLength: data.length,
      target: 34962,
    }) - 1
  chunks.push(data)
  offset += data.length
  const entry = {
    bufferView: view,
    componentType: 5126,
    count: values.length / 3,
    type: 'VEC3',
  }
  if (bounds) {
    entry.min = [Infinity, Infinity, Infinity]
    entry.max = [-Infinity, -Infinity, -Infinity]
    values.forEach((v, i) => {
      entry.min[i % 3] = Math.min(entry.min[i % 3], v)
      entry.max[i % 3] = Math.max(entry.max[i % 3], v)
    })
  }
  return asset.accessors.push(entry) - 1
}
for (const part of parts) {
  if (part.material < 0) throw Error('Missing source material')
  const mesh =
    asset.meshes.push({
      primitives: [
        {
          attributes: {
            POSITION: attribute(part.vertices, true),
            NORMAL: attribute(part.normals),
          },
          material: part.material,
        },
      ],
    }) - 1
  asset.scenes[0].nodes.push(
    asset.nodes.push({ name: 'PLAYER_SHIP_HULL_' + mesh, mesh }) - 1,
  )
}
asset.buffers.push({ byteLength: offset })
const json = Buffer.from(JSON.stringify(asset))
const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20)
json.copy(padded)
const header = Buffer.alloc(28)
header.writeUInt32LE(0x46546c67)
header.writeUInt32LE(2, 4)
header.writeUInt32LE(28 + padded.length + offset, 8)
header.writeUInt32LE(padded.length, 12)
header.writeUInt32LE(0x4e4f534a, 16)
const binHeader = Buffer.alloc(8)
binHeader.writeUInt32LE(offset)
binHeader.writeUInt32LE(0x004e4942, 4)
const result = Buffer.concat([
  header.subarray(0, 20),
  padded,
  binHeader,
  ...chunks,
])
writeFileSync(
  new URL('../../public/models/cruz-del-sur-player-hull.glb', import.meta.url),
  result,
)
const report = {
  translation,
  scale,
  cutters,
  triangles: parts.reduce((n, p) => n + p.vertices.length / 9, 0),
  batches: parts.length,
  bytes: result.length,
  sourcePreserved: true,
}
writeFileSync(
  new URL(
    '../../docs/assets/cruz-del-sur-exterior/player-hull-fit.json',
    import.meta.url,
  ),
  JSON.stringify(report, null, 2),
)
console.log(report)
