import { useMemo } from 'react'
import { Bvh, useGLTF } from '@react-three/drei'
import { REFINED_DETAILS_ASSET } from './refinedArtAssets'

/** Material/room batches in world metres; visual detail never becomes physics. */
export function RefinedInteriorDetails() {
  const { scene } = useGLTF(REFINED_DETAILS_ASSET)
  const root = useMemo(() => scene.clone(true), [scene])
  return (
    <Bvh indirect>
      <primitive object={root} dispose={null} />
    </Bvh>
  )
}
