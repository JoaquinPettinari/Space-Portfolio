import { useEffect, type ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'

function DisplayReady({
  children,
  invalidate,
}: {
  children: ReactNode
  invalidate: () => void
}) {
  // Html owns a separate React DOM root. Its commit must request a frame after
  // the focus transition switches the scene to demand rendering.
  useEffect(() => invalidate(), [invalidate])
  return children
}

/** Native HTML aligned with a physical display; only mount at its settled pose. */
export function PhysicalScreen({
  position,
  rotation = 0,
  distanceFactor,
  children,
}: {
  position: readonly [number, number, number]
  rotation?: number
  distanceFactor: number
  children: ReactNode
}) {
  const invalidate = useThree((state) => state.invalidate)
  return (
    <Html
      transform
      position={[...position]}
      rotation={[0, rotation, 0]}
      distanceFactor={distanceFactor}
      zIndexRange={[4, 3]}
    >
      <DisplayReady invalidate={invalidate}>{children}</DisplayReady>
    </Html>
  )
}
