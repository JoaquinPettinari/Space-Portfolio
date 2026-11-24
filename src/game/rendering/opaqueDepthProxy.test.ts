// @vitest-environment node
import { expect, it, vi } from 'vitest'
import {
  BoxGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Raycaster,
  ShaderMaterial,
  SkinnedMesh,
  Texture,
  Vector3,
} from 'three'
import { installOpaqueDepthProxy } from './opaqueDepthProxy'

it('shares the exact geometry and transform without intercepting interactions or disposing shared resources', () => {
  const geometry = new BoxGeometry()
  const material = new MeshStandardMaterial({ side: DoubleSide })
  const mesh = new Mesh(geometry, material)
  mesh.name = 'opaque-rails'
  mesh.position.set(0.2, 0.1, -3)
  mesh.rotation.set(0.2, 0.3, 0)
  mesh.scale.set(1.5, 0.8, 1.2)
  const parent = new Group()
  parent.position.set(0, 0, -1)
  parent.add(mesh)
  const geometryDisposed = vi.fn()
  const materialDisposed = vi.fn()
  geometry.addEventListener('dispose', geometryDisposed)
  material.addEventListener('dispose', materialDisposed)
  const cleanup = installOpaqueDepthProxy(mesh)
  expect(mesh.children).toHaveLength(1)
  const proxy = mesh.children[0] as Mesh<BoxGeometry, MeshBasicMaterial>
  parent.updateMatrixWorld(true)
  expect(proxy.geometry).toBe(geometry)
  expect(proxy.matrixWorld.equals(mesh.matrixWorld)).toBe(true)
  expect(proxy.material.side).toBe(material.side)
  expect(proxy.material.colorWrite).toBe(false)
  expect(proxy.material.depthWrite).toBe(true)
  expect(proxy.renderOrder).toBeLessThan(mesh.renderOrder)
  const ray = new Raycaster(new Vector3(0, 0, 0), new Vector3(0, 0, -1))
  expect(ray.intersectObject(proxy, false)).toEqual([])
  expect(ray.intersectObject(mesh, true).length).toBeGreaterThan(0)
  expect(
    ray.intersectObject(mesh, true).every((hit) => hit.object === mesh),
  ).toBe(true)
  const proxyDisposed = vi.fn()
  proxy.material.addEventListener('dispose', proxyDisposed)
  cleanup()
  cleanup()
  expect(mesh.children).toHaveLength(0)
  expect(proxyDisposed).toHaveBeenCalledOnce()
  expect(geometryDisposed).not.toHaveBeenCalled()
  expect(materialDisposed).not.toHaveBeenCalled()
  geometry.dispose()
  material.dispose()
})

it('rejects cutout, displaced, transparent, transmissive and custom shader materials', () => {
  const texture = new Texture()
  const custom = new MeshStandardMaterial()
  custom.onBeforeCompile = (shader) => {
    shader.vertexShader += '\n// custom vertex behavior'
  }
  const materials = [
    new MeshStandardMaterial({ transparent: true }),
    new MeshStandardMaterial({ alphaTest: 0.5 }),
    new MeshStandardMaterial({ alphaHash: true }),
    new MeshStandardMaterial({ alphaMap: texture }),
    new MeshStandardMaterial({ displacementMap: texture }),
    new MeshStandardMaterial({ wireframe: true }),
    new MeshStandardMaterial({ depthWrite: false }),
    new MeshPhysicalMaterial({ transmission: 1 }),
    new ShaderMaterial(),
    custom,
  ]
  const geometry = new BoxGeometry()
  for (const material of materials) {
    const mesh = new Mesh(geometry, material)
    const cleanup = installOpaqueDepthProxy(mesh)
    expect(mesh.children).toHaveLength(0)
    cleanup()
    material.dispose()
  }
  geometry.dispose()
  texture.dispose()
})

it('rejects skinning, morphs, instances and material groups instead of inventing an occluder', () => {
  const geometry = new BoxGeometry()
  const morphGeometry = geometry.clone()
  morphGeometry.morphAttributes.position = [
    new Float32BufferAttribute(
      new Float32Array(geometry.getAttribute('position').array),
      3,
    ),
  ]
  const material = new MeshStandardMaterial()
  const meshes = [
    new SkinnedMesh(geometry, material),
    new InstancedMesh(geometry, material, 1),
    new Mesh(morphGeometry, material),
    new Mesh(geometry, [material]),
  ]
  for (const mesh of meshes) {
    const cleanup = installOpaqueDepthProxy(mesh)
    expect(mesh.children).toHaveLength(0)
    cleanup()
  }
  geometry.dispose()
  morphGeometry.dispose()
  material.dispose()
})
