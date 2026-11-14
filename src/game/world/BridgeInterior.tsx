import { Bvh, useGLTF } from '@react-three/drei'
import { CuboidCollider } from '@react-three/rapier'
import { TRANSITION_CENTER } from './bridgePlacement'

/** Static Blender architecture. Screen hit targets and physics remain independent. */
export function BridgeInterior() {
  const [interior, amber, furnishings] = useGLTF([
    '/models/cruz-del-sur-bridge-interior.glb',
    '/models/cruz-del-sur-amber-details.glb',
    '/models/cruz-del-sur-furnishings.glb',
  ])
  return (
    <>
      {/* Spatial index accelerates exact triangle hits without changing the mesh. */}
      <Bvh indirect>
        <primitive object={interior.scene} dispose={null} />
        <primitive object={amber.scene} dispose={null} />
        <primitive object={furnishings.scene} dispose={null} />
      </Bvh>
      {/* Opaque exterior backs close the niches when seen from the glass passage. */}
      {[-1, 1].map((side) => (
        <mesh
          key={'niche-back-' + side}
          name="rear-niche-opaque-exterior-back"
          position={[side * 3.07, 1.65, 2.13]}
        >
          <boxGeometry args={[3.46, 3.3, 0.06]} />
          <meshStandardMaterial
            color="#272b2f"
            metalness={0.35}
            roughness={0.65}
          />
        </mesh>
      ))}
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
