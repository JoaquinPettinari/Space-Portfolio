// @vitest-environment node
import { readFileSync } from 'node:fs'
import { DoubleSide, Mesh, Raycaster, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import { PANORAMIC_BAY_ASSET } from './passageLayout'

it('the actual shared passage asset leaves side and roof views behind transparent glass', async () => {
  const bytes = readFileSync(
    new URL(`../../../public${PANORAMIC_BAY_ASSET}`, import.meta.url),
  )
  const { scene } = await new GLTFLoader().parseAsync(
    new Uint8Array(bytes).buffer,
    '',
  )
  scene.updateMatrixWorld(true)
  try {
    for (const [origin, direction] of [
      [new Vector3(0, 0.5, 0), new Vector3(-1, 0, 0)],
      [new Vector3(0, 1.7, 0), new Vector3(1, 0, 0)],
      [new Vector3(0, 2.7, 0), new Vector3(-1, 0, 0)],
      [new Vector3(0.75, 1.7, 0), new Vector3(0, 1, 0)],
    ]) {
      const first = new Raycaster(origin, direction, 0, 4).intersectObjects(
        scene.children,
        true,
      )[0]
      expect(first?.object).toBeInstanceOf(Mesh)
      if (!(first.object instanceof Mesh)) throw new Error('Missing glass mesh')
      expect(first.object.name).toContain('GLASS')
      const materials = Array.isArray(first.object.material)
        ? first.object.material
        : [first.object.material]
      expect(materials.every((material) => material.transparent)).toBe(true)
      expect(materials.every((material) => material.opacity <= 0.15)).toBe(true)
      expect(materials.every((material) => material.side === DoubleSide)).toBe(
        true,
      )
    }
  } finally {
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      materials.forEach((material) => material.dispose())
    })
  }
})
