import { LineSegments, Mesh, Vector3, type Object3D } from 'three'

export const TACTICAL_DISPLAY_ASSET = '/models/tactical-ship-display.glb'

/** Read cached geometry; the GLTF cache owns its lifetime, not this display. */
export function readTacticalShipModel(scene: Object3D) {
  const surface = scene.getObjectByName('tactical_surface')
  const edges = scene.getObjectByName('tactical_edges')
  if (!(surface instanceof Mesh) || !(edges instanceof LineSegments))
    throw new Error('Invalid tactical display asset')
  const bounds = surface.geometry.boundingBox
  if (!bounds) throw new Error('Missing tactical display bounds')
  return {
    surface: surface.geometry,
    edges: edges.geometry,
    size: bounds.getSize(new Vector3()),
  }
}

/** Three r186 stops recursive picking when a group raycast returns false.
 * The separate twelve-triangle proxy remains the tactical interaction target. */
export function skipTacticalVisualRaycast() {
  return false
}
