import { Material, Mesh, type Object3D } from 'three'

/** Clone only transparent materials that need local render flags. Geometry,
 * opaque materials and textures remain owned by the GLTF cache. */
export function prepareShipModel(scene: Object3D, singlePassGlass = false) {
  const root = scene.clone(true)
  const materials = new Map<Material, Material>()
  const prepare = (material: Material) => {
    if (!material.transparent) return material
    let local = materials.get(material)
    if (!local) {
      local = material.clone()
      local.depthWrite = false
      if (singlePassGlass && /glass|glazing/i.test(local.name))
        local.forceSinglePass = true
      materials.set(material, local)
    }
    return local
  }
  root.traverse((object) => {
    if (object instanceof Mesh)
      object.material = Array.isArray(object.material)
        ? object.material.map(prepare)
        : prepare(object.material)
  })
  return {
    root,
    dispose: () => materials.forEach((material) => material.dispose()),
  }
}
