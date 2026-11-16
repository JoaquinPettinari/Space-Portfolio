// @vitest-environment node
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector3,
} from 'three'
import { expect, it, vi } from 'vitest'
import { skipExteriorRaycast } from './spaceScenery'

it('skips the decorative exterior subtree while preserving nearer interactive and blocking surfaces', () => {
  const root = new Group(),
    exterior = new Group()
  const geometry = new BoxGeometry(1, 1, 1),
    material = new MeshBasicMaterial()
  const stars = new Mesh(geometry, material),
    surface = new Mesh(geometry, material)
  stars.position.z = -80
  surface.position.z = -2
  const exteriorPick = vi.spyOn(stars, 'raycast')
  exterior.raycast = skipExteriorRaycast
  exterior.add(stars)
  root.add(exterior, surface)
  root.updateMatrixWorld(true)
  const ray = new Raycaster(new Vector3(), new Vector3(0, 0, -1), 0, 2.8)
  const hits = ray.intersectObject(root, true)
  expect(hits[0].object).toBe(surface)
  expect(hits[0].distance).toBeCloseTo(1.5)
  expect(exteriorPick).not.toHaveBeenCalled()
  geometry.dispose()
  material.dispose()
})
