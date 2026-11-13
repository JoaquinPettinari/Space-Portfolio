import { bridgePoint, BRIDGE_OFFSET_Z } from './bridgePlacement'
// @vitest-environment node
import { readFileSync } from 'node:fs'
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector3,
} from 'three'
import { expect, it } from 'vitest'
import { COMMAND_POSES, COMMAND_SEGMENTS } from './commandLayout'
import { ROOF_PANELS } from './bridgeLayout'
import { stationView, TERMINAL_SCREENS } from '../interaction/station'

it('builds from current console and roof anchors, without duplicating screens', () => {
  const layout = JSON.parse(
    readFileSync(
      new URL('../../../docs/assets/bridge/layout.json', import.meta.url),
      'utf8',
    ),
  )
  expect(layout.roof).toEqual(ROOF_PANELS)
  expect(layout.monitors).toEqual(COMMAND_POSES)
  expect(
    layout.consoles.map((s: { footprint: number[][] }) => s.footprint),
  ).toEqual(COMMAND_SEGMENTS.map((s) => s.footprint))
})

it('the exported architecture leaves both physical monitor focus rays clear', () => {
  const bytes = readFileSync(
    new URL(
      '../../../public/models/cruz-del-sur-bridge-interior.glb',
      import.meta.url,
    ),
  )
  const length = bytes.readUInt32LE(12)
  const asset = JSON.parse(bytes.toString('utf8', 20, 20 + length)) as {
    nodes: { name: string; extras?: { interaction?: string } }[]
    cameras?: unknown[]
    accessors: {
      bufferView: number
      byteOffset?: number
      count: number
      componentType: number
    }[]
    bufferViews: { byteOffset?: number; byteStride?: number }[]
    meshes: {
      primitives: { attributes: { POSITION: number }; indices: number }[]
    }[]
  }
  expect(asset.nodes.every((n) => n.name.startsWith('BRIDGE_RUNTIME_'))).toBe(
    true,
  )
  // Six room materials, three table batches, and three per interactive monitor.
  expect(asset.nodes.length).toBeLessThanOrEqual(21)
  for (const kind of [
    'computer',
    'communications',
    'personal',
    'arcade',
  ] as const) {
    const parts = asset.nodes.filter((n) => n.name.endsWith('_' + kind))
    expect(parts).toHaveLength(3)
    expect(parts.every((n) => n.extras?.interaction === kind)).toBe(true)
  }
  const tacticalDetails = asset.nodes.filter((n) =>
    n.name.endsWith('_tactical'),
  )
  expect(tacticalDetails).toHaveLength(3)
  expect(
    tacticalDetails.every((n) => n.extras?.interaction === 'tactical'),
  ).toBe(true)
  expect(asset.cameras).toBeUndefined()
  const data = (id: number, components: number) => {
    const a = asset.accessors[id],
      v = asset.bufferViews[a.bufferView]
    expect(v.byteStride).toBeUndefined()
    const offset =
      bytes.byteOffset + 28 + length + (v.byteOffset ?? 0) + (a.byteOffset ?? 0)
    return a.componentType === 5126
      ? new Float32Array(bytes.buffer, offset, a.count * components)
      : a.componentType === 5123
        ? new Uint16Array(bytes.buffer, offset, a.count)
        : new Uint32Array(bytes.buffer, offset, a.count)
  }
  const material = new MeshBasicMaterial({ side: DoubleSide })
  const meshes = asset.meshes.flatMap((m) =>
    m.primitives.map((p) => {
      const g = new BufferGeometry()
      g.setAttribute(
        'position',
        new BufferAttribute(data(p.attributes.POSITION, 3), 3),
      )
      g.setIndex(new BufferAttribute(data(p.indices, 1), 1))
      return new Mesh(g, material)
    }),
  )
  try {
    // Frame seals must leave all four live displays clear, including the corners.
    for (const kind of [
      'computer',
      'communications',
      'personal',
      'arcade',
    ] as const) {
      const screen = TERMINAL_SCREENS[kind]
      const normal = new Vector3(
        Math.sin(screen.rotation),
        0,
        Math.cos(screen.rotation),
      )
      for (const sx of [-0.499, 0, 0.499])
        for (const sy of [-0.499, 0, 0.499]) {
          const origin = new Vector3(...screen.position)
          origin.x += sx * screen.display[0] * Math.cos(screen.rotation)
          origin.z -= sx * screen.display[0] * Math.sin(screen.rotation)
          origin.y += sy * screen.display[1]
          origin.addScaledVector(normal, 0.25)
          expect(
            new Raycaster(
              origin,
              normal.clone().negate(),
              0,
              0.25,
            ).intersectObjects(meshes),
            kind,
          ).toHaveLength(0)
        }
    }
    // Blender bezel must not cover the live display or hologram aperture.
    for (const x of [-0.89, 0, 0.89]) {
      for (const z of [-1.19, 0, 1.19]) {
        const ray = new Raycaster(
          new Vector3(x, 1.3, -2.65 + z),
          new Vector3(0, -1, 0),
          0,
          0.27,
        )
        expect(ray.intersectObjects(meshes)).toHaveLength(0)
      }
    }
    // Knee openings must exist in the exported mesh, not only in physics.
    for (const desk of COMMAND_SEGMENTS.filter(
      (s) => s.opening !== undefined,
    )) {
      const normal = new Vector3(Math.sin(desk.yaw), 0, Math.cos(desk.yaw))
      const origin = new Vector3(
        desk.x + desk.opening * Math.cos(desk.yaw) + normal.x * 0.45,
        0.45,
        desk.z +
          BRIDGE_OFFSET_Z -
          desk.opening * Math.sin(desk.yaw) +
          normal.z * 0.45,
      )
      const ray = new Raycaster(origin, normal.negate(), 0, 0.9)
      expect(ray.intersectObjects(meshes)).toHaveLength(0)
    }
    // Entry finishes stay flush/recessed; the old continuous visual slab is gone.
    for (const [x, height] of [
      [0.4, 0],
      [1.22, -0.002],
    ]) {
      const ray = new Raycaster(
        new Vector3(x, 0.1, 3.525),
        new Vector3(0, -1, 0),
        0,
        0.3,
      )
      const hits = ray.intersectObjects(meshes)
      expect(hits[0].point.y).toBeCloseTo(height, 3)
      expect(
        hits.filter((hit) => Math.abs(hit.point.y - height) < 0.001),
      ).toHaveLength(1)
    }
    const beam = new Raycaster(
      new Vector3(0.3, 2, 3.12),
      new Vector3(0, 1, 0),
      0,
      1.3,
    )
    expect(beam.intersectObjects(meshes)[0].point.y).toBeCloseTo(3.04, 3)
    // Solid transition has inward-facing recesses and a clear central route.
    for (const side of [-1, 1]) {
      const wall = new Raycaster(
        new Vector3(0, 1.5, 4.2),
        new Vector3(side, 0, 0),
        0,
        2,
      )
      expect(wall.intersectObjects(meshes)[0].distance).toBeCloseTo(1.84, 2)
    }
    const route = new Raycaster(
      new Vector3(0, 1.7, 5.6),
      new Vector3(0, 0, -1),
      0,
      4,
    )
    expect(route.intersectObjects(meshes)).toHaveLength(0)
    // Flush deck, recessed guide and real grille gap: no competing top surfaces.
    for (const [x, z, height] of [
      [0.5, 3.3, 0],
      [2.05, 3.3, -0.008],
      [1.75, 3.38, -0.065],
    ]) {
      const floor = new Raycaster(
        new Vector3(x, 0.1, z + BRIDGE_OFFSET_Z),
        new Vector3(0, -1, 0),
        0,
        0.4,
      )
      const hits = floor.intersectObjects(meshes)
      expect(hits.length).toBeGreaterThan(0)
      expect(hits[0].point.y).toBeCloseTo(height, 3)
      expect(
        hits.filter((hit) => Math.abs(hit.point.y - height) < 0.001),
      ).toHaveLength(1)
    }
    // Entry remains clear across the walking capsule width and eye height.
    for (const x of [-0.8, 0, 0.8]) {
      const entry = new Raycaster(
        new Vector3(x, 1.7, 5.6),
        new Vector3(0, 0, -1),
        0,
        1,
      )
      expect(entry.intersectObjects(meshes)).toHaveLength(0)
    }
    // Niches have a recessed back, rather than a flat panel across their mouth.
    for (const x of [-3.97, -2.56, 2.56, 3.97]) {
      const niche = new Raycaster(
        new Vector3(x, 1.57, 5.5 + BRIDGE_OFFSET_Z),
        new Vector3(0, 0, -1),
        0,
        1,
      )
      const hits = niche.intersectObjects(meshes)
      expect(hits.length).toBeGreaterThan(0)
      expect(hits[0].point.z).toBeCloseTo(5.01 + BRIDGE_OFFSET_Z, 2)
    }
    for (const kind of ['computer', 'communications'] as const) {
      const origin = new Vector3(...stationView(kind).position)
      const destination = new Vector3(
        ...bridgePoint(COMMAND_POSES[kind].position),
      )
      const direction = destination.clone().sub(origin)
      const ray = new Raycaster(
        origin,
        direction.clone().normalize(),
        0,
        direction.length(),
      )
      expect(ray.intersectObjects(meshes), kind).toHaveLength(0)
    }
    const ceiling = new Raycaster(
      new Vector3(0, 2, 3 + BRIDGE_OFFSET_Z),
      new Vector3(0, 1, 0),
      0,
      1.4,
    )
    expect(ceiling.intersectObjects(meshes).length).toBeGreaterThan(0)
  } finally {
    meshes.forEach((m) => m.geometry.dispose())
    material.dispose()
  }
})
