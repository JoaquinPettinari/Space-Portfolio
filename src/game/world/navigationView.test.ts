import {
  Box3,
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Vector3,
} from 'three'
import { OrbitControls } from 'three-stdlib'
import { expect, it } from 'vitest'
import {
  createNavigationShip,
  navigateExterior,
  NAVIGATION_CAMERA,
  NAVIGATION_MIN_DISTANCE,
  NAVIGATION_MAX_DISTANCE,
} from './navigationView'

it('centers the hull at the orbit target without moving or disposing cached resources', () => {
  const source = new Group()
  source.position.set(9, -4, 20)
  const geometry = new BoxGeometry(8, 3, 24)
  const material = new MeshBasicMaterial()
  const mesh = new Mesh(geometry, material)
  mesh.position.set(-1, 2, 8)
  source.add(mesh)
  const view = createNavigationShip(source)
  const bounds = new Box3().setFromObject(view)
  expect(bounds.getCenter(new Vector3()).length()).toBeLessThan(1e-10)
  expect(bounds.getSize(new Vector3()).z).toBeCloseTo(4)
  expect(source.position.toArray()).toEqual([9, -4, 20])
  expect(mesh.position.toArray()).toEqual([-1, 2, 8])
  expect(view.children[0]).not.toBe(source)
  const copiedMesh = view.children[0].children[0] as Mesh
  expect(copiedMesh.geometry).toBe(geometry)
  expect(copiedMesh.material).toBe(material)
  geometry.dispose()
  material.dispose()
})

it('orbits and zooms around a stationary origin, clamps distance and restores the starting view', () => {
  const camera = new PerspectiveCamera(40, 4, 0.1, 80)
  camera.position.set(...NAVIGATION_CAMERA)
  const orbit = new OrbitControls(camera, document.createElement('canvas'))
  orbit.enablePan = false
  orbit.enableDamping = false
  orbit.minDistance = NAVIGATION_MIN_DISTANCE
  orbit.maxDistance = NAVIGATION_MAX_DISTANCE
  orbit.minPolarAngle = 0.05
  orbit.maxPolarAngle = Math.PI - 0.05
  orbit.saveState()
  const initial = camera.position.clone()
  const distance = camera.position.length()
  try {
    navigateExterior(orbit, 'right')
    navigateExterior(orbit, 'up')
    expect(camera.position.distanceTo(initial)).toBeGreaterThan(1)
    expect(camera.position.length()).toBeCloseTo(distance)
    expect(orbit.target.toArray()).toEqual([0, 0, 0])
    expect(
      camera
        .getWorldDirection(new Vector3())
        .dot(camera.position.clone().normalize()),
    ).toBeCloseTo(-1)
    for (let i = 0; i < 40; i++) navigateExterior(orbit, 'in')
    expect(camera.position.length()).toBeCloseTo(NAVIGATION_MIN_DISTANCE)
    for (let i = 0; i < 40; i++) navigateExterior(orbit, 'out')
    expect(camera.position.length()).toBeCloseTo(NAVIGATION_MAX_DISTANCE)
    for (let i = 0; i < 40; i++) navigateExterior(orbit, 'up')
    expect(orbit.getPolarAngle()).toBeCloseTo(0.05)
    navigateExterior(orbit, 'reset')
    expect(camera.position.distanceTo(initial)).toBeLessThan(1e-10)
    expect(orbit.target.toArray()).toEqual([0, 0, 0])
  } finally {
    orbit.dispose()
  }
})
