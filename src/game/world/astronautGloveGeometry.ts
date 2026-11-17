import {
  BufferAttribute,
  type BufferGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  TorusGeometry,
  Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** One static, vertex-coloured draw for the shared tablet/card glove.
 * Soft shading is baked for the camera prop; the reader also receives room light.
 * Dimensions are local metres, wrist down -Y and tablet grip toward -X. */
export const GLOVE_POINT_FINGERTIP = [-0.055, 0.36, 0.02] as const

export function createAstronautGloveGeometry(pose: 'grip' | 'point' = 'grip') {
  const pieces: BufferGeometry[] = []
  const light = new Vector3(-0.4, 0.7, 1).normalize()
  const normal = new Vector3()
  const add = (
    source: BufferGeometry,
    color: string,
    position: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0],
  ) => {
    source.rotateX(rotation[0])
    source.rotateY(rotation[1])
    source.rotateZ(rotation[2])
    source.translate(...position)
    const geometry = source.index ? source.toNonIndexed() : source
    if (geometry !== source) source.dispose()
    const normals = geometry.getAttribute('normal')
    const colors = new Float32Array(normals.count * 3)
    const base = new Color(color)
    for (let i = 0; i < normals.count; i++) {
      normal.fromBufferAttribute(normals, i)
      const shade = 0.66 + Math.max(0, normal.dot(light)) * 0.34
      colors.set([base.r * shade, base.g * shade, base.b * shade], i * 3)
    }
    geometry.setAttribute('color', new BufferAttribute(colors, 3))
    pieces.push(geometry)
  }
  const softBox = (x: number, y: number, z: number, radius: number) =>
    new RoundedBoxGeometry(x, y, z, 2, radius)
  // Black pressure glove, raised knuckle pads and curved fingertips gripping an edge.
  add(softBox(0.158, 0.23, 0.125, 0.045), '#263039', [0, 0, 0])
  add(softBox(0.108, 0.16, 0.025, 0.012), '#37414a', [0.025, 0.012, 0.065])
  for (let finger = pose === 'point' ? 1 : 0; finger < 4; finger++) {
    const y = 0.075 - finger * 0.049
    add(
      new CapsuleGeometry(0.023, 0.075, 4, 10),
      '#252c33',
      [-0.052, y, 0.038],
      [0, 0, Math.PI / 2],
    )
    add(
      new CapsuleGeometry(0.021, 0.028, 4, 10),
      '#414951',
      [-0.096, y, 0.012],
      [0.35, 0, 0.2],
    )
    add(softBox(0.038, 0.027, 0.011, 0.006), '#4d5358', [-0.038, y, 0.063])
  }
  if (pose === 'point') {
    add(
      new CapsuleGeometry(0.024, 0.09, 5, 12),
      '#303941',
      [-0.055, 0.205, 0.02],
    )
    add(
      new CapsuleGeometry(0.022, 0.085, 5, 12),
      '#3e474e',
      [-0.055, 0.295, 0.02],
    )
    add(softBox(0.032, 0.026, 0.01, 0.004), '#626a70', [-0.055, 0.24, 0.04])
  }
  // Thin seam strips and articulated knuckle pads break up the mitten silhouette.
  for (let row = 0; row < 3; row++) {
    add(softBox(0.075, 0.009, 0.008, 0.003), '#58616a', [
      0.023,
      0.045 - row * 0.042,
      0.082,
    ])
    add(softBox(0.008, 0.022, 0.008, 0.003), '#899095', [
      0.069,
      0.045 - row * 0.042,
      0.062,
    ])
  }
  // A diagonal thumb sits on the front bezel, separate from the four rear fingers.
  add(
    new CapsuleGeometry(0.03, 0.095, 5, 12),
    '#303a42',
    [-0.068, 0.108, 0.09],
    [0.15, 0, -0.45],
  )
  add(
    new CapsuleGeometry(0.026, 0.035, 4, 10),
    '#444d55',
    [-0.085, 0.155, 0.085],
    [0, 0, -0.7],
  )
  add(softBox(0.035, 0.13, 0.012, 0.007), '#c26b2c', [0.066, -0.003, 0.052])
  // Pressure seal, brushed metal cuff and layered woven sleeve.
  add(
    new CylinderGeometry(0.092, 0.099, 0.08, 16),
    '#1d272e',
    [0, -0.155, -0.008],
  )
  add(
    new CylinderGeometry(0.105, 0.105, 0.043, 20),
    '#aeb7bb',
    [0, -0.211, -0.012],
  )
  add(
    new CylinderGeometry(0.112, 0.112, 0.022, 20),
    '#46505a',
    [0, -0.239, -0.012],
  )
  add(new CapsuleGeometry(0.105, 0.27, 5, 16), '#b7bec0', [0, -0.43, -0.035])
  for (let rib = 0; rib < 4; rib++)
    add(
      new TorusGeometry(0.104, 0.008, 4, 20),
      '#727c83',
      [0, -0.28 - rib * 0.033, -0.035],
      [Math.PI / 2, 0, 0],
    )
  add(softBox(0.062, 0.19, 0.016, 0.009), '#cb7638', [0.035, -0.47, 0.065])
  add(softBox(0.023, 0.16, 0.018, 0.006), '#d5d8d5', [-0.036, -0.48, 0.067])
  try {
    const geometry = mergeGeometries(pieces)
    if (!geometry) throw new Error('Could not merge astronaut glove')
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    return geometry
  } finally {
    pieces.forEach((piece) => piece.dispose())
  }
}
