import { ENTRY_OFFSET } from './bridgeLayout'

export const PANORAMIC_BAY_ASSET = '/models/cruz-del-sur-panoramic-bay.glb'

export const PASSAGE_START = 5.1
export const PASSAGE_DEPTH = ENTRY_OFFSET + 0.1
export const PASSAGE_CENTER = PASSAGE_START + PASSAGE_DEPTH / 2
export const BAY_DEPTH = PASSAGE_DEPTH / 3
export const BAY_CENTERS = Array.from(
  { length: 3 },
  (_, i) => PASSAGE_START + (i + 0.5) * BAY_DEPTH,
)
export const PASSAGE_PROFILE = [
  [1.65, 0.1],
  [2.05, 0.85],
  [2.05, 2.4],
  [1.65, 3.2],
] as const
export const COLLAR_DEPTH = 0.12
export const COLLAR_OPENING = { width: 2.68, height: 2.5 } as const
export const COLLAR_CENTERS = [
  PASSAGE_START + COLLAR_DEPTH / 2,
  PASSAGE_START + PASSAGE_DEPTH - COLLAR_DEPTH / 2,
]

export const PASSAGE_WALLS = [-1, 1].flatMap((side) =>
  PASSAGE_PROFILE.slice(1).map((point, i) => {
    const a = PASSAGE_PROFILE[i]
    const dx = side * (point[0] - a[0])
    const dy = point[1] - a[1]
    return {
      position: [
        (side * (a[0] + point[0])) / 2,
        (a[1] + point[1]) / 2,
        PASSAGE_CENTER,
      ] as [number, number, number],
      rotation: [0, 0, -Math.atan2(dx, dy)] as [number, number, number],
      halfLength: Math.hypot(dx, dy) / 2,
    }
  }),
)

// Three convex sections leave an unobstructed opening matching both existing frames.
export const COLLAR_POLYGONS: [number, number][][] = [
  ...[-1, 1].map((side) =>
    [
      [1.34, 0],
      [1.65, 0],
      [2.05, 0.85],
      [2.05, 2.4],
      [1.65, 3.2],
      [1.34, 3.2],
    ].map(([x, y]) => [side * x, y] as [number, number]),
  ),
  [
    [-1.34, 2.5],
    [1.34, 2.5],
    [1.34, 3.2],
    [-1.34, 3.2],
  ],
]
