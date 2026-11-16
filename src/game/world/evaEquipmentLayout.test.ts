// @vitest-environment node
import { readFileSync } from 'node:fs'
import { Box3, Group, Mesh, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import { EVA_EQUIPMENT_LAYOUT } from './evaEquipmentLayout'

it('fits the actual exported suit inside its collider and clears the actual hatch surround', async () => {
  const load = async (name: string) => {
    const bytes = readFileSync(
      new URL('../../../public/models/' + name, import.meta.url),
    )
    return (await new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer, ''))
      .scene
  }
  const suit = await load('cruz-del-sur-eva-suit.glb')
  const hatch = await load('cruz-del-sur-docking-door.glb')
  const mounted = new Group()
  mounted.position.fromArray(EVA_EQUIPMENT_LAYOUT.position)
  mounted.rotation.y = Math.PI
  mounted.add(suit)
  try {
    const bounds = new Box3().setFromObject(mounted)
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
