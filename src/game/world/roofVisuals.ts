import { BufferAttribute, BufferGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ROOF_PANELS, ROOF_COLLIDER_MARGIN } from './bridgeLayout'

/** Keep panel normals and exact collision vertices; merge only static rendering. */
export function createRoofVisuals() {
  const opaque: BufferGeometry[] = [],
    glass: BufferGeometry[] = []
  const colliders = ROOF_PANELS.map((panel) => {
    const geometry = new BufferGeometry()
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(panel.points.flat()), 3),
    )
    geometry.setIndex(
      Array.from({ length: panel.points.length - 2 }, (_, i) => [
        0,
        i + 1,
        i + 2,
      ]).flat(),
    )
    geometry.computeVertexNormals()
    ;(panel.glass ? glass : opaque).push(geometry)
    return new Float32Array(
      [-ROOF_COLLIDER_MARGIN, 0.1].flatMap((dy) =>
        panel.points.flatMap(([x, y, z]) => [x, y + dy, z]),
      ),
    )
  })
  const merge = (parts: BufferGeometry[]) => {
    const geometry = mergeGeometries(parts)
    parts.forEach((g) => g.dispose())
    if (!geometry) throw new Error('Incompatible roof panel geometry')
    geometry.computeBoundingSphere()
    geometry.computeBoundingBox()
    return geometry
  }
  const opaqueGeometry = merge(opaque),
    glassGeometry = merge(glass)
  return {
    opaque: opaqueGeometry,
    glass: glassGeometry,
    colliders,
    dispose: () => {
      opaqueGeometry.dispose()
      glassGeometry.dispose()
    },
  }
}
