// @vitest-environment node
import { readFileSync } from 'node:fs'
import { Box3, Group, Mesh, Ray, Vector3, type Material } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import {
  EVA_EQUIPMENT_LAYOUT,
  EVA_EQUIPMENT_MODEL_URL,
  EVA_ALCOVE,
} from './evaEquipmentLayout'

it('fits the actual exported suit inside its collider and clears the actual hatch surround', async () => {
  const load = async (name: string) => {
    const bytes = readFileSync(
      new URL('../../../public/models/' + name, import.meta.url),
    )
    return (await new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer, ''))
      .scene
  }
  const suit = await load(EVA_EQUIPMENT_MODEL_URL.replace('/models/', ''))
  const hatch = await load('cruz-del-sur-docking-door.glb')
  const mounted = new Group()
  mounted.position.fromArray(EVA_EQUIPMENT_LAYOUT.position)
  mounted.rotation.y = Math.PI
  mounted.add(suit)
  try {
    let triangles = 0
    const materials = new Set<Material>()
    suit.traverse((object) => {
      if (!(object instanceof Mesh)) return
      triangles +=
        (object.geometry.index?.count ??
          object.geometry.attributes.position.count) / 3
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material])
        materials.add(material)
    })
    expect(triangles).toBeLessThan(60_000)
    expect(materials.size).toBe(5)
    const bounds = new Box3().setFromObject(mounted)
    // The actual GLB must include legs and boots, not the previous torso crop.
    expect(bounds.max.x - bounds.min.x).toBeLessThanOrEqual(0.881)
    expect(bounds.max.y - bounds.min.y).toBeGreaterThan(2)
    expect(bounds.min.y).toBeCloseTo(EVA_EQUIPMENT_LAYOUT.position[1])
    const hatchBounds = new Box3().setFromObject(hatch)
    expect(hatchBounds.min.x - bounds.max.x).toBeGreaterThan(0.25)
    const center = new Vector3(...EVA_EQUIPMENT_LAYOUT.colliderPosition)
    const half = new Vector3(...EVA_EQUIPMENT_LAYOUT.colliderHalfSize)
    const collider = new Box3(
      center.clone().sub(half),
      center.clone().add(half),
    )
    expect(collider.containsBox(bounds)).toBe(true)
    expect(bounds.max.z).toBeLessThan(-0.07)
    // The real boots rest on the alcove deck. Hands and helmet clear the shallow
    // mounting frame, while the body projects forward for visibility.
    expect(bounds.min.y).toBeCloseTo(EVA_ALCOVE.floorY)
    expect(bounds.min.z).toBeGreaterThan(EVA_ALCOVE.frontZ + 0.075)
    expect(bounds.max.z).toBeLessThan(EVA_ALCOVE.backZ - 0.07)
    expect(bounds.max.y).toBeLessThan(EVA_ALCOVE.height - 0.19)
    expect(bounds.min.x).toBeGreaterThan(
      EVA_ALCOVE.centerX - EVA_ALCOVE.width / 2 + EVA_ALCOVE.jamb,
    )
    expect(bounds.max.x).toBeLessThan(
      EVA_ALCOVE.centerX + EVA_ALCOVE.width / 2 - EVA_ALCOVE.jamb,
    )
    expect(EVA_ALCOVE.centerX + EVA_ALCOVE.width / 2).toBeLessThan(
      hatchBounds.min.x - 0.1,
    )
  } finally {
    for (const root of [suit, hatch])
      root.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.dispose()
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            m.dispose()
        }
      })
  }
})

it('keeps the suit sightline clear from the central aisle and wide room view', () => {
  const bay = EVA_ALCOVE
  for (const camera of [
    [0, 1.7, -3.0],
    [1.1, 1.7, -3.025],
  ]) {
    const origin = new Vector3(...camera)
    const target = new Vector3(
      bay.centerX,
      1.3,
      EVA_EQUIPMENT_LAYOUT.position[2],
    )
    const ray = new Ray(origin, target.clone().sub(origin).normalize())
    for (const side of [-1, 1]) {
      const centerX = bay.centerX + (side * (bay.width - bay.jamb)) / 2
      const panel = new Box3(
        new Vector3(centerX - bay.jamb / 2 - 0.008, 0, bay.frameZ - 0.008),
        new Vector3(centerX + bay.jamb / 2 + 0.008, bay.height, bay.backZ),
      )
      const hit = ray.intersectBox(panel, new Vector3())
      expect(
        hit === null || hit.distanceTo(origin) > target.distanceTo(origin),
      ).toBe(true)
    }
  }
})
