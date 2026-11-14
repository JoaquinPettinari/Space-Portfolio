import { Mesh, Object3D, Vector3 } from 'three'

export const UNIFIED_ENVELOPE_ASSET =
  '/models/cruz-del-sur-unified-envelope.glb'
export const UNIFIED_ARRIVAL_ASSET = '/models/cruz-del-sur-unified-arrival.glb'
export const UNIFIED_COLLISION_ASSET =
  '/models/cruz-del-sur-unified-collision.glb'

/** Structural-only mesh, baked into world metres once at load time. */
export function readUnifiedCollision(scene: Object3D) {
  let mesh: Mesh | undefined
  scene.updateMatrixWorld(true)
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return
    if (mesh) throw new Error('Unified collision asset must contain one mesh')
    mesh = object
  })
  if (!mesh) throw new Error('Unified collision mesh missing')
  const positions = mesh.geometry.getAttribute('position')
  const index = mesh.geometry.index
  if (!index) throw new Error('Unified collision indices missing')
  const vertices = new Float32Array(positions.count * 3)
  const indices = new Uint32Array(index.count)
  const point = new Vector3()
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld)
    point.toArray(vertices, i * 3)
  }
  for (let i = 0; i < index.count; i++) indices[i] = index.getX(i)
  return { vertices, indices }
}
