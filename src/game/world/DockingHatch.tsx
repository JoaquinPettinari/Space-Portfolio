import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Mesh, type Material } from 'three'
import { ENTRY_DOCKING_DEPTH } from './entryLayout'

export const DOCKING_HATCH_Z = ENTRY_DOCKING_DEPTH

/** Closed arrival hatch. Bridge access continues to use the separate sliding door. */
export function DockingHatch() {
  const { scene } = useGLTF('/models/cruz-del-sur-docking-door.glb')
  const model = useMemo(() => {
    const root = scene.clone(true)
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
  }, [scene])
  useEffect(() => () => model.materials.forEach((m) => m.dispose()), [model])
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[0, 0, DOCKING_HATCH_Z]}
    >
      <CuboidCollider args={[1.425, 1.4, 0.17]} position={[0, 1.4, 0]} />
      <group name="docking-hatch" rotation={[0, Math.PI, 0]}>
        <primitive object={model.root} dispose={null} />
      </group>
    </RigidBody>
  )
}
