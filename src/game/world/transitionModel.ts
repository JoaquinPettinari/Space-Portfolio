import { isWarmPractical, warmPractical } from './warmPracticals'
import {
  FrontSide,
  Mesh,
  MeshStandardMaterial,
  type Material,
  type Object3D,
  type Texture,
} from 'three'

export const TRANSITION_ASSET =
  '/models/cruz-del-sur-transition-galley-ready.glb'

/** Own material instances, but retain the GLTF cache's geometry, images and UVs. */
export function prepareTransitionModel(source: Object3D) {
  const root = source.clone(true)
  const materials = new Map<Material, MeshStandardMaterial>()
  const emission = new Map<MeshStandardMaterial, number>()
  const prepare = (sourceMaterial: Material) => {
    if (!(sourceMaterial instanceof MeshStandardMaterial)) return sourceMaterial
    let material = materials.get(sourceMaterial)
    if (!material) {
      material = new MeshStandardMaterial().copy(sourceMaterial)
      if (isWarmPractical(material)) warmPractical(material)
      if (!material.transparent && material.name.includes('_TRANSITION_'))
        material.side = FrontSide
      material.envMapIntensity = 0.45
      if (material.transparent) material.depthWrite = false
      materials.set(sourceMaterial, material)
      emission.set(material, material.emissiveIntensity)
    }
    return material
  }
  root.traverse((node) => {
    if (node instanceof Mesh) {
      node.material = Array.isArray(node.material)
        ? node.material.map(prepare)
        : prepare(node.material)
    }
  })
  return {
    root,
    setReflection(texture: Texture | null) {
      materials.forEach((material) => {
        material.envMap = texture
        material.needsUpdate = true
      })
    },
    setPower(power: number) {
      emission.forEach((intensity, material) => {
        material.emissiveIntensity = intensity * power
        material.envMapIntensity = 0.45 * power
      })
    },
    dispose() {
      materials.forEach((material) => material.dispose())
    },
  }
}
