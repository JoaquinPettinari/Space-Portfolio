// @vitest-environment node
import { readFileSync } from 'node:fs'
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import {
  readUnifiedCollision,
  UNIFIED_COLLISION_ASSET,
  UNIFIED_ENVELOPE_ASSET,
  UNIFIED_ARRIVAL_ASSET,
} from './unifiedShipAssets'
import { ARRIVAL_FLOOR_HULLS } from './arrivalRoomLayout'
import { TERMINAL_SCREENS } from '../interaction/station'

async function load(path: string) {
  const bytes = readFileSync(new URL('../../../public' + path, import.meta.url))
  const metadata = JSON.parse(
    bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)),
  )
  const gltf = await new GLTFLoader().parseAsync(
    new Uint8Array(bytes).buffer,
    '',
  )
  gltf.scene.updateMatrixWorld(true)
  return { bytes, metadata, ...gltf }
}
function release(scene: import('three').Object3D) {
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return
    object.geometry.dispose()
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material]
    materials.forEach((material) => material.dispose())
  })
}

it('loads the retained arrival furnishings without the old room roof or reference terminal', () => {
  const bytes = readFileSync(
    new URL('../../../public' + UNIFIED_ARRIVAL_ASSET, import.meta.url),
  )
  const metadata = JSON.parse(
    bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)),
  )
  expect(bytes.length).toBeLessThan(8_000_000)
  expect(metadata.meshes.length).toBeLessThanOrEqual(16)
  expect(metadata.cameras).toBeUndefined()
  expect(metadata.extensions?.KHR_lights_punctual).toBeUndefined()
  let triangles = 0
  for (const mesh of metadata.meshes)
    for (const primitive of mesh.primitives) {
      triangles += metadata.accessors[primitive.indices].count / 3
      const bounds = metadata.accessors[primitive.attributes.POSITION]
      expect(bounds.min[2]).toBeGreaterThan(-0.2)
      expect(bounds.max[2]).toBeLessThan(6.4)
      expect(bounds.max[1]).toBeLessThan(3.2)
    }
  expect(triangles).toBeLessThan(70_000)
  for (const node of metadata.nodes)
    expect(node.extras?.interaction).toBeUndefined()
})

it('uses an inexpensive structural collider with free circulation and door sweep', async () => {
  const { scene, bytes, metadata } = await load(UNIFIED_COLLISION_ASSET)
  try {
    expect(bytes.length).toBeLessThan(120_000)
    expect(metadata.meshes).toHaveLength(1)
    expect(metadata.images).toBeUndefined()
    const shape = readUnifiedCollision(scene)
    expect(shape.indices.length / 3).toBeLessThan(2500)
    expect(Array.from(shape.vertices).every(Number.isFinite)).toBe(true)
    expect(ARRIVAL_FLOOR_HULLS).toHaveLength(12)
    for (const floor of ARRIVAL_FLOOR_HULLS)
      for (let i = 1; i < floor.length; i += 3)
        expect(floor[i]).toBeLessThanOrEqual(0.0001)
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material]
        materials.forEach((material) => (material.side = DoubleSide))
      }
    })
    const hits = (p: Vector3, d: Vector3, far: number) =>
      new Raycaster(p, d, 0, far).intersectObjects(scene.children, true)
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
            `moving leaf at ${y}, ${z}`,
          ).toHaveLength(0)
    // The new arrival side floor is upward facing and supported at its real height.
    const floor = hits(new Vector3(4.8, 0.5, 15), new Vector3(0, -1, 0), 1)
    expect(floor.length).toBeGreaterThan(0)
    expect(floor[0].point.y).toBeCloseTo(-0.005, 3)
    expect(floor[0].face?.normal.y).toBeGreaterThan(0.99)
    // Structural sides stop a lateral push; they are not the old hidden X=4.2 wall.
    const right = hits(new Vector3(0, 1.7, 15), new Vector3(1, 0, 0), 7)
    expect(right.length).toBeGreaterThan(0)
    expect(right[0].point.x).toBeGreaterThan(3.5)
    expect(right[0].point.x).toBeLessThan(5.5)
  } finally {
    release(scene)
  }
})

it('exports spatial batches with cheap glass and does not obscure the real Crew Access screen', async () => {
  const { scene, bytes, metadata } = await load(UNIFIED_ENVELOPE_ASSET)
  try {
    expect(bytes.length).toBeLessThan(9_000_000)
    expect(metadata.meshes.length).toBeLessThanOrEqual(36)
    expect(metadata.images).toBeUndefined()
    expect(metadata.cameras).toBeUndefined()
    expect(metadata.extensions?.KHR_lights_punctual).toBeUndefined()
    let triangles = 0,
      glass = 0
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      triangles +=
        (object.geometry.index?.count ??
          object.geometry.attributes.position.count) / 3
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      for (const material of materials)
        if (material.transparent) {
          glass++
          expect(material).toBeInstanceOf(MeshBasicMaterial)
          expect(material.opacity).toBeLessThan(0.06)
        }
    })
    expect(triangles).toBeLessThan(125_000)
    expect(glass).toBe(1)
    const screen = TERMINAL_SCREENS.crew
    const normal = new Vector3(
      Math.sin(screen.rotation),
      0,
      Math.cos(screen.rotation),
    )
    for (const x of [-0.45, 0, 0.45])
      for (const y of [-0.45, 0, 0.45]) {
        const point = new Vector3(...screen.position)
        point.x += x * screen.display[0] * Math.cos(screen.rotation)
        point.z -= x * screen.display[0] * Math.sin(screen.rotation)
        point.y += y * screen.display[1]
        const origin = point.clone().addScaledVector(normal, 1.5)
        expect(
          new Raycaster(
            origin,
            normal.clone().negate(),
            0,
            1.49,
          ).intersectObjects(scene.children, true),
        ).toHaveLength(0)
      }
  } finally {
    release(scene)
  }
})
