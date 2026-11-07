import { useEffect, useRef, type ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { scrollPhysicalScreen } from './physicalScroll'

function DisplayReady({
  children,
  invalidate,
}: {
  children: ReactNode
  invalidate: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  // Html owns a separate React DOM root. Its commit must request a frame after
  // the focus transition switches the scene to demand rendering.
  useEffect(() => invalidate(), [invalidate])
  useEffect(() => {
    const element = root.current
    if (!element) return
    const wheel = (event: WheelEvent) => scrollPhysicalScreen(event, element)
    // Chromium can omit transformed planes from its blocking-wheel region.
    // Register at document level so wheel is cancelable, but the adapter only
    // handles descendants of this physical screen. Other HTML stays native.
    document.addEventListener('wheel', wheel, { passive: false, capture: true })
    return () => document.removeEventListener('wheel', wheel, true)
  }, [])
  return <div ref={root}>{children}</div>
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
