import { PlaneGeometry } from 'three'

export const REFINED_BRIDGE_ASSET = '/models/cruz-del-sur-clean-bridge.glb'
export const REFINED_ARRIVAL_ASSET =
  '/models/cruz-del-sur-reference-arrival.glb'
export const REFINED_DETAILS_ASSET =
  '/models/cruz-del-sur-reference-details.glb'
export const CONSOLE_ATLAS = '/textures/cruz-del-sur/console-display-atlas.png'
export const TACTICAL_SURFACE = '/textures/cruz-del-sur/tactical-surface.webp'

export type ConsoleKind = 'personal' | 'arcade' | 'computer' | 'communications'
const displayTiles: Record<ConsoleKind, readonly [number, number]> = {
  personal: [0, 0],
  arcade: [1, 0],
  computer: [0, 1],
  communications: [1, 1],
}

/** UVs select one panel while all terminals share a single GPU texture. */
export function createConsoleScreenGeometry(
  kind: ConsoleKind,
  width: number,
  height: number,
) {
  const geometry = new PlaneGeometry(width, height)
  const uv = geometry.attributes.uv
  const [x, y] = displayTiles[kind]
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, (uv.getX(i) + x) / 2, (uv.getY(i) + y) / 2)
  return geometry
}
