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
  return {
    ...pose,
    footprint,
    collider: new Float32Array(
      [0, 1.02].flatMap((y) => footprint.flatMap(([x, z]) => [x, y, z])),
    ),
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
  computer: monitorPose(0),
  communications: monitorPose(2),
}
