// @vitest-environment node
import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Raycaster,
  Vector3,
} from 'three'
import { expect, it, vi } from 'vitest'
import { prepareTransitionReplacement } from '../../../scripts/assets/transitionGeometry.ts'
import { trimTransitionBackPanels } from './transitionLayout'

it('removes the whole previous entrance frame, including its front face', () => {
  const geometry = new BoxGeometry(0.12, 2.7, 0.4)
  const material = new MeshStandardMaterial()
  const source = new Group()
  for (const side of [-1, 1]) {
    const post = new Mesh(geometry, material)
    post.name = 'REFINED_bridge_static_previous_frame'
    post.position.set(side * 1.4, 1.35, 2)
    source.add(post)
  }
  const prepared = prepareTransitionReplacement(source)
  try {
    prepared.root.traverse((node) => {
      if (node instanceof Mesh)
        expect(node.geometry.getAttribute('position').count).toBe(0)
    })
  } finally {
    prepared.dispose()
    geometry.dispose()
    material.dispose()
  }
})

it('cuts the transition out of mixed batches without removing adjacent bridge surfaces', () => {
  const source = new Group()
  const geometry = new PlaneGeometry(10, 8).rotateX(-Math.PI / 2)
  const material = new MeshStandardMaterial({ side: DoubleSide })
  const mesh = new Mesh(geometry, material)
  mesh.name = 'REFINED_bridge_static_graphite'
  mesh.position.z = 3.6
  source.add(mesh)
  const originalPositions = geometry.getAttribute('position').array.slice()
  const sourceDispose = vi.spyOn(geometry, 'dispose')
  const materialDispose = vi.spyOn(material, 'dispose')
  const prepared = prepareTransitionReplacement(source)
  const ownedMesh = prepared.root.getObjectByName(mesh.name) as Mesh
  const down = (x: number, z: number) =>
    new Raycaster(new Vector3(x, 2, z), new Vector3(0, -1, 0)).intersectObject(
      prepared.root,
      true,
    )
  expect(ownedMesh.geometry).not.toBe(geometry)
  expect(ownedMesh.material).toBe(material)
  for (const z of [2.6, 3.6, 4.6]) expect(down(0, z)).toHaveLength(0)
  for (const x of [-4, 4]) expect(down(x, 3.6)[0]?.point.y).toBeCloseTo(0)
  expect(down(0, 0)[0]?.point.y).toBeCloseTo(0)
  const p = ownedMesh.geometry.getAttribute('position')
  const uv = ownedMesh.geometry.getAttribute('uv')
  const normal = ownedMesh.geometry.getAttribute('normal')
  for (let i = 0; i < p.count; i++) {
    expect(uv.getX(i)).toBeCloseTo(p.getX(i) / 10 + 0.5)
    expect(uv.getY(i)).toBeCloseTo(0.5 - p.getZ(i) / 8)
    expect(normal.getY(i)).toBeCloseTo(1)
  }
  expect(geometry.getAttribute('position').array).toEqual(originalPositions)
  const ownedDispose = vi.spyOn(ownedMesh.geometry, 'dispose')
  prepared.dispose()
  expect(ownedDispose).toHaveBeenCalledOnce()
  expect(sourceDispose).not.toHaveBeenCalled()
  expect(materialDispose).not.toHaveBeenCalled()
  geometry.dispose()
  material.dispose()
})

it('keeps unrelated equipment and nonintersecting batches shared and untouched', () => {
  const source = new Group()
  const geometry = new PlaneGeometry(1, 1)
  const material = new MeshStandardMaterial()
  for (const [name, x] of [
    ['REFINED_bridge_computer_shell', 0],
    ['UNIFIED_RUNTIME_bridge_shell', 8],
  ] as const) {
    const mesh = new Mesh(geometry, material)
    mesh.name = name
    mesh.position.set(x, 1, 3.6)
    source.add(mesh)
  }
  const dispose = vi.spyOn(geometry, 'dispose')
  const prepared = prepareTransitionReplacement(source)
  prepared.root.children.forEach((node) =>
    expect((node as Mesh).geometry).toBe(geometry),
  )
  prepared.dispose()
  expect(dispose).not.toHaveBeenCalled()
  geometry.dispose()
  material.dispose()
})

it('trims only the inner rear wall flanks covered by the wider front niches', () => {
  const source = {
    at: [3.07, 1.65, 2.13] as const,
    size: [3.46, 3.3, 0.06] as const,
    color: '#272b2f',
  }
  const panels = trimTransitionBackPanels([
    source,
    { ...source, at: [-3.07, 1.65, 2.13] },
  ])
  expect(panels).toHaveLength(2)
  expect(panels[0].at[0] - panels[0].size[0] / 2).toBeCloseTo(2.9)
  expect(panels[0].at[0] + panels[0].size[0] / 2).toBeCloseTo(4.8)
  expect(panels[1].at[0] + panels[1].size[0] / 2).toBeCloseTo(-2.9)
  expect(panels[1].at[0] - panels[1].size[0] / 2).toBeCloseTo(-4.8)
  expect(source.size).toEqual([3.46, 3.3, 0.06])
})
