import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  Vector3,
  type Object3D,
} from 'three'
import {
  TRANSITION_CLEARANCES,
  type Clearance,
} from '../../src/game/world/transitionLayout.ts'

// World position comes first, followed by all original vertex attributes.
type Vertex = number[]
function half(
  polygon: Vertex[],
  axis: number,
  bound: number,
  positive: boolean,
) {
  const result: Vertex[] = []
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const da = (a[axis] - bound) * (positive ? 1 : -1)
    const db = (b[axis] - bound) * (positive ? 1 : -1)
    if (da >= 0) result.push(a)
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db)
      result.push(a.map((value, j) => value + (b[j] - value) * t))
    }
  }
  return result
}

function subtract(polygon: Vertex[], box: Clearance) {
  let inside = polygon
  const outside: Vertex[][] = []
  for (let axis = 0; axis < 3 && inside.length; axis++) {
    const low = half(inside, axis, box.min[axis], false)
    if (low.length >= 3) outside.push(low)
    inside = half(inside, axis, box.min[axis], true)
    const high = half(inside, axis, box.max[axis], true)
    if (high.length >= 3) outside.push(high)
    inside = half(inside, axis, box.max[axis], false)
  }
  return outside
}

/** Cut triangles rather than whole material batches, retaining neighboring art. */
function cutGeometry(
  mesh: Mesh,
  clearances: readonly Clearance[],
  wholeComponents = false,
): BufferGeometry | undefined {
  const source = mesh.geometry
  const position = source.getAttribute('position')
  const index = source.index
  const point = new Vector3()
  const bounds = new Box3()
  for (let i = 0; i < position.count; i++)
    bounds.expandByPoint(point.fromBufferAttribute(position, i))
  bounds.applyMatrix4(mesh.matrixWorld)
  const boxes = clearances.filter((box) =>
    bounds.intersectsBox(
      new Box3(new Vector3(...box.min), new Vector3(...box.max)),
    ),
  )
  if (!boxes.length) return
  const world = Array.from({ length: position.count }, (_, i) =>
    point
      .fromBufferAttribute(position, i)
      .applyMatrix4(mesh.matrixWorld)
      .toArray(),
  )
  // Weld position seams so an entire authored solid is removed or preserved.
  const rejected = new Set<number>()
  if (wholeComponents) {
    const parent = Array.from({ length: position.count }, (_, i) => i)
    const find = (i: number): number => {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]]
        i = parent[i]
      }
      return i
    }
    const join = (a: number, b: number) => {
      parent[find(a)] = find(b)
    }
    const positions = new Map<string, number>()
    for (let i = 0; i < world.length; i++) {
      const key = world[i].map((v) => Math.round(v * 1e6)).join(',')
      const previous = positions.get(key)
      if (previous !== undefined) join(i, previous)
      else positions.set(key, i)
    }
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      const a = index ? index.getX(i) : i
      join(a, index ? index.getX(i + 1) : i + 1)
      join(a, index ? index.getX(i + 2) : i + 2)
    }
    const componentBounds = new Map<number, Box3>()
    world.forEach((p, i) => {
      const root = find(i)
      let bound = componentBounds.get(root)
      if (!bound) {
        bound = new Box3()
        componentBounds.set(root, bound)
      }
      bound.expandByPoint(point.fromArray(p))
    })
    const removedRoots = new Set<number>()
    for (const [root, bound] of componentBounds)
      if (
        boxes.some((box) =>
          new Box3(
            new Vector3(...box.min),
            new Vector3(...box.max),
          ).containsBox(bound),
        )
      )
        removedRoots.add(root)
    for (let i = 0; i < parent.length; i++)
      if (removedRoots.has(find(i))) rejected.add(i)
  }
  const attributes = Object.entries(source.attributes)
  const output = attributes.map(() => [] as number[])
  const result = new BufferGeometry()
  let changed = false
  let vertexCount = 0
  const edgeA = new Vector3()
  const edgeB = new Vector3()
  for (let i = 0; i < (index?.count ?? position.count); i += 3) {
    if (wholeComponents && rejected.has(index ? index.getX(i) : i)) {
      changed = true
      continue
    }
    const triangle = [0, 1, 2].map((corner) => {
      const id = index ? index.getX(i + corner) : i + corner
      return [
        ...world[id],
        ...attributes.flatMap(([, attribute]) =>
          Array.from({ length: attribute.itemSize }, (_, j) =>
            attribute.getComponent(id, j),
          ),
        ),
      ]
    })
    let polygons = [triangle]
    for (const box of wholeComponents ? [] : boxes) {
      // Do not split adjacent triangles lying wholly outside the replacement.
      polygons = polygons.flatMap((polygon) => {
        if (
          [0, 1, 2].some(
            (axis) =>
              polygon.every((v) => v[axis] <= box.min[axis]) ||
              polygon.every((v) => v[axis] >= box.max[axis]),
          )
        )
          return [polygon]
        changed = true
        return subtract(polygon, box)
      })
    }
    const start = vertexCount
    for (const polygon of polygons) {
      for (let j = 1; j < polygon.length - 1; j++) {
        const vertices = [polygon[0], polygon[j], polygon[j + 1]]
        edgeA.set(
          vertices[1][0] - vertices[0][0],
          vertices[1][1] - vertices[0][1],
          vertices[1][2] - vertices[0][2],
        )
        edgeB.set(
          vertices[2][0] - vertices[0][0],
          vertices[2][1] - vertices[0][1],
          vertices[2][2] - vertices[0][2],
        )
        if (edgeA.cross(edgeB).lengthSq() < 1e-16) continue
        for (const vertex of vertices) {
          let offset = 3
          attributes.forEach(([name, attribute], k) => {
            const values = vertex.slice(offset, offset + attribute.itemSize)
            if (name === 'normal')
              point.fromArray(values).normalize().toArray(values)
            output[k].push(...values)
            offset += attribute.itemSize
          })
        }
        vertexCount += 3
      }
    }
    if (source.groups.length && vertexCount > start) {
      const materialIndex =
        source.groups.find(
          (group) => i >= group.start && i < group.start + group.count,
        )?.materialIndex ?? 0
      const previous = result.groups.at(-1)
      if (previous?.materialIndex === materialIndex)
        previous.count += vertexCount - start
      else result.addGroup(start, vertexCount - start, materialIndex)
    }
  }
  if (!changed) {
    result.dispose()
    return
  }
  attributes.forEach(([name, attribute], i) =>
    result.setAttribute(
      name,
      new Float32BufferAttribute(output[i], attribute.itemSize),
    ),
  )
  result.computeBoundingBox()
  result.computeBoundingSphere()
  return result
}

/** Owns only replacement geometry. Cached materials, textures and source stay intact. */
export function prepareTransitionReplacement(
  source: Object3D,
  clearances: readonly Clearance[] = TRANSITION_CLEARANCES,
  include: (mesh: Mesh) => boolean = (mesh) =>
    /^(REFINED_bridge_static_|UNIFIED_RUNTIME_(bridge|connector)_)/.test(
      mesh.name,
    ),
  wholeComponents = false,
) {
  const root = source.clone(true)
  root.updateMatrixWorld(true)
  const geometries: BufferGeometry[] = []
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !include(node)) return
    const geometry = cutGeometry(node, clearances, wholeComponents)
    if (geometry) {
      node.geometry = geometry
      geometries.push(geometry)
    }
  })
  return {
    root,
    dispose: () => geometries.forEach((geometry) => geometry.dispose()),
  }
}
