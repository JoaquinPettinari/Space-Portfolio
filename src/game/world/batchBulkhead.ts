import {
  BufferGeometry,
  Matrix4,
  Mesh,
  type Material,
  type Object3D,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

type Batch = {
  material: Material
  meshes: Mesh[]
  geometries: BufferGeometry[]
}

/** Batch only one rigid assembly at a time; never join the two sliding leaves.
 * Jambs and header stay separate so their bounds do not span the doorway.
 * Materials (including live status indicators) and all triangles are retained.
 */
export function batchBulkhead(root: Object3D) {
  root.updateMatrixWorld(true)
  const inverse = root.matrixWorld.clone().invert()
  const matrix = new Matrix4()
  const groups = new Map<string, Batch>()
  root.traverse((object) => {
    if (
      !(object instanceof Mesh) ||
      Array.isArray(object.material) ||
      object.material.transparent
    )
      return
    const geometry = object.geometry
      .clone()
      .applyMatrix4(matrix.multiplyMatrices(inverse, object.matrixWorld))
    geometry.computeBoundingBox()
    const bounds = geometry.boundingBox!
    const zone =
      bounds.min.y >= 2.68
        ? 'header'
        : bounds.max.x < 0
          ? 'left'
          : bounds.min.x > 0
            ? 'right'
            : 'center'
    const attributes = Object.keys(geometry.attributes).sort().join(',')
    const key = `${zone}:${object.material.uuid}:${attributes}:${!!geometry.index}`
    const group: Batch = groups.get(key) ?? {
      material: object.material,
      meshes: [],
      geometries: [],
    }
    group.meshes.push(object)
    group.geometries.push(geometry)
    groups.set(key, group)
  })
  const owned: BufferGeometry[] = []
  for (const { material, meshes, geometries } of groups.values()) {
    if (meshes.length > 1) {
      const geometry = mergeGeometries(geometries)
      if (geometry) {
        geometry.computeBoundingSphere()
        const batch = new Mesh(geometry, material)
        batch.name = 'bulkhead-material-batch'
        root.add(batch)
        meshes.forEach((mesh) => mesh.removeFromParent())
        owned.push(geometry)
      }
    }
    geometries.forEach((geometry) => geometry.dispose())
  }
  return owned
}
