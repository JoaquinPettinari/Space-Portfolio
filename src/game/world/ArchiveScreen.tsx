import { SCREEN_POSITION } from '../interaction/station'
import { PhysicalScreen } from './PhysicalScreen'
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
  return (
    <PhysicalScreen position={SCREEN_POSITION} distanceFactor={2 / 3}>
      <Computer
        onClose={onClose}
        onMissionComplete={onMissionComplete}
        onAccessiblePortfolio={onAccessiblePortfolio}
      />
    </PhysicalScreen>
  )
}
