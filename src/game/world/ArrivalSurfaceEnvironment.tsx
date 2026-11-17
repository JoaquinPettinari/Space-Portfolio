import { useLayoutEffect, useMemo, type ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import { createArrivalReflection } from './arrivalReflections'
import { createArrivalFloorTextures } from './arrivalFloorTextures'
import {
  ArrivalEnvironmentContext,
  createArrivalEnvironmentChannel,
} from './arrivalEnvironment'

export function ArrivalSurfaceEnvironment({
  emergency,
  children,
}: {
  emergency: boolean
  children: ReactNode
}) {
  const renderer = useThree((state) => state.gl)
  const channel = useMemo(() => createArrivalEnvironmentChannel(), [])
  const value = useMemo(
    () => ({ channel, power: emergency ? 0.12 : 1 }),
    [channel, emergency],
  )
  useLayoutEffect(() => {
    const target = createArrivalReflection(renderer)
    const floor = createArrivalFloorTextures()
    channel.publish({ reflection: target.texture, floor })
    return () => {
      channel.publish(null)
      target.dispose()
      floor.dispose()
    }
  }, [renderer, channel])
  return (
    <ArrivalEnvironmentContext value={value}>
      {children}
    </ArrivalEnvironmentContext>
  )
}
