// @vitest-environment node
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Texture } from 'three'
import { expect, it, vi } from 'vitest'
import { prepareAsterionModel } from './asterionModel'

it('preserves authored placement and cached geometry while owning display-ready materials', () => {
  const source = new Group()
  const geometry = new BoxGeometry()
  const texture = new Texture()
  const material = new MeshBasicMaterial({ map: texture, transparent: true })
  const first = new Mesh(geometry, material)
  first.position.set(-90, 3.5, -4)
  const second = new Mesh(geometry, material)
  source.add(first, second)
  const prepared = prepareAsterionModel(source)
  const [a, b] = prepared.root.children as Mesh[]
  expect(a).not.toBe(first)
  expect(a.position).toEqual(first.position)
  expect(a.geometry).toBe(geometry)
  expect(a.material).toBe(b.material)
  expect(a.material).not.toBe(material)
  const owned = a.material as MeshBasicMaterial
  expect(owned.map).toBe(texture)
  expect(owned.toneMapped).toBe(false)
  expect(owned.depthWrite).toBe(false)
  expect(owned.forceSinglePass).toBe(true)
  expect(material.toneMapped).toBe(true)
  expect(material.depthWrite).toBe(true)
  const disposeOwned = vi.spyOn(owned, 'dispose')
  const disposeShared = vi.spyOn(material, 'dispose')
  const disposeGeometry = vi.spyOn(geometry, 'dispose')
  const disposeTexture = vi.spyOn(texture, 'dispose')
  prepared.dispose()
  expect(disposeOwned).toHaveBeenCalledTimes(1)
  expect(disposeShared).not.toHaveBeenCalled()
  expect(disposeGeometry).not.toHaveBeenCalled()
  expect(disposeTexture).not.toHaveBeenCalled()
  geometry.dispose()
  texture.dispose()
  material.dispose()
})

it('exposes the single debris batch and its immutable authored origin without mutating the cache', () => {
  const source = new Group()
  const geometry = new BoxGeometry()
  const material = new MeshBasicMaterial()
  material.name = 'ASTERION / prelit debris'
  const debris = new Mesh(geometry, material)
  debris.position.set(80, -20, 60)
  source.add(debris)
  const prepared = prepareAsterionModel(source)
  expect(prepared.debris?.name).toBe('asterion-debris')
  expect(prepared.debrisOrigin).toEqual(debris.position)
  prepared.debris!.position.x += 6
  expect(prepared.debrisOrigin?.x).toBe(80)
  expect(debris.position.x).toBe(80)
  expect(prepared.debris!.geometry).toBe(geometry)
  prepared.dispose()
  geometry.dispose()
  material.dispose()
})
