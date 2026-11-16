import { BufferAttribute, Vector3, type BufferGeometry } from 'three'

/** Give each folded leaf its own UVs and soften its originally flat normals.
 * Positions/indices remain exact; coincident vertices are only associated for
 * shading and component discovery, never welded in the geometry.
 */
export function prepareLeafSurface(geometry: BufferGeometry) {
  const position = geometry.attributes.position
  const parent = Int32Array.from({ length: position.count }, (_, i) => i)
  const find = (start: number): number => {
    let i = start
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]]
      i = parent[i]
    }
    return i
  }
  const join = (a: number, b: number) => {
    parent[find(a)] = find(b)
  }
  const points = new Map<string, number>()
  const representative = new Int32Array(position.count)
  for (let i = 0; i < position.count; i++) {
    const key = [position.getX(i), position.getY(i), position.getZ(i)]
      .map((v) => Math.round(v * 100000))
      .join(',')
    const prior = points.get(key)
    if (prior !== undefined) {
      join(i, prior)
      representative[i] = prior
    } else {
      points.set(key, i)
      representative[i] = i
    }
  }
  const index = geometry.index
  for (let i = 0; i < (index?.count ?? position.count); i += 3) {
    const a = index ? index.getX(i) : i
    join(a, index ? index.getX(i + 1) : i + 1)
    join(a, index ? index.getX(i + 2) : i + 2)
  }
  const bounds = new Map<number, { min: number[]; max: number[] }>()
  for (let i = 0; i < position.count; i++) {
    const root = find(i)
    const box = bounds.get(root) ?? {
      min: [Infinity, Infinity, Infinity],
      max: [-Infinity, -Infinity, -Infinity],
    }
    for (let axis = 0; axis < 3; axis++) {
      const value = position.getComponent(i, axis)
      box.min[axis] = Math.min(box.min[axis], value)
      box.max[axis] = Math.max(box.max[axis], value)
    }
    bounds.set(root, box)
  }
  const axes = new Map<number, number[]>()
  for (const [root, box] of bounds)
    axes.set(
      root,
      [0, 1, 2]
        .sort((a, b) => box.max[b] - box.min[b] - (box.max[a] - box.min[a]))
        .slice(0, 2),
    )
  const uv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i++) {
    const root = find(i),
      box = bounds.get(root)!,
      projection = axes.get(root)!
    for (let j = 0; j < 2; j++) {
      const axis = projection[j],
        span = box.max[axis] - box.min[axis]
      uv[i * 2 + j] =
        span > 1e-6
          ? (position.getComponent(i, axis) - box.min[axis]) / span
          : 0.5
    }
  }
  geometry.setAttribute('uv', new BufferAttribute(uv, 2))
  // Area-weighted normals across each folded fan remove the paper-like facets.
  // Keep the original outline and fold ridge geometry, including both leaf sides.
  const normals = new Float32Array(position.count * 3)
  const a = new Vector3(),
    b = new Vector3(),
    c = new Vector3(),
    face = new Vector3(),
    edge = new Vector3()
  for (let i = 0; i < (index?.count ?? position.count); i += 3) {
    const ia = index ? index.getX(i) : i,
      ib = index ? index.getX(i + 1) : i + 1,
      ic = index ? index.getX(i + 2) : i + 2
    a.fromBufferAttribute(position, ia)
    b.fromBufferAttribute(position, ib)
    c.fromBufferAttribute(position, ic)
    face.subVectors(b, a).cross(edge.subVectors(c, a))
    for (const vertex of [ia, ib, ic]) {
      const at = representative[vertex] * 3
      normals[at] += face.x
      normals[at + 1] += face.y
      normals[at + 2] += face.z
    }
  }
  const output = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i++) {
    face.fromArray(normals, representative[i] * 3)
    if (face.lengthSq() < 1e-12)
      face.fromBufferAttribute(geometry.attributes.normal, i)
    face.normalize().toArray(output, i * 3)
  }
  geometry.setAttribute('normal', new BufferAttribute(output, 3))
}
