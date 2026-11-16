// @vitest-environment node
import { readFileSync } from 'node:fs'
import {
  Box3,
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector3,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it, vi } from 'vitest'
import {
  createTacticalShipModel,
  TACTICAL_SHIP_LENGTH,
  skipTacticalVisualRaycast,
} from './tacticalShipModel'
import { UNIFIED_ENVELOPE_ASSET } from './unifiedShipAssets'

it('uses the actual unified ship silhouette, keeps every triangle and never disposes cached resources', async () => {
  const bytes = readFileSync(
    new URL('../../../public' + UNIFIED_ENVELOPE_ASSET, import.meta.url),
  )
  const { scene } = await new GLTFLoader().parseAsync(
    new Uint8Array(bytes).buffer,
    '',
  )
  const originals: Mesh[] = []
  scene.traverse((o) => {
    if (o instanceof Mesh) originals.push(o)
  })
  const positions = originals.map((o) =>
    o.geometry.getAttribute('position').array.slice(),
  )
  const matrices = originals.map((o) => o.matrixWorld.clone())
  const geometryDisposals = originals.map((o) =>
    vi.spyOn(o.geometry, 'dispose'),
  )
  const materials = new Set(
    originals.flatMap((o) =>
      Array.isArray(o.material) ? o.material : [o.material],
    ),
  )
  const materialDisposals = [...materials].map((m) => vi.spyOn(m, 'dispose'))
  const model = createTacticalShipModel(scene)
  const sourceTriangles = originals.reduce(
    (sum, o) => sum + o.geometry.index!.count / 3,
    0,
  )
  try {
    originals.forEach((o, i) =>
      expect(o.matrixWorld.equals(matrices[i])).toBe(true),
    )
    expect(model.sourceMeshCount).toBe(originals.length)
    expect(model.triangleCount).toBe(sourceTriangles)
    expect(model.surface.groups).toHaveLength(0)
    expect(Object.keys(model.surface.attributes)).toEqual(['position'])
    expect(Math.max(...model.size.toArray())).toBeCloseTo(
      TACTICAL_SHIP_LENGTH,
      5,
    )
    const bounds = model.surface.boundingBox!
    expect(bounds.min.y).toBeCloseTo(0, 6)
    const center = bounds.getCenter(new Vector3())
    expect(center.x).toBeCloseTo(0, 6)
    expect(center.z).toBeCloseTo(0, 6)
    const sourceBounds = new Box3().setFromObject(scene).getSize(new Vector3())
    const factor = TACTICAL_SHIP_LENGTH / Math.max(...sourceBounds.toArray())
    expect(
      model.size.distanceTo(sourceBounds.multiplyScalar(factor)),
    ).toBeLessThan(0.00001)
    expect(model.edgeSegments).toBeGreaterThan(0)
    expect(model.edgeSegments).toBeLessThan(10_000)
    originals.forEach((o, i) => {
      expect(o.geometry.getAttribute('position').array).toEqual(positions[i])
    })
  } finally {
    const surfaceDispose = vi.spyOn(model.surface, 'dispose'),
      edgesDispose = vi.spyOn(model.edges, 'dispose')
    model.dispose()
    expect(surfaceDispose).toHaveBeenCalledOnce()
    expect(edgesDispose).toHaveBeenCalledOnce()
    geometryDisposals.forEach((spy) => expect(spy).not.toHaveBeenCalled())
    materialDisposals.forEach((spy) => expect(spy).not.toHaveBeenCalled())
    originals.forEach((o) => o.geometry.dispose())
    materials.forEach((m) => m.dispose())
  }
  console.log(
    'TACTICAL_SHIP_GEOMETRY',
    JSON.stringify({
      sourceBytes: bytes.length,
      sourceMeshes: model.sourceMeshCount,
      triangles: model.triangleCount,
      edgeSegments: model.edgeSegments,
      renderPasses: 2,
      dimensions: model.size.toArray(),
    }),
  )
})

it('bakes nested transforms into its own model while leaving source matrices untouched', () => {
  const root = new Group(),
    parent = new Group(),
    geometry = new BoxGeometry(2, 1, 4),
    material = new MeshBasicMaterial()
  parent.position.set(12, 3, -8)
  parent.rotation.y = 0.4
  const mesh = new Mesh(geometry, material)
  mesh.position.set(1, 2, 0)
  parent.add(mesh)
  root.add(parent)
  const matrix = mesh.matrixWorld.clone(),
    positions = geometry.getAttribute('position').array.slice()
  const model = createTacticalShipModel(root)
  try {
    expect(mesh.matrixWorld.equals(matrix)).toBe(true)
    expect(geometry.getAttribute('position').array).toEqual(positions)
    expect(model.surface.boundingBox!.min.y).toBeCloseTo(0)
    expect(model.triangleCount).toBe(12)
    expect(model.surface).not.toBe(geometry)
  } finally {
    model.dispose()
    geometry.dispose()
    material.dispose()
  }
})

it('picks the invisible cheap proxy without traversing the full miniature visual', () => {
  const root = new Group(),
    visual = new Group()
  const geometry = new BoxGeometry(1, 1, 1),
    material = new MeshBasicMaterial()
  const detailed = new Mesh(geometry, material)
  const detailedPick = vi.spyOn(detailed, 'raycast')
  visual.raycast = skipTacticalVisualRaycast
  visual.add(detailed)
  const proxyMaterial = new MeshBasicMaterial({ visible: false })
  const proxy = new Mesh(geometry, proxyMaterial)
  root.userData.interaction = 'tactical'
  root.add(visual, proxy)
  root.updateMatrixWorld(true)
  const ray = new Raycaster(new Vector3(0, 0, 2), new Vector3(0, 0, -1), 0, 2.8)
  try {
    const hits = ray.intersectObject(root, true)
    expect(hits[0].object).toBe(proxy)
    expect(hits[0].distance).toBeCloseTo(1.5)
    expect(detailedPick).not.toHaveBeenCalled()
    expect(proxy.material.visible).toBe(false)
  } finally {
    geometry.dispose()
    material.dispose()
    proxyMaterial.dispose()
  }
})
