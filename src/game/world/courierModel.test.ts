// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { Box3, Light, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { createCourierModel } from './courierModel'

it('keeps a detailed courier within six opaque draws and a small geometry budget', () => {
  const model = createCourierModel()
  let triangles = 0
  model.root.traverse((object) => {
    expect(object).not.toBeInstanceOf(Light)
    if (!(object instanceof Mesh)) return
    expect(object.material).toBeInstanceOf(MeshBasicMaterial)
    const material = object.material as MeshBasicMaterial
    expect(material.transparent).toBe(false)
    expect(material.map).toBeNull()
    expect(material.vertexColors).toBe(true)
    triangles += object.geometry.getAttribute('position').count / 3
  })
  expect(model.root.children).toHaveLength(6)
  expect(triangles).toBeLessThan(10_000)
  const size = new Box3().setFromObject(model.root).getSize(new Vector3())
  expect(size.x).toBeGreaterThan(5)
  expect(size.x).toBeLessThan(6)
  expect(size.z).toBeLessThan(3.5)
  expect(size.y).toBeLessThan(1.5)
  model.dispose()
})

it('owns and disposes its buffers and finishes without removing the replayed hierarchy', () => {
  const first = createCourierModel()
  const second = createCourierModel()
  const meshes = first.root.children as Mesh[]
  const disposeEvents = meshes.map((mesh) => {
    const geometry = vi.spyOn(mesh.geometry, 'dispose')
    const material = vi.spyOn(mesh.material as MeshBasicMaterial, 'dispose')
    return { geometry, material }
  })
  expect(meshes[0].geometry).not.toBe(
    (second.root.children[0] as Mesh).geometry,
  )
  first.dispose()
  expect(first.root.children).toHaveLength(6)
  for (const { geometry, material } of disposeEvents) {
    expect(geometry).toHaveBeenCalledOnce()
    expect(material).toHaveBeenCalledOnce()
  }
  second.dispose()
})
