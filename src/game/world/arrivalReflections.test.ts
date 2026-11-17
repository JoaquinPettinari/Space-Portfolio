// @vitest-environment node
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from 'three'
import { expect, it, vi } from 'vitest'
import { prepareArrivalMaterials } from './arrivalReflections'
import { ARRIVAL_FLOOR_MAP_BOUNDS } from './arrivalFloorMapping'
import { ARRIVAL_ORIGIN_Z } from './arrivalRoomLayout'

it('keeps cabin reflections and surface changes local and disposes only owned materials', () => {
  const source = new Group()
  const geometry = new BoxGeometry()
  const texture = new Texture()
  const material = new MeshStandardMaterial({
    roughness: 0.8,
    map: texture,
    normalMap: texture,
  })
  material.name = 'CDS DETAIL / Graphite deck'
  source.add(new Mesh(geometry, material), new Mesh(geometry, material))
  const materialDisposal = vi.spyOn(material, 'dispose')
  const textureDisposal = vi.spyOn(texture, 'dispose')
  const geometryDisposal = vi.spyOn(geometry, 'dispose')
  const model = prepareArrivalMaterials(source)
  const first = model.root.children[0] as Mesh<
    BoxGeometry,
    MeshStandardMaterial
  >
  const second = model.root.children[1] as Mesh<
    BoxGeometry,
    MeshStandardMaterial
  >
  const reflection = new Texture()
  const reflectionDisposal = vi.spyOn(reflection, 'dispose')
  model.setReflection(reflection)
  const floorAlbedo = new Texture()
  const floorRoughness = new Texture()
  model.setFloorTextures({ albedo: floorAlbedo, roughness: floorRoughness })
  expect(first.material).toBe(second.material)
  expect(first.material).not.toBe(material)
  expect(first.geometry).not.toBe(geometry)
  expect(geometry.getAttribute('uv1')).toBeUndefined()
  expect(first.geometry.getAttribute('uv1')).toBeDefined()
  expect(first.material.map).toBe(floorAlbedo)
  expect(first.material.roughnessMap).toBe(floorRoughness)
  expect(first.material.normalMap).toBe(texture)
  expect(first.material.aoMap).toBe(floorRoughness)
  expect(material.map).toBe(texture)
  expect(first.material.envMap).toBe(reflection)
  expect(first.material.roughness).toBe(0.28)
  expect(material.envMap).toBeNull()
  expect(material.roughness).toBe(0.8)
  model.setPower(0.12)
  expect(first.material.envMapIntensity).toBeCloseTo(0.9 * 0.12)
  const ownDisposal = vi.spyOn(first.material, 'dispose')
  const ownGeometryDisposal = vi.spyOn(first.geometry, 'dispose')
  model.setFloorTextures(null)
  expect(first.material.map).toBe(texture)
  expect(first.material.roughnessMap).toBeNull()
  expect(first.material.aoMap).toBeNull()
  model.setReflection(null)
  model.dispose()
  expect(ownDisposal).toHaveBeenCalledOnce()
  expect(ownGeometryDisposal).toHaveBeenCalledOnce()
  expect(materialDisposal).not.toHaveBeenCalled()
  expect(geometryDisposal).not.toHaveBeenCalled()
  expect(textureDisposal).not.toHaveBeenCalled()
  expect(reflectionDisposal).not.toHaveBeenCalled()
  material.dispose()
  geometry.dispose()
  texture.dispose()
  reflection.dispose()
  floorAlbedo.dispose()
  floorRoughness.dispose()
})

it('does not add environment sampling to cloth, greenery or padded ceiling', () => {
  const source = new Group()
  const geometry = new BoxGeometry()
  const materials = ['Woven cream', 'Living green', 'Padded ceiling'].map(
    (name) => {
      const material = new MeshStandardMaterial()
      material.name = `CABIN / REFERENCE / ${name}`
      source.add(new Mesh(geometry, material))
      return material
    },
  )
  const model = prepareArrivalMaterials(source)
  const reflection = new Texture()
  model.setReflection(reflection)
  for (const object of model.root.children)
    expect(
      (object as Mesh<BoxGeometry, MeshStandardMaterial>).material.envMap,
    ).toBeNull()
  model.dispose()
  geometry.dispose()
  materials.forEach((material) => material.dispose())
  reflection.dispose()
})

it('maps world-space hatch detail into the same floor atlas without changing bridge batches', () => {
  const source = new Group()
  const geometry = new BoxGeometry(1, 0.03, 1)
  geometry.translate(-2, 0, ARRIVAL_ORIGIN_Z + 2)
  const material = new MeshStandardMaterial()
  material.name = 'CDS DETAIL / Graphite deck'
  const arrival = new Mesh(geometry, material)
  arrival.name = 'REFINED_arrival_static_CDS DETAIL_Graphite deck'
  const bridge = new Mesh(geometry, material)
  bridge.name = 'REFINED_bridge_static_CDS DETAIL_Graphite deck'
  source.add(arrival, bridge)
  const model = prepareArrivalMaterials(source, 'world')
  const floor = model.root.children[0] as Mesh<
    BoxGeometry,
    MeshStandardMaterial
  >
  const untouched = model.root.children[1] as Mesh<
    BoxGeometry,
    MeshStandardMaterial
  >
  const position = floor.geometry.getAttribute('position')
  const uv = floor.geometry.getAttribute('uv1')
  const bounds = ARRIVAL_FLOOR_MAP_BOUNDS
  expect(uv.getY(0)).toBeCloseTo(
    (position.getZ(0) - ARRIVAL_ORIGIN_Z - bounds.minZ) /
      (bounds.maxZ - bounds.minZ),
  )
  expect(untouched.material).toBe(material)
  expect(untouched.geometry).toBe(geometry)
  expect(material.envMap).toBeNull()
  expect(geometry.getAttribute('uv1')).toBeUndefined()
  model.dispose()
  geometry.dispose()
  material.dispose()
})
