/** Blender's world-space export: X, Z, -Y. Do not add BRIDGE_OFFSET_Z. */
export const GALLEY_ASSET = '/models/cruz-del-sur-galley.glb'
export const GALLEY_RADIO = {
  position: [3.45, 1.24, 1.28] as const,
  rotation: Math.PI,
  scale: 0.7,
}
export function radioButtonWorldPosition(
  local: readonly [number, number, number],
): [number, number, number] {
  const { position, rotation, scale } = GALLEY_RADIO
  const cos = Math.cos(rotation),
    sin = Math.sin(rotation)
  return [
    position[0] + scale * (local[0] * cos + local[2] * sin),
    position[1] + scale * local[1],
    position[2] + scale * (-local[0] * sin + local[2] * cos),
  ]
}
export const GALLEY_COLLIDERS = [
  { position: [3.4, 0.55, 1.49], half: [1.38, 0.53, 0.35] },
  { position: [4.43, 0.55, 0.78], half: [0.31, 0.53, 0.35] },
] as const
