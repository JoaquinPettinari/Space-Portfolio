import { Box3, Group, Vector3, type Object3D } from 'three'

export const NAVIGATION_CAMERA = [4.2, 2.8, 4.8] as const
export const NAVIGATION_MIN_DISTANCE = 6
export const NAVIGATION_MAX_DISTANCE = 14

/** A separate transform hierarchy, centered on the origin. The loader retains
 * ownership of shared geometry/textures/materials; no cached transform is edited. */
export function createNavigationShip(source: Object3D) {
  const copy = source.clone(true)
  const bounds = new Box3().setFromObject(copy)
  const size = bounds.getSize(new Vector3())
  const extent = Math.max(size.x, size.y, size.z)
  if (!Number.isFinite(extent) || extent <= 0)
    throw new Error('Exterior inspection requires a nonempty ship')
  copy.position.sub(bounds.getCenter(new Vector3()))
  const pivot = new Group()
  pivot.name = 'navigation-centered-ship'
  pivot.add(copy)
  pivot.scale.setScalar(4 / extent)
  return pivot
}

export type NavigationAction =
  'left' | 'right' | 'up' | 'down' | 'in' | 'out' | 'reset'
type OrbitController = {
  getAzimuthalAngle: () => number
  getPolarAngle: () => number
  setAzimuthalAngle: (angle: number) => void
  setPolarAngle: (angle: number) => void
  dollyIn: (scale: number) => void
  dollyOut: (scale: number) => void
  reset: () => void
  update: () => void
}

/** Buttons and keyboard use the same bounded orbit controls as pointer dragging. */
export function navigateExterior(
  orbit: OrbitController,
  action: NavigationAction,
) {
  const step = Math.PI / 12
  switch (action) {
    case 'left':
      orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() - step)
      break
    case 'right':
      orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + step)
      break
    case 'up':
      orbit.setPolarAngle(orbit.getPolarAngle() - step)
      break
    case 'down':
      orbit.setPolarAngle(orbit.getPolarAngle() + step)
      break
    case 'in':
      orbit.dollyIn(1 / 1.2)
      break
    case 'out':
      orbit.dollyOut(1 / 1.2)
      break
    case 'reset':
      orbit.reset()
      break
  }
  orbit.update()
}
