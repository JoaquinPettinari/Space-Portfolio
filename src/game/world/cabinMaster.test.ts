// @vitest-environment node
import {
  BoxGeometry,
  DoubleSide,
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Texture,
} from 'three'
import { expect, it, vi } from 'vitest'
import { optimizeZeroContributionLights } from '../rendering/zeroContributionLights'
import {
  assembleCurrentShip,
  prepareCabinMaster,
  removeLegacyArrival,
} from './cabinMaster'
import {
  CABIN_MASTER_COLLIDERS,
  CABIN_MASTER_FLOOR,
  CABIN_TECHNICAL_END_PANELS,
} from './cabinMasterLayout'

it('replaces arrival in independent display hierarchies while retaining bridge and exterior', () => {
  const source = new Group()
  for (const name of [
    'UNIFIED_RUNTIME_arrival_shell',
    'REFINED_arrival_floor',
    'UNIFIED_RUNTIME_bridge_shell',
    'UNIFIED_RUNTIME_lower-hull_shell',
  ]) {
    const object = new Group()
    object.name = name
    source.add(object)
  }
  const cabin = new Group()
  cabin.name = 'new-cabin-and-vestibule'
  const leaves = new Group()
  leaves.name = 'new-sliding-leaves'
  const composed = assembleCurrentShip(source, cabin, leaves)
  expect(source.children).toHaveLength(4)
  expect(
    composed.getObjectByName('UNIFIED_RUNTIME_arrival_shell'),
  ).toBeUndefined()
  expect(composed.getObjectByName('REFINED_arrival_floor')).toBeUndefined()
  expect(composed.getObjectByName('UNIFIED_RUNTIME_bridge_shell')).toBeDefined()
  expect(
    composed.getObjectByName('UNIFIED_RUNTIME_lower-hull_shell'),
  ).toBeDefined()
  expect(composed.getObjectByName(cabin.name)).toBeDefined()
  expect(composed.getObjectByName(leaves.name)?.position.toArray()).toEqual([
    0, -0.18, 11.65,
  ])
  expect(leaves.position.toArray()).toEqual([0, 0, 0])
  expect(removeLegacyArrival(composed)).toBe(composed)
})

it('owns only material copies, preserves baked PBR maps and releases no shared resources', () => {
  const source = new Group()
  const geometry = new BoxGeometry()
  const map = new Texture()
  const reflection = new Texture()
  const material = new MeshPhysicalMaterial({
    clearcoat: 0.2,
    map,
    roughnessMap: map,
    transparent: true,
    side: DoubleSide,
    opacity: 0.08,
    emissiveIntensity: 2,
  })
  source.add(new Mesh(geometry, material), new Mesh(geometry, material))
  const sharedMaterialDispose = vi.spyOn(material, 'dispose')
  const sharedMapDispose = vi.spyOn(map, 'dispose')
  const geometryDispose = vi.spyOn(geometry, 'dispose')
  const model = prepareCabinMaster(source)
  const copy = (model.root.children[0] as Mesh).material as MeshStandardMaterial
  const dispose = vi.spyOn(copy, 'dispose')
  expect((model.root.children[1] as Mesh).material).toBe(copy)
  expect(copy).not.toBe(material)
  expect(copy).not.toBeInstanceOf(MeshPhysicalMaterial)
  expect(copy.map).toBe(map)
  expect(copy.roughnessMap).toBe(map)
  expect(copy.depthWrite).toBe(false)
  expect(copy.side).toBe(DoubleSide)
  model.setReflection(reflection)
  model.setPower(0.12)
  expect(copy.envMap).toBe(reflection)
  expect(copy.emissiveIntensity).toBeCloseTo(0.24)
  expect(material.emissiveIntensity).toBe(2)
  expect(material.envMap).toBeNull()
  model.dispose()
  expect(dispose).toHaveBeenCalledOnce()
  expect(sharedMaterialDispose).not.toHaveBeenCalled()
  expect(sharedMapDispose).not.toHaveBeenCalled()
  expect(geometryDispose).not.toHaveBeenCalled()
  geometry.dispose()
  material.dispose()
  map.dispose()
  reflection.dispose()
})

