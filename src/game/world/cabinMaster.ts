import {
  Group,
  FrontSide,
  Mesh,
  MeshStandardMaterial,
  type Material,
  type Object3D,
  type Texture,
} from 'three'
import { BULKHEAD_DEPTH, type BulkheadPhase } from './bulkhead'
import { installOpaqueDepthProxy } from '../rendering/opaqueDepthProxy'

export const CABIN_MASTER_ASSET = '/models/cabin-master-static.glb'
export const CABIN_MASTER_LEAVES_ASSET =
  '/models/cabin-master-sliding-leaves.glb'

/** Remove superseded arrival batches only from an owned hierarchy. */
export function removeLegacyArrival(root: Object3D) {
  const removed: Object3D[] = []
  root.traverse((node) => {
    if (
      node.name.startsWith('UNIFIED_RUNTIME_arrival_') ||
      node.name.startsWith('REFINED_arrival_')
    )
      removed.push(node)
  })
  removed.forEach((node) => node.removeFromParent())
  return root
}

/** Keep exported PBR maps; only reflections and power belong to the renderer. */
export function prepareCabinMaster(source: Object3D) {
  const root = source.clone(true)
  const materials = new Map<Material, MeshStandardMaterial>()
  const indicators = new Map<Material, MeshStandardMaterial>()
  const emission = new Map<MeshStandardMaterial, number>()
  const depthBatches: Mesh[] = []
  const prepare = (sourceMaterial: Material, indicator = false) => {
    if (!(sourceMaterial instanceof MeshStandardMaterial)) return sourceMaterial
    const pool = indicator ? indicators : materials
    let material = pool.get(sourceMaterial)
    if (!material) {
      // Retain baked colour/normal/roughness/metalness; the realtime cabin
      // uses one PBR layer rather than Blender's extra clearcoat lobe.
      material = new MeshStandardMaterial().copy(sourceMaterial)
      if (
        !material.transparent &&
        !/Living_(foliage|vine)|Leaf_veins/.test(material.name)
      )
        material.side = FrontSide
      if (material.transparent) {
        material.depthWrite = false
        material.forceSinglePass = true
      }
      material.envMapIntensity = 0.65
      pool.set(sourceMaterial, material)
      emission.set(material, material.emissiveIntensity)
    }
    return material
  }
  root.traverse((node) => {
    if (node instanceof Mesh) {
      const indicator = node.name.startsWith('CABIN_MASTER_access_status_')
      node.material = Array.isArray(node.material)
        ? node.material.map((material) => prepare(material, indicator))
        : prepare(node.material, indicator)
      if (
        !Array.isArray(node.material) &&
        node.material.name === 'CABIN_PBR_STUDIO_Powder_coated_structural_rails'
      )
        depthBatches.push(node)
    }
  })
  return {
    root,
    attachDepth() {
      const disposers = depthBatches.map(installOpaqueDepthProxy)
      return () => disposers.forEach((dispose) => dispose())
    },
    setReflection(texture: Texture | null) {
      emission.forEach((_, material) => {
        material.envMap = texture
        material.needsUpdate = true
      })
    },
    setPower(power: number) {
      emission.forEach((intensity, material) => {
        material.emissiveIntensity = intensity * power
        material.envMapIntensity = 0.65 * power
      })
    },
    setAccess(powered: boolean, phase: BulkheadPhase) {
      indicators.forEach((material) => {
        material.color.set(
          !powered ? '#d53c32' : phase === 'closed' ? '#e8ad70' : '#32e68b',
        )
        material.emissive.copy(material.color)
      })
    },
    dispose() {
      emission.forEach((_, material) => material.dispose())
    },
  }
}

/** Both inspection displays use the same replacement as the walkable cabin. */
export function assembleCurrentShip(
  envelope: Object3D,
  cabin: Object3D,
  leaves: Object3D,
) {
  const root = new Group()
  root.add(removeLegacyArrival(envelope.clone(true)), cabin.clone(true))
  const doors = leaves.clone(true)
  doors.position.set(0, -0.18, BULKHEAD_DEPTH)
  root.add(doors)
  return root
}
