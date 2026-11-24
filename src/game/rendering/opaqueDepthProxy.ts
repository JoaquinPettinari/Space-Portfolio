import {
  InstancedBufferGeometry,
  InstancedMesh,
  LessEqualDepth,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoBlending,
  Object3D,
  SkinnedMesh,
} from 'three'

/** Install before shader hooks, only on a fixed opaque batch. The caller must
 * retain its geometry/material draw semantics until cleanup. This adds one draw
 * of the same vertices to reject hidden PBR fragments, not a simplified occluder.
 */
export function installOpaqueDepthProxy(mesh: Mesh): () => void {
  const material = mesh.material
  if (
    Array.isArray(material) ||
    !(material instanceof MeshStandardMaterial) ||
    mesh instanceof SkinnedMesh ||
    mesh instanceof InstancedMesh ||
    mesh.geometry instanceof InstancedBufferGeometry ||
    Object.keys(mesh.geometry.morphAttributes).length > 0 ||
    mesh.morphTargetInfluences !== undefined ||
    mesh.onBeforeRender !== Object3D.prototype.onBeforeRender ||
    material.onBeforeCompile !== Material.prototype.onBeforeCompile ||
    material.onBeforeRender !== Material.prototype.onBeforeRender ||
    material.transparent ||
    material.opacity !== 1 ||
    material.alphaTest !== 0 ||
    material.alphaHash ||
    material.alphaToCoverage ||
    material.alphaMap !== null ||
    material.displacementMap !== null ||
    material.wireframe ||
    material.polygonOffset ||
    material.stencilWrite ||
    material.clippingPlanes?.length ||
    !material.visible ||
    !material.colorWrite ||
    !material.depthWrite ||
    !material.depthTest ||
    material.depthFunc !== LessEqualDepth ||
    (material instanceof MeshPhysicalMaterial && material.transmission > 0) ||
    mesh.renderOrder <= -10
  )
    return () => {}

  const depthMaterial = new MeshBasicMaterial({
    side: material.side,
    colorWrite: false,
    depthWrite: true,
    depthTest: true,
    depthFunc: material.depthFunc,
    blending: NoBlending,
    fog: false,
    toneMapped: false,
  })
  const proxy = new Mesh(mesh.geometry, depthMaterial)
  proxy.name = `${mesh.name || 'mesh'}:opaque-depth-proxy`
  proxy.renderOrder = -10
  proxy.layers.mask = mesh.layers.mask
  proxy.frustumCulled = mesh.frustumCulled
  proxy.raycast = () => {}
  // Identity child follows the exact source world transform and visibility.
  mesh.add(proxy)
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    proxy.removeFromParent()
    depthMaterial.dispose()
  }
}
