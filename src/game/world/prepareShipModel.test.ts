// @vitest-environment node
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from 'three'
import { expect, it, vi } from 'vitest'
import { prepareShipModel } from './prepareShipModel'

it('owns transparent clones once, shares cached resources and preserves independent glass policy', () => {
  const root = new Group(),
    geometry = new BoxGeometry(),
    texture = new Texture()
  const opaque = new MeshStandardMaterial({ map: texture })
  const glass = new MeshStandardMaterial({ transparent: true, map: texture })
  glass.name = 'Canopy Glazing'
  root.add(new Mesh(geometry, [opaque, glass]), new Mesh(geometry, glass))
  const cachedDispose = vi.spyOn(glass, 'dispose')
  const geometryDispose = vi.spyOn(geometry, 'dispose')
  const textureDispose = vi.spyOn(texture, 'dispose')
  const arrival = prepareShipModel(root)
  const envelope = prepareShipModel(root, true)
  const first = arrival.root.children[0] as Mesh
  const second = arrival.root.children[1] as Mesh
  const materials = first.material as MeshStandardMaterial[]
  const local = materials[1]
  expect(arrival.root).not.toBe(root)
  expect(first.geometry).toBe(geometry)
  expect(materials[0]).toBe(opaque)
  expect(second.material).toBe(local)
  expect(local).not.toBe(glass)
  expect(local.map).toBe(texture)
  expect(local.depthWrite).toBe(false)
  expect(local.forceSinglePass).toBe(false)
  expect(glass.depthWrite).toBe(true)
  expect(glass.forceSinglePass).toBe(false)
  expect((envelope.root.children[1] as Mesh).material).toHaveProperty(
    'forceSinglePass',
    true,
  )
  const localDispose = vi.spyOn(local, 'dispose')
  arrival.dispose()
  envelope.dispose()
  expect(localDispose).toHaveBeenCalledOnce()
  expect(cachedDispose).not.toHaveBeenCalled()
  expect(geometryDispose).not.toHaveBeenCalled()
  expect(textureDispose).not.toHaveBeenCalled()
  geometry.dispose()
  opaque.dispose()
  glass.dispose()
  texture.dispose()
})
