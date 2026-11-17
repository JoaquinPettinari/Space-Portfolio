// @vitest-environment node
import { readFileSync } from 'node:fs'
import { DoubleSide, Group, Mesh, Raycaster, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import { TERMINAL_SCREENS } from '../interaction/station'
import { ARRIVAL_ORIGIN_Z } from './arrivalRoomLayout'
import {
  createConsoleScreenGeometry,
  REFINED_ARRIVAL_ASSET,
  REFINED_BRIDGE_ASSET,
  REFINED_DETAILS_ASSET,
} from './refinedArtAssets'

type AssetDocument = {
  meshes: { primitives: { indices: number }[] }[]
  accessors: { count: number }[]
  nodes: { extras?: { interaction?: string } }[]
  images?: { uri?: string }[]
  textures?: unknown[]
  samplers?: unknown[]
  cameras?: unknown[]
  extensions?: { KHR_lights_punctual?: unknown }
  materials: {
    normalTexture?: unknown
    occlusionTexture?: unknown
    emissiveTexture?: unknown
    pbrMetallicRoughness?: {
      baseColorTexture?: unknown
      metallicRoughnessTexture?: unknown
    }
  }[]
}

function asset(path: string) {
  const bytes = readFileSync(new URL('../../../public' + path, import.meta.url))
  const jsonLength = bytes.readUInt32LE(12)
  const metadata = JSON.parse(
    bytes.toString('utf8', 20, 20 + jsonLength),
  ) as AssetDocument
  return { bytes, jsonLength, metadata }
}

it('ships bounded room/material batches without preview lights, cameras or external texture URLs', () => {
  for (const [path, maxBytes, maxMeshes, maxTriangles] of [
    [REFINED_BRIDGE_ASSET, 22_000_000, 52, 250_000],
    // Reference dressing includes ceiling, cloth and solid foliage. Measured
    // runtime cost is recorded in docs/audits/cabin-reference, not inferred here.
    [REFINED_ARRIVAL_ASSET, 7_200_000, 28, 125_000],
    [REFINED_DETAILS_ASSET, 2_500_000, 42, 25_000],
  ] as const) {
    const { bytes, metadata } = asset(path)
    expect(bytes.length).toBeLessThan(maxBytes)
    expect(metadata.meshes.length).toBeLessThanOrEqual(maxMeshes)
    expect(metadata.cameras).toBeUndefined()
    expect(metadata.extensions?.KHR_lights_punctual).toBeUndefined()
    let triangles = 0
    for (const mesh of metadata.meshes)
      for (const primitive of mesh.primitives)
        triangles += metadata.accessors[primitive.indices].count / 3
    expect(triangles).toBeLessThan(maxTriangles)
    for (const image of metadata.images ?? []) expect(image.uri).toBeUndefined()
  }
  const { metadata } = asset(REFINED_BRIDGE_ASSET)
  for (const interaction of [
    'computer',
    'communications',
    'personal',
    'arcade',
  ])
    expect(
      metadata.nodes.filter(
        (n: { extras?: { interaction?: string } }) =>
          n.extras?.interaction === interaction,
      ),
    ).toHaveLength(5)
})

/** Load actual exported vertices/indices; omit texture decoding only in Node.
 * Browser coverage separately exercises the original embedded WebP materials.
 */
async function geometryOnly(path: string) {
  const { bytes, jsonLength, metadata } = asset(path)
  delete metadata.images
  delete metadata.textures
  delete metadata.samplers
  for (const material of metadata.materials) {
    delete material.normalTexture
    delete material.occlusionTexture
    delete material.emissiveTexture
    delete material.pbrMetallicRoughness?.baseColorTexture
    delete material.pbrMetallicRoughness?.metallicRoughnessTexture
  }
  const encoded = Buffer.from(JSON.stringify(metadata))
  const padded = Buffer.concat([
    encoded,
    Buffer.alloc((4 - (encoded.length % 4)) % 4, 32),
  ])
  const tail = bytes.subarray(20 + jsonLength)
  const header = Buffer.alloc(20)
  for (const [offset, value] of [
    [0, 0x46546c67],
    [4, 2],
    [8, 20 + padded.length + tail.length],
    [12, padded.length],
    [16, 0x4e4f534a],
  ])
    header.writeUInt32LE(value, offset)
  const { scene } = await new GLTFLoader().parseAsync(
    new Uint8Array(Buffer.concat([header, padded, tail])).buffer,
    '',
  )
  scene.traverse((o) => {
    if (o instanceof Mesh)
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        m.side = DoubleSide
  })
  return scene
}

it('keeps imported art clear of the arrival route, door sweep and live terminal focus rays', async () => {
  const root = new Group()
  const bridge = await geometryOnly(REFINED_BRIDGE_ASSET)
  const arrival = await geometryOnly(REFINED_ARRIVAL_ASSET)
  arrival.position.z = ARRIVAL_ORIGIN_Z
  root.add(bridge, arrival, await geometryOnly(REFINED_DETAILS_ASSET))
  root.updateMatrixWorld(true)
  const hits = (origin: Vector3, direction: Vector3, far: number) =>
    new Raycaster(origin, direction, 0, far).intersectObject(root, true)
  try {
    // Both perimeter plates and centre maintenance hatches must receive the
    // deck finish; the raised black backing previously concealed the metal.
    for (const [x, z] of [
      [-3, 15.07],
      [0, 14],
      [0, 16],
    ]) {
      const surface = hits(
        new Vector3(x, 0.25, z),
        new Vector3(0, -1, 0),
        0.5,
      )[0]
      expect(surface).toBeDefined()
      expect(surface.point.y).toBeGreaterThanOrEqual(-0.001)
      expect(surface.point.y).toBeLessThan(0.025)
      expect(surface.object.name).toContain('Graphite_deck')
    }
    const well = hits(new Vector3(2, 0.25, 14), new Vector3(0, -1, 0), 0.5)[0]
    expect(well.point.y).toBeLessThan(-0.02)
    expect(well.object.name).toContain('Graphite_frame')
    for (const x of [-0.75, 0, 0.75])
      for (const y of [0.5, 1.7, 2.35])
        expect(
          hits(new Vector3(x, y, 17.5), new Vector3(0, 0, -1), 12.1),
        ).toHaveLength(0)
    for (const z of [11.54, 11.65, 11.76])
      for (const y of [0.3, 1.5, 2.35])
        for (const side of [-1, 1])
          expect(
            hits(new Vector3(0, y, z), new Vector3(side, 0, 0), 2.74),
          ).toHaveLength(0)
    // Inspect the actual exported furniture, not just its collider constants.
    const benchFaces = [15.2, 16.05, 16.9].map((z) => {
      const hit = hits(new Vector3(-2, 0.28, z), new Vector3(-1, 0, 0), 2)[0]
      expect(hit).toBeDefined()
      return hit.point.x
    })
    expect(Math.max(...benchFaces) - Math.min(...benchFaces)).toBeLessThan(
      0.002,
    )
    expect(
      hits(new Vector3(3.1, 0.4, 14.6), new Vector3(0, 0, 1), 1),
    ).toHaveLength(0)
    for (const kind of [
      'computer',
      'communications',
      'personal',
      'arcade',
      'crew',
    ] as const) {
      const screen = TERMINAL_SCREENS[kind]
      const normal = new Vector3(
        Math.sin(screen.rotation),
        0,
        Math.cos(screen.rotation),
      )
      const center = new Vector3(...screen.position)
      expect(
        hits(
          center.clone().addScaledVector(normal, 1.5),
          normal.clone().negate(),
          1.3,
        ),
        kind,
      ).toHaveLength(0)
    }
  } finally {
    root.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose()
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          m.dispose()
      }
    })
  }
})

it('selects four distinct screen panels without duplicating texture data', () => {
  for (const [kind, x, y] of [
    ['personal', 0, 0],
    ['arcade', 0.5, 0],
    ['computer', 0, 0.5],
    ['communications', 0.5, 0.5],
  ] as const) {
    const geometry = createConsoleScreenGeometry(kind, 1.1, 0.8)
    try {
      const uv = geometry.attributes.uv
      expect(
        Math.min(...Array.from({ length: uv.count }, (_, i) => uv.getX(i))),
      ).toBe(x)
      expect(
        Math.min(...Array.from({ length: uv.count }, (_, i) => uv.getY(i))),
      ).toBe(y)
      expect(geometry.index!.count).toBe(6)
    } finally {
      geometry.dispose()
    }
  }
})