it('changes access indicators without recolouring other meshes sharing the exported material', () => {
  const source = new Group()
  const material = new MeshStandardMaterial({
    color: '#55ccdd',
    emissive: '#55ccdd',
    side: DoubleSide,
  })
  const geometry = new BoxGeometry()
  const status = new Mesh(geometry, material)
  status.name = 'CABIN_MASTER_access_status_cyan'
  source.add(status, new Mesh(geometry, material))
  const model = prepareCabinMaster(source)
  const indicator = (model.root.children[0] as Mesh)
    .material as MeshStandardMaterial
  const ordinary = (model.root.children[1] as Mesh)
    .material as MeshStandardMaterial
  model.setAccess(false, 'closed')
  expect(indicator.color.getHexString()).toBe('d53c32')
  model.setAccess(true, 'closed')
  expect(indicator.color.getHexString()).toBe('e8ad70')
  model.setAccess(true, 'opening')
  expect(indicator.color.getHexString()).toBe('32e68b')
  expect(ordinary.color.equals(material.color)).toBe(true)
  expect(ordinary.side).toBe(FrontSide)
  expect(material.side).toBe(DoubleSide)
  model.dispose()
  material.dispose()
  geometry.dispose()
})

it('retains both sides of thin foliage while culling the backs of solid panels', () => {
  const source = new Group()
  const geometry = new BoxGeometry()
  const foliage = new MeshStandardMaterial({ side: DoubleSide })
  foliage.name = 'CABIN_PBR_WINDOW_Living_foliage_1'
  source.add(new Mesh(geometry, foliage))
  const model = prepareCabinMaster(source)
  expect(
    ((model.root.children[0] as Mesh).material as MeshStandardMaterial).side,
  ).toBe(DoubleSide)
  model.dispose()
  foliage.dispose()
  geometry.dispose()
})

it.each([
  'CABIN_PBR_STUDIO_Powder_coated_structural_rails',
  'CABIN_PBR_STUDIO_Carbon_rubber',
  'CABIN_PBR_STUDIO_Warm_graphite_enamel',
])(
  'adds a depth proxy only to measured material %s and retains shared geometry ownership',
  (name) => {
    const source = new Group()
    const geometry = new BoxGeometry()
    const rails = new MeshStandardMaterial()
    rails.name = name
    const neighbor = new MeshStandardMaterial()
    neighbor.name = `${rails.name}_neighbor`
    const target = new Mesh(geometry, rails)
    target.name = 'static-rail-batch'
    const other = new Mesh(geometry, neighbor)
    // A similar object name must not opt a different material into the prepass.
    other.name = rails.name
    source.add(target, other)
    const cloneGeometry = vi.spyOn(geometry, 'clone')
    const disposeGeometry = vi.spyOn(geometry, 'dispose')
    const disposeRails = vi.spyOn(rails, 'dispose')
    const disposeNeighbor = vi.spyOn(neighbor, 'dispose')
    const model = prepareCabinMaster(source)
    const copy = model.root.children[0] as Mesh
    const neighborCopy = model.root.children[1] as Mesh
    expect(copy.children).toHaveLength(0)
    const detachDepth = model.attachDepth()
    expect(copy.children).toHaveLength(1)
    expect(neighborCopy.children).toHaveLength(0)
    expect(target.children).toHaveLength(0)
    expect(other.children).toHaveLength(0)
    const proxy = copy.children[0] as Mesh<BoxGeometry, MeshBasicMaterial>
    expect(proxy.material).toBeInstanceOf(MeshBasicMaterial)
    expect(proxy.material.colorWrite).toBe(false)
    expect(proxy.geometry).toBe(geometry)
    expect(copy.geometry).toBe(geometry)
    expect(neighborCopy.geometry).toBe(geometry)
    expect(cloneGeometry).not.toHaveBeenCalled()
    const disposeProxy = vi.spyOn(proxy.material, 'dispose')
    const restoreLights = optimizeZeroContributionLights(model.root)
    detachDepth()
    restoreLights()
    expect(copy.children).toHaveLength(0)
    expect(disposeProxy).toHaveBeenCalledOnce()
    // A layout-effect teardown/setup must create a fresh proxy after shader hooks
    // are restored, rather than losing the prepass after the first cleanup.
    const detachReplay = model.attachDepth()
    expect(copy.children).toHaveLength(1)
    const replayProxy = copy.children[0] as Mesh<BoxGeometry, MeshBasicMaterial>
    expect(replayProxy).not.toBe(proxy)
    expect(replayProxy.geometry).toBe(geometry)
    expect(neighborCopy.children).toHaveLength(0)
    const disposeReplayProxy = vi.spyOn(replayProxy.material, 'dispose')
    const restoreReplayLights = optimizeZeroContributionLights(model.root)
    detachReplay()
    restoreReplayLights()
    model.dispose()
    expect(copy.children).toHaveLength(0)
    expect(disposeReplayProxy).toHaveBeenCalledOnce()
    expect(disposeGeometry).not.toHaveBeenCalled()
    expect(disposeRails).not.toHaveBeenCalled()
    expect(disposeNeighbor).not.toHaveBeenCalled()
    geometry.dispose()
    rails.dispose()
    neighbor.dispose()
  },
)

