/** Bridge-local geometry is retained; world anchors share this translation. */
export const BRIDGE_OFFSET_Z = -3.15
export const TRANSITION_START = 2.1
export const TRANSITION_END = 5.1
export const TRANSITION_CENTER = (TRANSITION_START + TRANSITION_END) / 2
export function bridgePoint(
  point: readonly [number, number, number],
): [number, number, number] {
  return [point[0], point[1], point[2] + BRIDGE_OFFSET_Z]
}
