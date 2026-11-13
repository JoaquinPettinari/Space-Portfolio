import { useGLTF } from '@react-three/drei'
import { CuboidCollider } from '@react-three/rapier'
import { TRANSITION_CENTER } from './bridgePlacement'

/** Static Blender architecture. Screen hit targets and physics remain independent. */
export function BridgeInterior() {
  const { scene } = useGLTF('/models/cruz-del-sur-bridge-interior.glb')
  return (
    <>
      <primitive object={scene} dispose={null} />
      {[-1, 1].map((side) => (
        <CuboidCollider
          key={side}
          position={[side * 1.7, 1.65, TRANSITION_CENTER]}
          args={[0.2, 1.65, 1.5]}
        />
      ))}
      <CuboidCollider
        position={[0, 3.115, TRANSITION_CENTER]}
        args={[1.5, 0.075, 1.5]}
      />
    </>
  )
}
