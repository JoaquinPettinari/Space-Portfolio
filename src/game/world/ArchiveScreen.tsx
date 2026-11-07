import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Computer } from '../ui/Computer'
import type { MissionId } from '../missions'

/** Only mounted at the settled monitor pose: no HTML floating through furniture
 * while walking or transitioning. Html uses CSS transforms, not a texture. */
export function ArchiveScreen({
  onClose,
  onMissionComplete,
  onAccessiblePortfolio,
}: {
  onClose: () => void
  onMissionComplete: (id: MissionId) => void
  onAccessiblePortfolio?: () => void
}) {
  const invalidate = useThree((state) => state.invalidate)
  return (
    <Html
      transform
      position={[0, 1.55, -3.535]}
      distanceFactor={2 / 3}
      zIndexRange={[4, 3]}
    >
      <Computer
        onClose={onClose}
        onMissionComplete={onMissionComplete}
        onAccessiblePortfolio={onAccessiblePortfolio}
        onDisplayReady={invalidate}
      />
    </Html>
  )
}
