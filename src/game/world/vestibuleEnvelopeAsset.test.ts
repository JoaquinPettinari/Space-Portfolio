// @vitest-environment node
import { readFileSync } from 'node:fs'
import { DoubleSide, Mesh, Raycaster, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import { removeLegacyArrival } from './cabinMaster'
async function load(name: string) {
  const bytes = readFileSync(
    new URL(`../../../public/models/${name}.glb`, import.meta.url),
  )
  const { scene } = await new GLTFLoader().parseAsync(
    new Uint8Array(bytes).buffer,
    '',
  )
  removeLegacyArrival(scene)
  scene.updateMatrixWorld(true)
  scene.traverse((node) => {
    if (node instanceof Mesh)
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material])
        material.side = DoubleSide
  })
  return scene
}
it('clears only the vestibule volume while preserving the surrounding hull', async () => {
  const source = await load('cruz-del-sur-straight-envelope')
  const fitted = await load('cruz-del-sur-vestibule-envelope')
  const down = (scene: typeof source, x: number, z: number) =>
    new Raycaster(
      new Vector3(x, 2, z),
      new Vector3(0, -1, 0),
      0,
      15,
    ).intersectObjects(scene.children, true)
  for (const x of [-1.5, -1, 0, 1, 1.5])
    for (const z of [18.6, 18.7, 19.2, 20, 20.8, 21.05]) {
      const original = down(source, x, z)
      expect(
        original.some((hit) => hit.point.y > 0),
        `source reproduces intrusion ${x},${z}`,
      ).toBe(true)
      expect(
        down(fitted, x, z).filter((hit) => hit.point.y > -0.149),
        `clear volume ${x},${z}`,
      ).toHaveLength(0)
    }
  for (const x of [-3, -2, 2, 3])
    for (const z of [18.3, 18.7, 19.2, 20.8, 21.3]) {
      const before = down(source, x, z),
        after = down(fitted, x, z)
      expect(after.length, `exterior ${x},${z}`).toBe(before.length)
      before.forEach((hit, i) =>
        expect(after[i].point.distanceTo(hit.point)).toBeLessThan(0.00001),
      )
    }
})
