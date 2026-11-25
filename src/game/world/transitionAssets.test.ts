// @vitest-environment node
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect, it } from 'vitest'
import { TRANSITION_CLEARANCES } from './transitionLayout'
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector3,
} from 'three'

type Asset = {
  nodes: { name: string; mesh?: number }[]
  meshes: {
    primitives: { attributes: { POSITION: number }; indices?: number }[]
  }[]
  accessors: {
    bufferView: number
    byteOffset?: number
    count: number
    componentType: number
  }[]
  bufferViews: {
    byteOffset?: number
    byteLength: number
    byteStride?: number
  }[]
  images?: { bufferView: number }[]
  materials?: unknown[]
}
function load(name: string) {
  const bytes = readFileSync(
    new URL(`../../../public/models/${name}.glb`, import.meta.url),
  )
  const size = bytes.readUInt32LE(12)
  return {
    asset: JSON.parse(bytes.toString('utf8', 20, 20 + size)) as Asset,
    binary: bytes.subarray(28 + size),
  }
}
function imageHashes({ asset, binary }: ReturnType<typeof load>) {
  return (asset.images ?? []).map((image) => {
    const view = asset.bufferViews[image.bufferView]
    return createHash('sha256')
      .update(
        binary.subarray(
          view.byteOffset ?? 0,
          (view.byteOffset ?? 0) + view.byteLength,
        ),
      )
      .digest('hex')
  })
}
it('preserves every embedded image and material while replacing transition geometry offline', () => {
  for (const name of [
    'cruz-del-sur-clean-bridge',
    'cruz-del-sur-vestibule-envelope',
  ]) {
    const source = load(name),
      ready = load(`${name}-transition-ready`)
    expect(imageHashes(ready)).toEqual(imageHashes(source))
    expect(ready.asset.materials).toEqual(source.asset.materials)
    expect(ready.asset.nodes).toEqual(source.asset.nodes)
    let changed = 0
    source.asset.nodes.forEach((node) => {
      if (node.mesh === undefined) return
      const before = source.asset.meshes[node.mesh].primitives[0]
      const after = ready.asset.meshes[node.mesh].primitives[0]
      const a = source.asset.accessors[before.attributes.POSITION]
      const b = ready.asset.accessors[after.attributes.POSITION]
      const av = source.asset.bufferViews[a.bufferView]
      const bv = ready.asset.bufferViews[b.bufferView]
      const aBytes = source.binary.subarray(
        (av.byteOffset ?? 0) + (a.byteOffset ?? 0),
        (av.byteOffset ?? 0) + (a.byteOffset ?? 0) + a.count * 12,
      )
      const bBytes = ready.binary.subarray(
        (bv.byteOffset ?? 0) + (b.byteOffset ?? 0),
        (bv.byteOffset ?? 0) + (b.byteOffset ?? 0) + b.count * 12,
      )
      if (aBytes.equals(bBytes)) return
      changed++
      expect(node.name).toMatch(
        /^(REFINED_bridge_static_|UNIFIED_RUNTIME_(bridge|connector)_)/,
      )
    })
    expect(changed).toBeGreaterThan(0)
  }
})

function collisionView({ asset, binary }: ReturnType<typeof load>) {
  const root = new Group()
  const material = new MeshBasicMaterial({ side: DoubleSide })
  for (const node of asset.nodes) {
    if (
      node.mesh === undefined ||
      !/^(REFINED_bridge_static_|UNIFIED_RUNTIME_(bridge|connector)_)/.test(
        node.name,
      )
    )
      continue
    for (const primitive of asset.meshes[node.mesh].primitives) {
      const accessor = asset.accessors[primitive.attributes.POSITION]
      const view = asset.bufferViews[accessor.bufferView]
      const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
      const positions = Array.from({ length: accessor.count * 3 }, (_, i) =>
        binary.readFloatLE(
          offset + Math.floor(i / 3) * (view.byteStride ?? 12) + (i % 3) * 4,
        ),
      )
      const geometry = new BufferGeometry().setAttribute(
        'position',
        new Float32BufferAttribute(positions, 3),
      )
      if (primitive.indices !== undefined) {
        const index = asset.accessors[primitive.indices]
        const indexView = asset.bufferViews[index.bufferView]
        const start = (indexView.byteOffset ?? 0) + (index.byteOffset ?? 0)
        const width = index.componentType === 5125 ? 4 : 2
        geometry.setIndex(
          Array.from({ length: index.count }, (_, i) =>
            width === 4
              ? binary.readUInt32LE(start + i * width)
              : binary.readUInt16LE(start + i * width),
          ),
        )
      }
      root.add(new Mesh(geometry, material))
    }
  }
  root.updateMatrixWorld(true)
  return {
    root,
    dispose() {
      root.children.forEach((node) => (node as Mesh).geometry.dispose())
      material.dispose()
    },
  }
}

