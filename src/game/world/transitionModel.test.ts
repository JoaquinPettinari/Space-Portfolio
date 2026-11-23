import { Group, Mesh, BoxGeometry, MeshStandardMaterial, Texture } from 'three'
import { expect, it, vi } from 'vitest'
import { prepareTransitionModel } from './transitionModel'

it('preserves photo/PBR maps and cached resources while owning illumination changes', () => {
  const map = new Texture(),
    normalMap = new Texture()
  const material = new MeshStandardMaterial({
    map,
    normalMap,
    emissiveIntensity: 2,
  })
  const geometry = new BoxGeometry()
  const source = new Group()
  source.add(new Mesh(geometry, material), new Mesh(geometry, material))
  const model = prepareTransitionModel(source)
  const first = model.root.children[0] as Mesh<
    BoxGeometry,
    MeshStandardMaterial
  >
  const second = model.root.children[1] as Mesh<
    BoxGeometry,
    MeshStandardMaterial
  >
  expect(first.geometry).toBe(geometry)
  expect(first.material).not.toBe(material)
  expect(first.material).toBe(second.material)
  expect(first.material.map).toBe(map)
  expect(first.material.normalMap).toBe(normalMap)
  model.setReflection(map)
  model.setPower(0.5)
  expect(first.material.emissiveIntensity).toBe(1)
  expect(material.emissiveIntensity).toBe(2)
  expect(material.envMap).toBeNull()
  const ownDispose = vi.spyOn(first.material, 'dispose')
  const sourceDispose = vi.spyOn(material, 'dispose')
  const mapDispose = vi.spyOn(map, 'dispose')
  model.dispose()
  expect(ownDispose).toHaveBeenCalledOnce()
  expect(sourceDispose).not.toHaveBeenCalled()
  expect(mapDispose).not.toHaveBeenCalled()
  geometry.dispose()
  material.dispose()
  map.dispose()
  normalMap.dispose()
})
