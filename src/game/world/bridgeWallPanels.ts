import { BOW_EDGES, roofHeight, segmentPose } from './bridgeLayout'
import type { StaticPanel } from './StaticPanels'

export const BRIDGE_WALL_PANELS: StaticPanel[] = []
const add = (
  at: StaticPanel['at'],
  size: StaticPanel['size'],
  color = '#252b31',
  glow = false,
  yaw = 0,
) => BRIDGE_WALL_PANELS.push({ at, size, color, glow, yaw })
for (const [a, b] of BOW_EDGES) {
  const edge = segmentPose(a, b),
    left = roofHeight(a[1]),
    right = roofHeight(b[1])
  const place = (
    x: number,
    y: number,
    z: number,
    size: StaticPanel['size'],
    color?: string,
    glow = false,
  ) =>
    add(
      [
        edge.x + Math.cos(edge.yaw) * x + Math.sin(edge.yaw) * z,
        y,
        edge.z - Math.sin(edge.yaw) * x + Math.cos(edge.yaw) * z,
      ],
      size,
      color,
      glow,
      edge.yaw,
    )
  for (const end of [-1, 1])
    place(
      end * (edge.length / 2 - 0.055),
      (0.8 + (end < 0 ? left : right)) / 2,
      0,
      [0.11, (end < 0 ? left : right) - 0.8, 0.22],
    )
  place(0, 0.82, 0.11, [edge.length - 0.2, 0.025, 0.025], '#e8ad70', true)
}
for (const side of [-1, 1]) {
  add([side * 4.8, 2.05, 2.75], [0.2, 2.5, 4.7], '#242d34')
  for (const z of [1.2, 4.45]) add([side * 4.66, 2.2, z], [0.08, 2.3, 0.1])
  add([side * 4.66, 3.28, 2.65], [0.07, 0.045, 4.1], '#ffd09a', true)
  for (const z of [0.65, 1.7, 2.75, 3.8, 4.85]) {
    add([side * 4.685, 1.94, z], [0.025, 2.06, 0.97], '#303b43')
    add([side * 4.663, 2.86, z], [0.016, 0.018, 0.75], '#111c24')
    add([side * 4.66, 1.02, z], [0.02, 0.018, 0.74], '#111c24')
  }
  for (let i = 0; i < 7; i++)
    add([side * 4.65, 1.25 + i * 0.052, 4.68], [0.025, 0.019, 0.58], '#111c24')
  add([side * 4.652, 2.48, 4.68], [0.025, 0.026, 0.42], '#e8ad70', true)
}
export const SPINE_BACK_PANELS: StaticPanel[] = []
for (const side of [-1, 1]) {
  SPINE_BACK_PANELS.push({
    at: [side * 3.07, 1.65, 2.17],
    size: [2.8, 2.45, 0.025],
    color: '#303b43',
  })
  for (const x of [-1.1, 1.1])
    SPINE_BACK_PANELS.push({
      at: [side * 3.07 + x, 1.65, 2.19],
      size: [0.045, 2.38, 0.035],
      color: '#111c24',
    })
  for (let i = 0; i < 8; i++)
    SPINE_BACK_PANELS.push({
      at: [side * 3.07, 1.02 + i * 0.055, 2.2],
      size: [1.65, 0.021, 0.035],
      color: '#111c24',
    })
  SPINE_BACK_PANELS.push({
    at: [side * 3.07, 2.61, 2.2],
    size: [1.62, 0.025, 0.035],
    color: '#e8ad70',
    glow: true,
  })
  for (let i = 0; i < 4; i++)
    SPINE_BACK_PANELS.push({
      at: [side * 3.07 + 0.7 + i * 0.095, 0.65, 2.2],
      size: [0.045, 0.1, 0.035],
      color: '#b98b49',
    })
}
