import { Matrix4, Quaternion, Vector3 } from 'three'
import { ROOF_PANELS, type RoofPoint } from './bridgeLayout'

const edges = new Map<string, readonly [RoofPoint, RoofPoint]>()
for (const { points } of ROOF_PANELS) {
  points.forEach((a, index) => {
    const b = points[(index + 1) % points.length]
    edges.set([a.join(','), b.join(',')].sort().join('|'), [a, b])
  })
}
export const ROOF_EDGES = [...edges.values()]
/** Same endpoints and 12 cm section as the original individual beams. */
export const ROOF_FRAME_MATRICES = ROOF_EDGES.map(([a, b]) => {
  const from = new Vector3(...a),
    to = new Vector3(...b)
  const direction = to.clone().sub(from)
  const length = direction.length()
  return new Matrix4().compose(
    from.add(to).multiplyScalar(0.5),
    new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      direction.normalize(),
    ),
    new Vector3(0.12, length, 0.12),
  )
})
export const ROOF_LIGHT_MATRICES = [1.1, 3.9].flatMap((z) =>
  [-2, 2].map((x) =>
    new Matrix4().compose(
      new Vector3(x, 3.205, z),
      new Quaternion(),
      new Vector3(1.1, 0.025, 0.08),
    ),
  ),
)
