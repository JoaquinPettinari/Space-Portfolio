import { useEffect, useMemo } from 'react'
import { Bvh, useGLTF } from '@react-three/drei'
import { RigidBody, TrimeshCollider } from '@react-three/rapier'
import { Mesh, type Material } from 'three'
import {
  UNIFIED_ENVELOPE_ASSET,
  UNIFIED_COLLISION_ASSET,
  readUnifiedCollision,
} from './unifiedShipAssets'

/** Unified exterior/interior skin; only structural geometry participates in physics. */
export function PlayerShipHull() {
  const [envelope, collision] = useGLTF([
    UNIFIED_ENVELOPE_ASSET,
    UNIFIED_COLLISION_ASSET,
  ])
  const shape = useMemo(
    () => readUnifiedCollision(collision.scene),
    [collision.scene],
  )
  const model = useMemo(() => {
    const root = envelope.scene.clone(true)
    const materials = new Map<Material, Material>()
    const prepare = (material: Material) => {
      if (!material.transparent) return material
      let local = materials.get(material)
      if (!local) {
        local = material.clone()
        local.depthWrite = false
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
    return { root, materials }
  }, [envelope.scene])
  useEffect(
    () => () => model.materials.forEach((material) => material.dispose()),
    [model],
  )
  return (
    <group name="cruz-del-sur-player-hull">
      <Bvh indirect>
        <primitive object={model.root} dispose={null} />
      </Bvh>
      <RigidBody type="fixed" colliders={false} friction={0}>
        <TrimeshCollider args={[shape.vertices, shape.indices]} />
      </RigidBody>
    </group>
  )
}
