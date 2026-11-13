/// <reference types="node" />
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

it('the exported room seals the portals and keeps furniture and wall details unobstructed', () => {
  const b = readFileSync(
    new URL(
      '../../../public/models/cruz-del-sur-arrival-room.glb',
      import.meta.url,
    ),
  )
  const length = b.readUInt32LE(12)
  const asset = JSON.parse(b.toString('utf8', 20, 20 + length)) as {
    accessors: {
      bufferView: number
      byteOffset?: number
      count: number
      componentType: number
    }[]
    bufferViews: { byteOffset?: number; byteStride?: number }[]
    materials: { name: string }[]
    meshes: {
      primitives: {
        attributes: { POSITION: number }
        indices: number
        material: number
      }[]
    }[]
  }
  const data = (id: number, components: number) => {
    const a = asset.accessors[id],
      view = asset.bufferViews[a.bufferView]
    expect(view.byteStride).toBeUndefined()
    const offset =
      b.byteOffset + 28 + length + (view.byteOffset ?? 0) + (a.byteOffset ?? 0)
    return a.componentType === 5126
      ? new Float32Array(b.buffer, offset, a.count * components)
      : a.componentType === 5123
        ? new Uint16Array(b.buffer, offset, a.count)
        : new Uint32Array(b.buffer, offset, a.count)
  }
  const material = new MeshBasicMaterial({ side: DoubleSide })
  const meshes = asset.meshes.flatMap((m) =>
    m.primitives.map((p) => {
      const geometry = new BufferGeometry()
      geometry.setAttribute(
        'position',
        new BufferAttribute(data(p.attributes.POSITION, 3), 3),
      )
      geometry.setIndex(new BufferAttribute(data(p.indices, 1), 1))
      const mesh = new Mesh(geometry, material)
      mesh.name = asset.materials[p.material].name
      return mesh
    }),
  )
  try {
    // These points lie outside the old footprint but inside the enlarged room.
    for (const x of [-3.0, 3.0]) {
      const floor = new Raycaster(
        new Vector3(x, 0.4, 5.8),
        new Vector3(0, -1, 0),
        0,
        0.6,
      )
      expect(floor.intersectObjects(meshes)[0]?.point.y).toBeCloseTo(0, 2)
      const roof = new Raycaster(
        new Vector3(x, 2.5, 5.8),
        new Vector3(0, 1, 0),
        0,
        1,
      )
      const hits = roof.intersectObjects(meshes)
      expect(hits.length).toBeGreaterThan(0)
      expect(hits[0].point.y).toBeLessThan(3.6)
    }
    for (const x of [-2.38, -2.14]) {
      for (const y of [2.12, 2.4]) {
        const ray = new Raycaster(
          new Vector3(x, y, 1),
          new Vector3(0, 0, -1),
          0,
          1,
        )
        expect(ray.intersectObjects(meshes)[0]?.object.name).toContain(
          'Medical red',
        )
      }
    }
    for (const [y, materialName] of [
      [2.255, 'Flag sky blue'],
      [2.33, 'Flag white'],
      [2.405, 'Flag sky blue'],
    ] as const) {
      const ray = new Raycaster(
        new Vector3(-1.98, y, 1),
        new Vector3(0, 0, -1),
        0,
        1,
      )
      expect(ray.intersectObjects(meshes)[0]?.object.name).toContain(
        materialName,
      )
    }
    // The old straight plinth crossed the seating space above the cushions.
    for (const z of [1.8, 2.65]) {
      const seating = new Raycaster(
        new Vector3(-4.28, 0.65, z + 1.325),
        new Vector3(1, 0, 0),
        0,
        0.4,
      )
      expect(seating.intersectObjects(meshes)).toHaveLength(0)
    }
    for (const x of [-0.8, 0, 0.8]) {
      const overhead = new Raycaster(
        new Vector3(x, 2, -0.43),
        new Vector3(0, 1, 0),
        0,
        1,
      )
      const hits = overhead.intersectObjects(meshes)
      expect(hits.length, 'Door overhead reveal').toBeGreaterThan(0)
      expect(hits[0].point.y).toBeCloseTo(2.53, 2)
      const front = new Raycaster(
        new Vector3(x, 3.2, 0.5),
        new Vector3(0, 0, -1),
        0,
        0.7,
      )
      expect(
        front.intersectObjects(meshes).length,
        'Front vaulted header seal',
      ).toBeGreaterThan(0)
    }
    for (const x of [-1.6, -0.8, 0, 0.8, 1.6]) {
      const ray = new Raycaster(
        new Vector3(x, 3.2, 3.6 + 2.065),
        new Vector3(0, 0, 1),
        0,
        0.7,
      )
      const hits = ray.intersectObjects(meshes)
      expect(hits.length, `Rear seal at X=${x}`).toBeGreaterThan(0)
      // A ceiling rib can be closer; require the rear wall itself behind it.
      expect(hits.some((hit) => Math.abs(hit.point.z - 6.165) < 0.025)).toBe(
        true,
      )
    }
  } finally {
    meshes.forEach((m) => m.geometry.dispose())
    material.dispose()
  }
})
