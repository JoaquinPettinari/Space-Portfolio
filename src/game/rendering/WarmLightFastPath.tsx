import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { optimizeZeroContributionLights } from './zeroContributionLights'

export function ZeroContributionLights({ ready }: { ready: boolean }) {
  const scene = useThree((state) => state.scene)
  useLayoutEffect(() => {
    if (!ready) return
    return optimizeZeroContributionLights(scene)
  }, [scene, ready])
  return null
}
