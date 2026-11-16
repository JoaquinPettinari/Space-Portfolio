// @vitest-environment node
import { readFileSync } from 'node:fs'
import { Box3, Mesh, MeshStandardMaterial, Texture } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { expect, it, vi } from 'vitest'
import { prepareInteriorFinishes } from './interiorFinishes'

it('textures the actual foliage without moving a vertex, altering an index or mutating cached GLTF resources', async () => {
  const bytes = readFileSync(
    new URL(
      '../../../public/models/cruz-del-sur-furnishings.glb',
      import.meta.url,
    ),
  )
  const { scene } = await new GLTFLoader().parseAsync(
    new Uint8Array(bytes).buffer,
    '',
  )
  const textures = { leather: new Texture(), leaf: new Texture() }
  const disposeLeaf = vi.spyOn(textures.leaf, 'dispose')
  const sourceMeshes: Mesh[] = []
  scene.traverse((object) => {
    if (object instanceof Mesh) sourceMeshes.push(object)
  })
  const bounds = new Box3().setFromObject(scene)
  const originalNormals = sourceMeshes.map((mesh) =>
    Array.from(mesh.geometry.attributes.normal.array),
  )
  const model = prepareInteriorFinishes([scene], textures)
  const copied: Mesh[] = []
  model.roots[0].traverse((object) => {
    if (object instanceof Mesh) copied.push(object)
  })
  expect(new Box3().setFromObject(model.roots[0])).toEqual(bounds)
  expect(copied.length).toBe(sourceMeshes.length)
  let leaves = 0
  for (let i = 0; i < sourceMeshes.length; i++) {
    const source = sourceMeshes[i],
      local = copied[i]
    expect(Array.from(source.geometry.attributes.normal.array)).toEqual(
      originalNormals[i],
    )
    expect(local.geometry.attributes.position.array).toEqual(
      source.geometry.attributes.position.array,
    )
    expect(local.geometry.index?.array).toEqual(source.geometry.index?.array)
    const sourceMaterial = source.material as MeshStandardMaterial
    if (!sourceMaterial.name.startsWith('FURNISH / Leaf')) continue
    leaves++
    expect(source.geometry.attributes.uv).toBeUndefined()
    expect(sourceMaterial.map).toBeNull()
    expect(local.geometry).not.toBe(source.geometry)
    const normals = local.geometry.attributes.normal
    for (let n = 0; n < normals.count; n++) {
      expect(
        Math.hypot(normals.getX(n), normals.getY(n), normals.getZ(n)),
      ).toBeCloseTo(1, 4)
    }
    const uv = local.geometry.attributes.uv
    expect(uv.count).toBe(source.geometry.attributes.position.count)
    expect(
      Array.from(uv.array).every(
        (value) => Number.isFinite(value) && value >= 0 && value <= 1,
      ),
    ).toBe(true)
    const material = local.material as MeshStandardMaterial
    expect(material.map).toBe(textures.leaf)
    expect(material.transparent).toBe(false)
    expect(material.side).toBe(sourceMaterial.side)
  }
  expect(leaves).toBe(2)
  model.dispose()
  expect(disposeLeaf).not.toHaveBeenCalled()
  textures.leaf.dispose()
  textures.leather.dispose()
  scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose()
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      materials.forEach((m) => m.dispose())
    }
  })
})
