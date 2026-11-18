// @vitest-environment node
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from 'three'
import { expect, it, vi } from 'vitest'
import { prepareArrivalShellMaterials } from './arrivalShellMaterials'
import { createArrivalEnvironmentChannel } from './arrivalEnvironment'

it('finishes only arrival structural batches without mutating shared bridge resources', () => {
  const root = new Group()
  const geometry = new BoxGeometry()
  const material = new MeshStandardMaterial({ roughness: 0.8 })
  material.name = 'UNIFIED / Graphite ceramic'
  const arrival = new Mesh(geometry, material)
  arrival.name = 'UNIFIED_RUNTIME_arrival_UNIFIED_Graphite ceramic'
  const bridge = new Mesh(geometry, material)
  bridge.name = 'UNIFIED_RUNTIME_bridge_UNIFIED_Graphite ceramic'
  root.add(arrival, bridge)
  const originalGeometryDisposal = vi.spyOn(geometry, 'dispose')
  const originalMaterialDisposal = vi.spyOn(material, 'dispose')
  const finishes = prepareArrivalShellMaterials(root)
  const reflection = new Texture()
  finishes.setReflection(reflection)
  expect(arrival.material).not.toBe(material)
  expect(arrival.geometry).not.toBe(geometry)
  expect(arrival.geometry.getAttribute('uv1')).toBeDefined()
  expect(bridge.material).toBe(material)
  expect(bridge.geometry).toBe(geometry)
  expect(material.envMap).toBeNull()
  expect(arrival.material.envMap).toBe(reflection)
  expect(arrival.material.roughnessMap).toBe(arrival.material.bumpMap)
  finishes.setPower(0.12)
  expect(arrival.material.envMapIntensity).toBeCloseTo(0.55 * 0.12)
  const ownGeometryDisposal = vi.spyOn(arrival.geometry, 'dispose')
  const ownMaterialDisposal = vi.spyOn(arrival.material, 'dispose')
  const ownTextureDisposal = vi.spyOn(arrival.material.bumpMap!, 'dispose')
  finishes.dispose()
  expect(ownGeometryDisposal).toHaveBeenCalledOnce()
  expect(ownMaterialDisposal).toHaveBeenCalledOnce()
  expect(ownTextureDisposal).toHaveBeenCalledOnce()
  expect(originalGeometryDisposal).not.toHaveBeenCalled()
  expect(originalMaterialDisposal).not.toHaveBeenCalled()
  geometry.dispose()
  material.dispose()
  reflection.dispose()
})

it('shares one reflection with late subscribers and clears it before target disposal', () => {
  const channel = createArrivalEnvironmentChannel()
  const first = vi.fn(),
    second = vi.fn()
  const unsubscribe = channel.subscribe(first)
  const texture = new Texture()
  const resources = {
    reflection: texture,
  }
  channel.publish(resources)
  channel.subscribe(second)
  expect(first).toHaveBeenLastCalledWith(resources)
  expect(second).toHaveBeenLastCalledWith(resources)
  unsubscribe()
  channel.publish(null)
  expect(first).toHaveBeenCalledTimes(2)
  expect(second).toHaveBeenLastCalledWith(null)
  texture.dispose()
})
