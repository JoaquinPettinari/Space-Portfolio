import { Bvh, useGLTF } from '@react-three/drei'
import { CuboidCollider } from '@react-three/rapier'
import { TRANSITION_CENTER } from './bridgePlacement'
import { useMemo } from 'react'
import { StaticPanels } from './StaticPanels'
import { SPINE_BACK_PANELS } from './bridgeWallPanels'
import { INTERIOR_SHELF_PANELS } from './interiorShelfPanels'
import { trimTransitionBackPanels } from './transitionLayout'

const backPanels = trimTransitionBackPanels([
  ...SPINE_BACK_PANELS,
  ...[-1, 1].map((side) => ({
    at: [side * 3.07, 1.65, 2.13] as const,
    size: [3.46, 3.3, 0.06] as const,
    color: '#272b2f',
    metalness: 0.35,
    roughness: 0.65,
  })),
])

/** Static Blender architecture. Screen hit targets and physics remain independent. */
export function BridgeInterior() {
  const { scene } = useGLTF(
    '/models/cruz-del-sur-clean-bridge-transition-ready.glb',
  )
  const root = useMemo(() => scene.clone(true), [scene])
  return (
    <>
      <StaticPanels panels={backPanels} />
      <StaticPanels panels={INTERIOR_SHELF_PANELS} />
      {/* Spatial index accelerates exact triangle hits without changing the mesh. */}
      <Bvh indirect>
        <primitive object={root} dispose={null} />
      </Bvh>
      {[-1, 1].map((side) => (
        <CuboidCollider
          key={side}
          position={[side * 1.7, 1.65, TRANSITION_CENTER]}
          args={[0.2, 1.65, 1.5]}
        />
      ))}
      {/* The new central pilasters project beyond the recessed shelf collider. */}
      {[-1, 1].map((side) => (
        <CuboidCollider
          key={`pilaster-${side}`}
          position={[side * 1.57, 1.25, TRANSITION_CENTER]}
          args={[0.23, 1.25, 0.125]}
        />
      ))}
      <CuboidCollider
        position={[0, 3.115, TRANSITION_CENTER]}
        args={[1.5, 0.075, 1.5]}
      />
    </>
  )
}
