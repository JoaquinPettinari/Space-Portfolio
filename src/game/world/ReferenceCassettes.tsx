import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'

/** Approved Blender study, world metres. Visual only; the existing side walls
 * own collision. The centre opening remains clear in the source geometry. */
export function ReferenceCassettes() {
  const { scene } = useGLTF('/models/cruz-del-sur-reference-cassettes.glb')
  const root = useMemo(() => scene.clone(true), [scene])
  return (
    <group name="reference-side-cassettes" raycast={() => false}>
      <primitive object={root} dispose={null} />
    </group>
  )
}
