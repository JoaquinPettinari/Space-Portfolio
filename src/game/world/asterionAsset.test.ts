// @vitest-environment node
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import {
  BackSide,
  Box3,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  SphereGeometry,
  Vector3,
} from 'three'
import { expect, it } from 'vitest'
import { loadTacticalSource } from '../../../scripts/assets/tacticalSources'
import {
  ASTERION_MODEL,
  ASTERION_SKY_RADIUS,
  EXTERIOR_CAMERA_FAR,
} from './asterionModel'
import manifest from './asterionManifest.json'
import { ASTERION_MAX_DRIFT } from './asterionMotion'

it('ships the baked lighting once, without runtime lights, animation or external images', () => {
  const url = new URL('../../../public' + ASTERION_MODEL, import.meta.url)
  const bytes = readFileSync(url)
  expect(
    gunzipSync(readFileSync(new URL(url.href + '.gz'))).equals(bytes),
  ).toBe(true)
  const asset = JSON.parse(
    bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)),
  ) as {
    animations?: unknown[]
    cameras?: unknown[]
    extensions?: Record<string, unknown>
    materials: {
      name?: string
      alphaMode?: string
      doubleSided?: boolean
      extensions?: Record<string, unknown>
    }[]
    images: { bufferView?: number; uri?: string; mimeType?: string }[]
  }
  expect(asset.animations).toBeUndefined()
  expect(asset.cameras).toBeUndefined()
  expect(asset.extensions?.KHR_lights_punctual).toBeUndefined()
  expect(
    asset.materials.every(
      (material) => material.extensions?.KHR_materials_unlit !== undefined,
    ),
  ).toBe(true)
  expect(asset.images.length).toBeGreaterThan(0)
  expect(
    asset.images.every(
      (image) =>
        image.bufferView !== undefined &&
        !image.uri &&
        image.mimeType === 'image/webp',
    ),
  ).toBe(true)
  const ring = asset.materials.find(
    (material) => material.name === manifest.ringMaterial,
  )
  expect(ring?.alphaMode).toBe('BLEND')
  expect(ring?.doubleSided).toBe(true)
})

it('preserves the complete world geometry within camera range from every interior extremity', async () => {
  const { scene } = await loadTacticalSource(
    new URL('../../../public' + ASTERION_MODEL, import.meta.url),
  )
  try {
    const bounds = new Box3().setFromObject(scene)
    const centers: Vector3[] = []
    scene.traverse((object) => {
      if (object instanceof Mesh)
        centers.push(object.getWorldPosition(new Vector3()))
    })
    for (const body of manifest.bodies) {
      const authored = new Vector3().fromArray(body.position)
      expect(
        centers.some((center) => center.distanceTo(authored) < 0.0001),
      ).toBe(true)
    }
    const nacre = manifest.bodies.find((body) => body.name.startsWith('NACRE'))!
    let rings: Mesh | undefined
    scene.traverse((object) => {
      if (object instanceof Mesh && object.name.endsWith('Nacre_rings'))
        rings = object
    })
    expect(rings).toBeDefined()
    expect(
      rings!
        .getWorldPosition(new Vector3())
        .distanceTo(new Vector3().fromArray(nacre.position)),
    ).toBeLessThan(0.0001)
    for (const atmosphere of manifest.atmosphere) {
      const body = manifest.bodies.find(
        (candidate) => atmosphere.name === `${candidate.name} / atmosphere`,
      )
      expect(body).toBeDefined()
      expect(atmosphere.position).toEqual(body!.position)
      expect(atmosphere.radius).toBeGreaterThan(body!.radius)
    }
    for (let axis = 0; axis < 3; axis++) {
      expect(bounds.min.getComponent(axis)).toBeCloseTo(
        manifest.boundsMin[axis],
        2,
      )
      expect(bounds.max.getComponent(axis)).toBeCloseTo(
        manifest.boundsMax[axis],
        2,
      )
    }
    // Conservative envelope includes all walkable positions, seat cameras and airlock.
    for (const x of [-7, 7])
      for (const y of [0, 4])
        for (const z of [-12, 22]) {
          const eye = new Vector3(x, y, z)
          for (const body of manifest.bodies) {
            const center = new Vector3().fromArray(body.position)
            expect(
              center.distanceTo(eye) + body.radius + ASTERION_MAX_DRIFT,
            ).toBeLessThan(EXTERIOR_CAMERA_FAR)
            expect(
              center.distanceTo(eye) - body.radius - ASTERION_MAX_DRIFT,
            ).toBeGreaterThan(25)
          }
        }
    // Use real vertices: the merged debris field's empty bounding-box corners
    // must not force a larger camera range. Each axis selects the farthest eye extreme.
    let farthestVertex = 0
    const vertex = new Vector3()
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      const positions = object.geometry.attributes.position
      for (let index = 0; index < positions.count; index++) {
        vertex
          .fromBufferAttribute(positions, index)
          .applyMatrix4(object.matrixWorld)
        const dx = Math.max(Math.abs(vertex.x + 7), Math.abs(vertex.x - 7))
        const dy = Math.max(Math.abs(vertex.y), Math.abs(vertex.y - 4))
        const dz = Math.max(Math.abs(vertex.z + 12), Math.abs(vertex.z - 22))
        farthestVertex = Math.max(farthestVertex, Math.hypot(dx, dy, dz))
      }
    })
    expect(farthestVertex + ASTERION_MAX_DRIFT).toBeLessThan(
      EXTERIOR_CAMERA_FAR,
    )
    expect(ASTERION_SKY_RADIUS).toBeLessThan(EXTERIOR_CAMERA_FAR)
  } finally {
    const geometries = new Set<import('three').BufferGeometry>()
    scene.traverse((object) => {
      if (object instanceof Mesh) geometries.add(object.geometry)
    })
    geometries.forEach((geometry) => geometry.dispose())
  }
})

it('maps the approved panorama forward and side directions without mirroring', () => {
  const geometry = new SphereGeometry(40, 48, 24)
  const material = new MeshBasicMaterial({ side: BackSide })
  const sky = new Mesh(geometry, material)
  sky.rotation.y = manifest.skyRotationY
  sky.updateMatrixWorld(true)
  for (const [direction, u] of [
    [new Vector3(0, 0, -1), 0.5],
    [new Vector3(1, 0, 0), 0.75],
    [new Vector3(-1, 0, 0), 0.25],
  ] as const) {
    const hit = new Raycaster(new Vector3(), direction).intersectObject(sky)[0]
    expect(1 - hit.uv!.x).toBeCloseTo(u, 4)
    expect(hit.uv?.y).toBeCloseTo(0.5, 4)
  }
  geometry.dispose()
  material.dispose()
})