it('covers static cabin walls but excludes glass and unrelated meshes from depth', () => {
  const source = new Group()
  const geometry = new BoxGeometry()
  const wall = new MeshStandardMaterial()
  const glass = new MeshStandardMaterial({ transparent: true, opacity: 0.1 })
  for (const [name, material] of [
    ['CABIN_MASTER_cabin_wall', wall],
    ['CABIN_MASTER_cabin_glass', glass],
    ['CABIN_MASTER_access_status_panel', wall],
  ] as const) {
    const mesh = new Mesh(geometry, material)
    mesh.name = name
    source.add(mesh)
  }
  const model = prepareCabinMaster(source)
  const cleanup = model.attachDepth()
  expect(model.root.children.map((mesh) => mesh.children.length)).toEqual([
    1, 0, 0,
  ])
  expect(source.children.every((mesh) => mesh.children.length === 0)).toBe(true)
  cleanup()
  model.dispose()
  wall.dispose()
  glass.dispose()
  geometry.dispose()
})

it('clears the former sofa and table but blocks the new ledge, EVA and technical bank', () => {
  const occupied = (x: number, y: number, z: number) =>
    CABIN_MASTER_COLLIDERS.some(
      ({ position: p, halfSize: h }) =>
        Math.abs(x - p[0]) <= h[0] &&
        Math.abs(y - p[1]) <= h[1] &&
        Math.abs(z - p[2]) <= h[2],
    )
  expect(occupied(-3.4, 0.7, 16)).toBe(false)
  expect(occupied(-3.7, 0.4, 13.9)).toBe(false)
  expect(occupied(-4.15, 0.7, 16)).toBe(true)
  expect(occupied(-2.17, 1.6, 17.8)).toBe(true)
  expect(occupied(4, 1.6, 15)).toBe(true)
  // Both former end gaps and the space above the equipment remain sealed.
  for (const z of [11.9, 12.35, 18, 18.4]) {
    expect(occupied(4.4, 1.6, z)).toBe(true)
    expect(occupied(4.4, 3, z)).toBe(true)
    expect(occupied(3.2, 1.6, z)).toBe(false)
  }
  const technical = CABIN_MASTER_COLLIDERS.find(
    ({ id }) => id === 'technical-wall',
  )!
  for (const panel of CABIN_TECHNICAL_END_PANELS) {
    expect(panel.position[0] - panel.size[0] / 2).toBeCloseTo(
      technical.position[0] - technical.halfSize[0],
    )
    expect(panel.position[1] + panel.size[1] / 2).toBeCloseTo(
      technical.position[1] + technical.halfSize[1],
    )
  }
  for (let z = 12; z < 18; z += 0.1) expect(occupied(0, 1, z)).toBe(false)
  expect(CABIN_MASTER_FLOOR.position[1] + CABIN_MASTER_FLOOR.halfSize[1]).toBe(
    0,
  )
  expect(
    CABIN_MASTER_FLOOR.position[2] - CABIN_MASTER_FLOOR.halfSize[2],
  ).toBeCloseTo(11.86)
})
