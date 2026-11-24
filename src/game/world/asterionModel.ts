import { Mesh, type Material, type Object3D } from 'three'
import manifest from './asterionManifest.json'

// GzipGLTFLoader appends .gz itself and retains the plain GLB fallback.
export const ASTERION_MODEL = manifest.model.replace(/\.gz$/, '')
export const ASTERION_SKY = manifest.sky
export const EXTERIOR_CAMERA_FAR = 320
export const ASTERION_SKY_RADIUS = 240

/** Runtime art direction also applies to the atmospheric shells. */
export function isVisibleAsterionBody(name: string) {
  return !manifest.hiddenBodies.some((body) => name.includes(body))
}

/** Baked Blender lighting is already display-referred. Own only material
 * instances; geometry and embedded images remain owned by the loader cache. */
export function prepareAsterionModel(source: Object3D) {
  const root = source.clone(true)
  root.name = 'asterion-worlds'
  const removed: Object3D[] = []
  root.traverse((node) => {
    if (!isVisibleAsterionBody(node.name)) removed.push(node)
  })
  removed.forEach((node) => node.removeFromParent())
  let debris: Mesh | null = null
  const materials = new Map<Material, Material>()
  const prepare = (original: Material) => {
    let material = materials.get(original)
    if (!material) {
      material = original.clone()
      material.toneMapped = false
      if (material.transparent) {
        material.depthWrite = false
        material.forceSinglePass = true
      }
      materials.set(original, material)
    }
    return material
  }
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    node.castShadow = false
    node.receiveShadow = false
    node.material = Array.isArray(node.material)
      ? node.material.map(prepare)
      : prepare(node.material)
    const assigned = Array.isArray(node.material)
      ? node.material
      : [node.material]
    if (
      assigned.some((material) => material.name === 'ASTERION / prelit debris')
    ) {
      debris = node
      node.name = 'asterion-debris'
    }
  })
  // Traversal assigns this synchronously; keep its authored origin for additive drift.
  const debrisNode = debris as Mesh | null
  return {
    root,
    debris: debrisNode,
    debrisOrigin: debrisNode?.position.clone() ?? null,
    dispose() {
      materials.forEach((material) => material.dispose())
    },
  }
}
