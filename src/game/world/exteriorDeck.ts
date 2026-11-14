import { BoxGeometry, BufferGeometry, Float32BufferAttribute } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { NOSE_DECK } from './bridgeLayout'

/** Four material batches: structural skin, armor, recesses, amber markers. */
export function buildExteriorDeck() {
  const batches: BufferGeometry[][] = [[], [], [], []]
  const rear = NOSE_DECK[0]
  const front = NOSE_DECK[3]
  const slope = (rear[1] - front[1]) / (rear[2] - front[2])
  const height = (z: number) => rear[1] + (z - rear[2]) * slope
  const width = (z: number) =>
    -rear[0] + ((z - rear[2]) / (front[2] - rear[2])) * (rear[0] - front[0])
  function add(geometry: BufferGeometry, material: number) {
    const flat = geometry.index ? geometry.toNonIndexed() : geometry
    if (flat !== geometry) geometry.dispose()
    flat.deleteAttribute('uv')
    flat.computeVertexNormals()
    batches[material].push(flat)
  }
  function plate(
    points: [number, number][],
    offset: number,
    thickness: number,
    material: number,
  ) {
    const vertices: number[] = []
    const n = points.length
    const at = (i: number, top: boolean) => {
      const [x, z] = points[i]
      return [x, height(z) + offset - (top ? 0 : thickness), z]
    }
    const triangle = (a: number[], b: number[], c: number[]) =>
      vertices.push(...a, ...b, ...c)
    for (let i = 1; i < n - 1; i++) {
      triangle(at(0, true), at(i, true), at(i + 1, true))
      triangle(at(0, false), at(i + 1, false), at(i, false))
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      triangle(at(i, true), at(i, false), at(j, false))
      triangle(at(i, true), at(j, false), at(j, true))
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    add(geometry, material)
  }
  function box(
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    offset: number,
    material: number,
  ) {
    const geometry = new BoxGeometry(w, h, d)
    geometry.rotateX(-Math.atan(slope))
    geometry.translate(x, height(z) + offset + h / 2, z)
    add(geometry, material)
  }
  plate(
    NOSE_DECK.map(([x, , z]) => [x, z]),
    0,
    0.25,
    0,
  )
  // Separate armored tiles with real seams, all above the continuous watertight skin.
  for (let row = 0; row < 5; row++) {
    const back = -5.46 - row * 0.53,
      fore = back - 0.48
    for (const side of [-1, 1]) {
      const points: [number, number][] = [
        [0.1, back],
        [width(back) - 0.07, back],
        [width(fore) - 0.07, fore],
        [0.1, fore],
      ]
      if (side < 0) {
        points.forEach((p) => (p[0] *= -1))
        points.reverse()
      }
      plate(points, 0.024, 0.018, row % 2 === 0 ? 1 : 0)
      for (const z of [back - 0.065, fore + 0.065]) {
        box(side * (width(z) - 0.16), z, 0.035, 0.045, 0.012, 0.026, 2)
      }
    }
  }
  // Raised center service spine, tapered at its ends, not a tall obstruction.
  plate(
    [
      [-0.14, -5.52],
      [0.14, -5.52],
      [0.12, -7.99],
      [-0.12, -7.99],
    ],
    0.065,
    0.045,
    0,
  )
  for (let i = 0; i < 6; i++)
    box(0, -5.7 - i * 0.37, 0.17, 0.27, 0.012, 0.068, 1)
  // Paired recessed heat exchangers and individual low-profile slats.
  for (const side of [-1, 1]) {
    box(side * 0.8, -6.15, 0.46, 0.69, 0.025, 0.025, 0)
    box(side * 0.8, -6.15, 0.38, 0.59, 0.009, 0.053, 2)
    for (let i = 0; i < 8; i++)
      box(side * 0.8, -5.91 - i * 0.068, 0.34, 0.024, 0.014, 0.063, 1)
    box(side * 0.53, -7.38, 0.3, 0.33, 0.032, 0.026, 0)
    box(side * 0.53, -7.38, 0.24, 0.27, 0.012, 0.061, 1)
    // Small service handles and warm navigation housings.
    box(side * 0.53, -7.38, 0.12, 0.025, 0.025, 0.074, 2)
    box(side * 1.61, -5.7, 0.16, 0.23, 0.05, 0.027, 0)
    box(side * 1.61, -5.7, 0.09, 0.12, 0.012, 0.08, 3)
    box(side * 0.64, -7.96, 0.11, 0.15, 0.03, 0.026, 0)
    box(side * 0.64, -7.96, 0.05, 0.09, 0.012, 0.06, 3)
  }
  // Segmented edge armor follows the narrowing hull instead of a rectangular rail.
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row++) {
      const back = -5.5 - row * 0.64
      const fore = back - 0.58
      const points: [number, number][] = [
        [width(back) - 0.22, back],
        [width(back) - 0.035, back],
        [width(fore) - 0.035, fore],
        [width(fore) - 0.22, fore],
      ]
      if (side < 0) {
        points.forEach((p) => (p[0] *= -1))
        points.reverse()
      }
      plate(points, 0.095, 0.06, 0)
    }
    // Cable trays with transverse retaining straps, visible at grazing angles.
    box(side * 0.39, -6.2, 0.085, 1.18, 0.018, 0.028, 2)
    for (let i = 0; i < 4; i++)
      box(side * 0.39, -5.72 - i * 0.3, 0.12, 0.035, 0.018, 0.05, 1)
    // Raised shoulder hatch: chamfered corners and a stepped dark gasket.
    const cx = side * 1.22
    const cz = -5.72
    const outline: [number, number][] = [
      [-0.12, 0.18],
      [0.12, 0.18],
      [0.17, 0.13],
      [0.17, -0.13],
      [0.12, -0.18],
      [-0.12, -0.18],
      [-0.17, -0.13],
      [-0.17, 0.13],
    ]
    plate(
      outline.map(([x, z]) => [cx + x, cz + z]),
      0.059,
      0.032,
      2,
    )
    plate(
      outline.map(([x, z]) => [cx + x * 0.86, cz + z * 0.86]),
      0.078,
      0.015,
      1,
    )
    box(cx, cz, 0.1, 0.026, 0.014, 0.081, 2)
  }
  // Low faceted sensor blister; no tall antenna blocking the panoramic view.
  plate(
    [
      [-0.19, -7.18],
      [0.19, -7.18],
      [0.24, -7.28],
      [0.16, -7.7],
      [-0.16, -7.7],
      [-0.24, -7.28],
    ],
    0.15,
    0.125,
    0,
  )
  plate(
    [
      [-0.13, -7.23],
      [0.13, -7.23],
      [0.17, -7.3],
      [0.11, -7.65],
      [-0.11, -7.65],
      [-0.17, -7.3],
    ],
    0.17,
    0.015,
    1,
  )
  box(0, -7.51, 0.13, 0.11, 0.012, 0.174, 2)
  const merged = batches.map((parts) => {
    const result = mergeGeometries(parts, false)!
    parts.forEach((part) => part.dispose())
    return result
  })
  const result = mergeGeometries(merged, true)!
  merged.forEach((part) => part.dispose())
  result.computeBoundingBox()
  result.computeBoundingSphere()
  return result
}
