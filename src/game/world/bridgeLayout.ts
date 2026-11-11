/** Metres, X starboard, Y up, -Z bow. Approved compact exploration footprint. */
export const BRIDGE_OUTLINE = [
  [-4.8, 5.1],
  [-4.8, 0.4],
  [-4.3, -3],
  [-1.9, -5.4],
  [1.9, -5.4],
  [4.3, -3],
  [4.8, 0.4],
  [4.8, 5.1],
] as const
export const BOW_EDGES = BRIDGE_OUTLINE.slice(1, 6).map(
  (point, index) => [point, BRIDGE_OUTLINE[index + 2]] as const,
)
export function segmentPose(
  a: readonly [number, number],
  b: readonly [number, number],
) {
  return {
    x: (a[0] + b[0]) / 2,
    z: (a[1] + b[1]) / 2,
    length: Math.hypot(b[0] - a[0], b[1] - a[1]),
    yaw: -Math.atan2(b[1] - a[1], b[0] - a[0]),
  }
}
export const BRIDGE_FLOOR_VERTICES = new Float32Array(
  [-0.2, 0].flatMap((y) => BRIDGE_OUTLINE.flatMap(([x, z]) => [x, y, z])),
)
export const PASSAGE_LENGTH = 6
export const ENTRY_OFFSET = PASSAGE_LENGTH
export const ROOF_COLLIDER_MARGIN = 0.09
export type RoofPoint = readonly [number, number, number]
/** Canopy perimeter and wall headers share these piecewise-linear profiles. */
export function roofHeight(z: number) {
  if (z >= 0.4) return 3.3
  if (z >= -3) return 3.05 + ((z + 3) / 3.4) * 0.25
  return 2.75 + ((Math.max(-5.4, z) + 5.4) / 2.4) * 0.3
}
export function roofHalfWidth(z: number) {
  if (z >= 0.4) return 4.8
  if (z >= -3) return 4.3 + ((z + 3) / 3.4) * 0.5
  return 1.9 + ((Math.max(-5.4, z) + 5.4) / 2.4) * 2.4
}
type RoofPanel = {
  glass: boolean
  points: readonly RoofPoint[]
}
const stations = [5.1, 2.75, 0.4, -1.3, -3, -4.2, -5.4]
export const ROOF_PANELS: RoofPanel[] = stations
  .slice(0, -1)
  .flatMap((z, index) => {
    const next = stations[index + 1]
    const at = (x: number, depth: number): RoofPoint => [
      x,
      roofHeight(depth),
      depth,
    ]
    return [
      {
        glass: z <= 0.4,
        points: [
          at(-roofHalfWidth(z), z),
          at(-0.16, z),
          at(-0.16, next),
          at(-roofHalfWidth(next), next),
        ],
      },
      {
        glass: false,
        points: [at(-0.16, z), at(0.16, z), at(0.16, next), at(-0.16, next)],
      },
      {
        glass: z <= 0.4,
        points: [
          at(0.16, z),
          at(roofHalfWidth(z), z),
          at(roofHalfWidth(next), next),
          at(0.16, next),
        ],
      },
    ]
  })
/** Approved continuous console, ordered from port to starboard. */
export const CONSOLE_PATH = [
  [-3.3, -2.95],
  [-1.6, -4.65],
  [1.6, -4.65],
  [3.3, -2.95],
] as const
/** Exterior deck is visual only; containment is provided by the interior wall colliders. */
export const NOSE_DECK = [
  [-2.1, 0.8, -5.4],
  [2.1, 0.8, -5.4],
  [0.8, 0.55, -8.2],
  [-0.8, 0.55, -8.2],
] as const
