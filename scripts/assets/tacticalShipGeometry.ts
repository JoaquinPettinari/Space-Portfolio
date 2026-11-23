import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  EdgesGeometry,
  Mesh,
  Vector3,
  type Object3D,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const TACTICAL_SHIP_LENGTH = 1.6

/** Static display copy: merge positions only, sharing no mutable GPU resources
 * with the cached full-size ship. Rendered in two passes (body and hard edges). */
export function createTacticalShipModel(source: Object3D) {
  const root = source.clone(true)
  root.updateMatrixWorld(true)
  const parts: BufferGeometry[] = []
  root.traverseVisible((object) => {
    if (!(object instanceof Mesh)) return
    const part = object.geometry.clone()
    for (const key of Object.keys(part.attributes))
      if (key !== 'position') part.deleteAttribute(key)
    if (!part.index)
      part.setIndex(
        Array.from(
          { length: part.getAttribute('position').count },
          (_, i) => i,
        ),
      )
    part.applyMatrix4(object.matrixWorld)
    parts.push(part)
  })
  if (!parts.length)
    throw new Error('Tactical ship requires visible mesh geometry')
  let surface: BufferGeometry | null
  try {
    surface = mergeGeometries(parts)
  } finally {
    parts.forEach((geometry) => geometry.dispose())
  }
  if (!surface) throw new Error('Incompatible tactical ship geometry')
  surface.computeBoundingBox()
  const bounds = surface.boundingBox!
  const size = bounds.getSize(new Vector3())
  const extent = Math.max(size.x, size.y, size.z)
  if (!Number.isFinite(extent) || extent <= 0) {
    surface.dispose()
    throw new Error('Tactical ship has invalid bounds')
  }
  const center = bounds.getCenter(new Vector3())
  const scale = TACTICAL_SHIP_LENGTH / extent
  surface.translate(-center.x, -bounds.min.y, -center.z)
  surface.scale(scale, scale, scale)
  surface.computeBoundingBox()
  surface.computeBoundingSphere()
  // Sub-pixel bevel edges add noise at this display scale. Keep the hull surface
  // intact and omit only line segments shorter than 0.4% of the miniature.
  const detailedEdges = new EdgesGeometry(surface, 35)
  const positions = detailedEdges.getAttribute('position')
  const kept: number[] = []
  const a = new Vector3(),
    b = new Vector3()
  for (let i = 0; i < positions.count; i += 2) {
    a.fromBufferAttribute(positions, i)
    b.fromBufferAttribute(positions, i + 1)
    if (a.distanceToSquared(b) < 0.006 ** 2) continue
    kept.push(a.x, a.y, a.z, b.x, b.y, b.z)
  }
  detailedEdges.dispose()
  const edges = new BufferGeometry()
  edges.setAttribute('position', new BufferAttribute(new Float32Array(kept), 3))
  edges.computeBoundingSphere()
  return {
    surface,
    edges,
    size: new Box3().copy(surface.boundingBox!).getSize(new Vector3()),
    sourceMeshCount: parts.length,
    triangleCount: surface.index!.count / 3,
    edgeSegments: edges.getAttribute('position').count / 2,
    dispose() {
      surface.dispose()
      edges.dispose()
    },
  }
}