it('exports a clear transition without changing neighboring floor and wall ray hits', () => {
  const down = (root: Group, x: number, z: number) =>
    new Raycaster(new Vector3(x, 5, z), new Vector3(0, -1, 0)).intersectObject(
      root,
      true,
    )
  for (const name of [
    'cruz-del-sur-clean-bridge',
    'cruz-del-sur-vestibule-envelope',
  ]) {
    const source = collisionView(load(name)),
      ready = collisionView(load(`${name}-transition-ready`))
    try {
      let sourceIntrusions = 0
      for (const x of [-1.8, -1, 0.1, 1, 1.8])
        for (const z of [2.2, 2.7, 3.6, 4.6, 5.0]) {
          const relevant = (hit: { point: Vector3 }) =>
            hit.point.y > -0.29 && hit.point.y < 3.39
          sourceIntrusions += down(source.root, x, z).filter(relevant).length
          expect(
            down(ready.root, x, z).filter(relevant),
            `${name} clearance ${x},${z}`,
          ).toHaveLength(0)
        }
      for (const y of [0.3, 1.5, 2.7])
        for (const z of [2.0, 2.2, 3.6, 5.0, 5.2]) {
          const ray = new Raycaster(new Vector3(0, y, z), new Vector3(1, 0, 0))
          const inside = (hit: { point: Vector3 }) =>
            TRANSITION_CLEARANCES.some((box) =>
              hit.point
                .toArray()
                .every(
                  (value, axis) =>
                    value > box.min[axis] + 0.0001 &&
                    value < box.max[axis] - 0.0001,
                ),
            )
          sourceIntrusions += ray
            .intersectObject(source.root, true)
            .filter(inside).length
          expect(
            ray.intersectObject(ready.root, true).filter(inside),
            `${name} side clearance ${y},${z}`,
          ).toHaveLength(0)
        }
      // Sparse hull seams can fall between the regular floor/wall probes.
      // Probe an actual interior triangle centre in every affected batch too.
      for (const node of source.root.children) {
        const geometry = (node as Mesh).geometry
        const position = geometry.getAttribute('position'),
          index = geometry.index
        const a = new Vector3(),
          b = new Vector3(),
          c = new Vector3()
        for (let i = 0; i < (index?.count ?? position.count); i += 3) {
          a.fromBufferAttribute(position, index ? index.getX(i) : i)
          b.fromBufferAttribute(position, index ? index.getX(i + 1) : i + 1)
          c.fromBufferAttribute(position, index ? index.getX(i + 2) : i + 2)
          const center = a
            .clone()
            .add(b)
            .add(c)
            .multiplyScalar(1 / 3)
          if (
            !TRANSITION_CLEARANCES.some((box) =>
              center
                .toArray()
                .every(
                  (value, axis) =>
                    value > box.min[axis] + 0.01 &&
                    value < box.max[axis] - 0.01,
                ),
            )
          )
            continue
          const normal = b.sub(a).cross(c.sub(a)).normalize()
          if (!normal.lengthSq()) continue
          const ray = new Raycaster(
            center.clone().addScaledVector(normal, 0.005),
            normal.negate(),
            0,
            0.01,
          )
          const original = ray.intersectObject(source.root, true)
          expect(original.length).toBeGreaterThan(0)
          sourceIntrusions += original.length
          expect(ray.intersectObject(ready.root, true)).toHaveLength(0)
          break
        }
      }
      expect(
        sourceIntrusions,
        `${name} reproduces old overlap`,
      ).toBeGreaterThan(0)
      let controls = 0
      for (const x of [-3.63, 0.27, 3.63])
        for (const z of [-6.23, -2.23, 1.35, 6.21]) {
          const before = down(source.root, x, z),
            after = down(ready.root, x, z)
          expect(after.length, `${name} neighbor ${x},${z}`).toBe(before.length)
          before.forEach((hit, i) =>
            expect(after[i].point.distanceTo(hit.point)).toBeLessThan(0.00001),
          )
          if (before.length) controls++
        }
      expect(controls).toBeGreaterThan(0)
    } finally {
      source.dispose()
      ready.dispose()
    }
  }
  // Full-resolution GLBs and exact raycasts compete with the parallel suite.
  // Keep a local budget for this asset integration check, not all unit tests.
}, 15_000)
