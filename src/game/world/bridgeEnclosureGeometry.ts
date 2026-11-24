import { BoxGeometry, ExtrudeGeometry, Shape } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import enclosure from './bridgeEnclosure.json'

/** Solid replacement for the gap between the new portal and the original roof.
 * The shared world-space profile is also imported by the Blender review scene.
 * Ends above the niches and before the first shelf; the opening stays untouched.
 */
export function createBridgeEnclosureGeometry() {
  const shape = new Shape()
  enclosure.bulkhead.profile.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  })
  shape.closePath()
  const bulkhead = new ExtrudeGeometry(shape, {
    depth: enclosure.bulkhead.depth,
    bevelEnabled: false,
    steps: 1,
  }).translate(0, 0, enclosure.bulkhead.frontZ)
  const parts = [
    bulkhead,
    ...enclosure.panels.map(({ at, size }) => {
      const box = new BoxGeometry(size[0], size[1], size[2])
      const geometry = box.toNonIndexed().translate(at[0], at[1], at[2])
      box.dispose()
      return geometry
    }),
  ]
  const geometry = mergeGeometries(parts)
  parts.forEach((part) => part.dispose())
  if (!geometry) throw new Error('Incompatible bridge enclosure geometry')
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}
