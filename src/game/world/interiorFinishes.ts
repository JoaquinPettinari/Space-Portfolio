import {
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type BufferGeometry,
  type Material,
  type Object3D,
  type Texture,
} from 'three'
import { prepareLeafSurface } from './leafSurface'

/** Own only changed materials/leaf UV copies; keep GLTF cache and collisions intact. */
export function prepareInteriorFinishes(
  scenes: Object3D[],
  textures: { leather: Texture; leaf: Texture },
) {
  const materials = new Map<Material, Material>(),
    geometries: BufferGeometry[] = []
  const roots = scenes.map((scene) => scene.clone(true))
  for (const root of roots)
    root.traverse((object) => {
      if (
        !(object instanceof Mesh) ||
        Array.isArray(object.material) ||
        !(object.material instanceof MeshStandardMaterial)
      )
        return
      const source = object.material,
        name = source.name
      const leaf = name.startsWith('FURNISH / Leaf')
      if (
        !leaf &&
        !/BRIDGE Upholstery|BRIDGE V15 (Metal|Graphite)|FURNISH \/ (Metal|Ivory)/.test(
          name,
        )
      )
        return
      let material = materials.get(source)
      if (!material) {
        const local = source.clone()
        if (name === 'BRIDGE Upholstery') {
          local.color.setRGB(0.038, 0.063, 0.082)
          local.map = textures.leather
          local.roughness = 0.54
          local.metalness = 0
          if (local instanceof MeshPhysicalMaterial) {
            local.sheen = 0.18
            local.sheenColor.setRGB(0.16, 0.2, 0.23)
            local.sheenRoughness = 0.7
          }
        } else if (leaf) {
          local.map = textures.leaf
          local.roughness = 0.64
          local.metalness = 0
          if (name.includes('light')) local.color.setRGB(0.12, 0.3, 0.045)
          else local.color.setRGB(0.065, 0.22, 0.03)
        } else if (name.startsWith('FURNISH / Metal')) {
          local.color.setRGB(0.24, 0.27, 0.29)
          local.roughness = 0.43
          local.metalness = 0.72
        } else if (name.startsWith('FURNISH / Ivory')) {
          local.color.setRGB(0.31, 0.32, 0.29)
          local.roughness = 0.63
          local.metalness = 0.08
        } else {
          // Existing baked scuffs and normal maps remain; slightly dull the finish.
          local.roughness = Math.min(0.85, source.roughness + 0.035)
          if (local.normalMap) local.normalScale.multiplyScalar(1.12)
        }
        material = local
        materials.set(source, local)
      }
      object.material = material
      if (leaf) {
        const geometry = object.geometry.clone()
        prepareLeafSurface(geometry)
        object.geometry = geometry
        geometries.push(geometry)
      }
    })
  return {
    roots,
    dispose: () => {
      materials.forEach((material) => material.dispose())
      geometries.forEach((geometry) => geometry.dispose())
    },
  }
}
