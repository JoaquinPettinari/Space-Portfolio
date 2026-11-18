import { useMemo } from 'react'
import { Bvh, useGLTF } from '@react-three/drei'
import { REFINED_DETAILS_ASSET } from './refinedArtAssets'
import { removeLegacyArrival } from './cabinMaster'

/** Bridge details retain their cached materials; the master replaces arrival batches. */
export function RefinedInteriorDetails() {
  const { scene } = useGLTF(REFINED_DETAILS_ASSET)
  const root = useMemo(() => removeLegacyArrival(scene.clone(true)), [scene])
  return (
    <Bvh indirect>
      <primitive object={root} dispose={null} />
    </Bvh>
  )
}
