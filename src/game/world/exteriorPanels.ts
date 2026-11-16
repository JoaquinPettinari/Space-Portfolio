import { BOW_EDGES, segmentPose } from './bridgeLayout'
import type { StaticPanel } from './StaticPanels'

/** Original box dimensions, transforms and finishes, uploaded as static instances. */
export const EXTERIOR_PANELS: StaticPanel[] = []
for (const [a, b] of BOW_EDGES) {
  const edge = segmentPose(a, b)
  const add = (
    x: number,
    y: number,
    z: number,
    size: StaticPanel['size'],
    color: string,
    metalness: number,
    roughness: number,
  ) =>
    EXTERIOR_PANELS.push({
      at: [
        edge.x + Math.cos(edge.yaw) * x + Math.sin(edge.yaw) * z,
        y,
        edge.z - Math.sin(edge.yaw) * x + Math.cos(edge.yaw) * z,
      ],
      yaw: edge.yaw,
      size,
      color,
      metalness,
      roughness,
    })
  add(0, 0.45, -0.35, [edge.length + 0.12, 0.3, 0.7], '#394249', 0.35, 0.65)
  for (const fraction of [-0.32, 0.32])
    add(
      edge.length * fraction,
      0.62,
      -0.35,
      [0.055, 0.04, 0.7],
      '#778087',
      0,
      0.75,
    )
}
for (const side of [-1, 1])
  EXTERIOR_PANELS.push({
    at: [side * 5.05, 0.45, 3.2],
    size: [0.7, 0.3, 5.6],
    color: '#394249',
    metalness: 0.35,
    roughness: 0.65,
  })
