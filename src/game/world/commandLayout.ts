import { CONSOLE_PATH, segmentPose } from './bridgeLayout'

type Point = readonly [number, number]
export const CONSOLE_DEPTH = 1.05
const edges = CONSOLE_PATH.slice(0, -1).map((p, i) =>
  segmentPose(p, CONSOLE_PATH[i + 1]),
)
const normals = edges.map(({ yaw }) => [Math.sin(yaw), Math.cos(yaw)] as const)

// Intersect adjacent parallel offsets: shared endpoints create exact miter joins.
function offsetAt(index: number, distance: number): Point {
  const a = normals[Math.max(0, index - 1)]
  const b = normals[Math.min(index, normals.length - 1)]
  const denominator = 1 + a[0] * b[0] + a[1] * b[1]
  const p = CONSOLE_PATH[index]
  return [
    p[0] + ((a[0] + b[0]) * distance) / denominator,
    p[1] + ((a[1] + b[1]) * distance) / denominator,
  ]
}
export const COMMAND_SEGMENTS = edges.map((pose, index) => {
  const footprint = [
    offsetAt(index, -CONSOLE_DEPTH / 2),
    offsetAt(index + 1, -CONSOLE_DEPTH / 2),
    offsetAt(index + 1, CONSOLE_DEPTH / 2),
    offsetAt(index, CONSOLE_DEPTH / 2),
  ]
  // Local X openings: side terminals sit at different points along the desk.
  const opening = (
    { 0: pose.z - 0.4, 2: 0, 4: 0, 6: 2.1 - pose.z } as Record<number, number>
  )[index]
  const localX = ([x, z]: Point) =>
    (x - pose.x) * Math.cos(pose.yaw) - (z - pose.z) * Math.sin(pose.yaw)
  const clip = (boundary: number, sign: number) => {
    const result: Point[] = []
    footprint.forEach((a, i) => {
      const b = footprint[(i + 1) % footprint.length]
      const da = (localX(a) - boundary) * sign
      const db = (localX(b) - boundary) * sign
      if (da >= 0) result.push(a)
      if (da >= 0 !== db >= 0) {
        const t = da / (da - db)
        result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
      }
    })
    return result
  }
  const supports =
    opening === undefined
      ? [footprint]
      : [clip(opening - 0.55, -1), clip(opening + 0.55, 1)]
  const vertices = (points: readonly Point[], bottom: number, top: number) =>
    new Float32Array(
      [bottom, top].flatMap((y) => points.flatMap(([x, z]) => [x, y, z])),
    )
  return {
    ...pose,
    footprint,
    opening,
    supports,
    collider: vertices(footprint, 0.94, 1.04),
    supportColliders: supports.map((p) => vertices(p, 0, 0.94)),
  }
})
function monitorPose(index: number) {
  const segment = edges[index]
  const [nx, nz] = normals[index]
  return {
    position: [segment.x + nx * 0.1, 1.65, segment.z + nz * 0.1] as const,
    rotation: segment.yaw,
    chair: [segment.x + nx * 1.1, 0, segment.z + nz * 1.1] as const,
  }
}
export const COMMAND_POSES = {
  computer: monitorPose(2),
  communications: monitorPose(4),
}

export const SIDE_CHAIRS = {
  personal: { chair: [3.2, 0, 2.1] as const, rotation: -Math.PI / 2 },
  arcade: { chair: [-3.2, 0, 0.4] as const, rotation: Math.PI / 2 },
}
