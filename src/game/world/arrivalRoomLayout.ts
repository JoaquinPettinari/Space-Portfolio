import cabinLayout from './arrivalCabinLayout.json' with { type: 'json' }
import shellLayout from './arrivalShellLayout.json' with { type: 'json' }

/** Metres in the exported room's local coordinates (X right, Y up, Z aft). */
export const ARRIVAL_ORIGIN_Z = 12.07
export const ARRIVAL_BASE_DEPTH = 4.13
export const ARRIVAL_PLAN_SCALE = 1.5
export const ARRIVAL_DEPTH = ARRIVAL_BASE_DEPTH * ARRIVAL_PLAN_SCALE
export const ARRIVAL_EXTENSION = ARRIVAL_DEPTH - ARRIVAL_BASE_DEPTH
type Point = [number, number, number]
type Box = { position: Point; halfSize: Point }

export function arrivalPortExpansion(z: number) {
  return (
    0.65 *
    Math.sin(
      (Math.PI * Math.max(0, Math.min(ARRIVAL_BASE_DEPTH, z))) /
        ARRIVAL_BASE_DEPTH,
    ) **
      2
  )
}
/** Same envelope deformation used by the V4 Blender source. */
export function arrivalSurface(x: number, y: number, z: number): Point {
  const bowedX =
    x - arrivalPortExpansion(z) * Math.max(0, Math.min(1, (-x - 0.5) / 2.26))
  const raisedY =
    y +
    0.38 *
      Math.max(0, 1 - (Math.abs(bowedX) / 2.8) ** 2) *
      Math.max(0, Math.min(1, (y - 2.45) / 0.55))
  return [bowedX, raisedY, z]
}
const hull = (points: Point[]) => new Float32Array(points.flat())
// Broad convex strips approximate the shell, not its decorative bevel triangles.
export const ARRIVAL_SHELL_HULLS: Float32Array[] = []
const divisions = 12
for (let i = 0; i < divisions; i++) {
  const z0 = (i * ARRIVAL_BASE_DEPTH) / divisions,
    z1 = ((i + 1) * ARRIVAL_BASE_DEPTH) / divisions
  ARRIVAL_SHELL_HULLS.push(
    hull(
      [z0, z1].flatMap((z) => {
        const left = arrivalSurface(-2.8, 0, z)[0]
        return [
          [left, -0.24, z],
          [2.8, -0.24, z],
          [2.8, 0, z],
          [left, 0, z],
        ] as Point[]
      }),
    ),
  )
  const portProfile = [
    [-2.76, 0],
    [-2.76, 0.8],
    [-2.49, 2.45],
    [-2.12, 3],
  ]
  for (let j = 0; j < portProfile.length - 1; j++) {
    const a = portProfile[j],
      b = portProfile[j + 1]
    ARRIVAL_SHELL_HULLS.push(
      hull(
        [z0, z1].flatMap((z) =>
          [-0.07, 0.07].flatMap((offset) => {
            const p = arrivalSurface(a[0], a[1], z),
              q = arrivalSurface(b[0], b[1], z)
            return [
              [p[0] + offset, p[1], z],
              [q[0] + offset, q[1], z],
            ] as Point[]
          }),
        ),
      ),
    )
  }
  const roofProfile = [
    [-2.12, 3],
    [-1.06, 3],
    [0, 3],
    [1.06, 3],
    [2.12, 3],
    [2.72, 2.45],
  ]
  for (let j = 0; j < roofProfile.length - 1; j++) {
    const a = roofProfile[j],
      b = roofProfile[j + 1]
    ARRIVAL_SHELL_HULLS.push(
      hull(
        [z0, z1].flatMap((z) =>
          [0, 0.12].flatMap((offset) => {
            const p = arrivalSurface(a[0], a[1], z),
              q = arrivalSurface(b[0], b[1], z)
            return [
              [p[0], p[1] + offset, z],
              [q[0], q[1] + offset, z],
            ] as Point[]
          }),
        ),
      ),
    )
  }
}
export const ARRIVAL_BOXES: Box[] = [
  {
    position: [4.2, 1.22, ARRIVAL_DEPTH / 2],
    halfSize: [0.12, 1.22, ARRIVAL_DEPTH / 2],
  },
  ...[-1, 1].flatMap((side): Box[] => [
    {
      position: [side * 2.08 * 1.5, 1.25, -0.06],
      halfSize: [0.74 * 1.5, 1.25, 0.06],
    },
    { position: [side * 1.675, 1.25, -0.06], halfSize: [0.335, 1.25, 0.06] },
    { position: [side * 1.48, 1.28, 0.2], halfSize: [0.125, 1.28, 0.1] },
    {
      position: [side * 3, 1.25, 4.18 + ARRIVAL_EXTENSION],
      halfSize: [1.2, 1.25, 0.08],
    },
    {
      position: [side * 1.5, 1.25, 4.18 + ARRIVAL_EXTENSION],
      halfSize: [0.3, 1.25, 0.08],
    },
    {
      position: [side * 1.22, 1.25, 4.08 + ARRIVAL_EXTENSION],
      halfSize: [0.06, 1.25, 0.1],
    },
  ]),
  { position: [0, 2.95, -0.02], halfSize: [4.2, 0.55, 0.1] },
  {
    position: [0, 2.95, 4.18 + ARRIVAL_EXTENSION],
    halfSize: [4.2, 0.55, 0.08],
  },
]
for (const vertices of ARRIVAL_SHELL_HULLS) {
  for (let i = 0; i < vertices.length; i += 3) {
    vertices[i] *= ARRIVAL_PLAN_SCALE
    vertices[i + 2] *= ARRIVAL_PLAN_SCALE
  }
}
export const ARRIVAL_FURNITURE: Box[] = [
  {
    position: [
      cabinLayout.sideTable.x,
      cabinLayout.sideTable.height / 2,
      cabinLayout.sideTable.z - ARRIVAL_ORIGIN_Z,
    ],
    halfSize: [
      cabinLayout.sideTable.width / 2,
      cabinLayout.sideTable.height / 2,
      cabinLayout.sideTable.length / 2,
    ],
  },
  // The rear sill and straight bench form one closed furniture volume.
  {
    position: [
      (-shellLayout.wallX + cabinLayout.bench.x + cabinLayout.bench.depth / 2) /
        2,
      cabinLayout.bench.height / 2,
      (cabinLayout.bench.startZ + cabinLayout.bench.endZ) / 2 -
        ARRIVAL_ORIGIN_Z,
    ],
    halfSize: [
      (cabinLayout.bench.x + cabinLayout.bench.depth / 2 - -shellLayout.wallX) /
        2,
      cabinLayout.bench.height / 2,
      (cabinLayout.bench.endZ - cabinLayout.bench.startZ) / 2,
    ],
  },
  // Continuous plinth and end returns close the service bank, including gaps.
  {
    position: [
      (cabinLayout.serviceBay.frontX + cabinLayout.serviceBay.rearX) / 2,
      cabinLayout.serviceBay.height / 2,
      (cabinLayout.serviceBay.startZ + cabinLayout.serviceBay.endZ) / 2 -
        ARRIVAL_ORIGIN_Z,
    ],
    halfSize: [
      (cabinLayout.serviceBay.rearX - cabinLayout.serviceBay.frontX) / 2,
      cabinLayout.serviceBay.height / 2,
      (cabinLayout.serviceBay.endZ - cabinLayout.serviceBay.startZ) / 2,
    ],
  },
  {
    position: [-3.55 - arrivalPortExpansion(0.48), 0.51, 0.48],
    halfSize: [0.55, 0.51, 0.36],
  },
]

/** Retain the original floor footprint; unified structural mesh owns walls/roof. */
export const ARRIVAL_FLOOR_HULLS = ARRIVAL_SHELL_HULLS.filter((vertices) =>
  Array.from(vertices).every((value, i) => i % 3 !== 1 || value <= 0.0001),
)
