import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { optimizeZeroContributionLights } from './zeroContributionLights'

/** Mount inside the world's Suspense boundary: all materials exist at this
 * commit, and their final shader hooks are installed before the first frame. */
export function ZeroContributionLights() {
  const scene = useThree((state) => state.scene)
  useLayoutEffect(() => {
    return optimizeZeroContributionLights(scene)
  }, [scene])
  return null
}
