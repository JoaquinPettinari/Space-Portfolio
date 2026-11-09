import { TERMINAL_SCREENS, terminalHtmlScale } from '../interaction/station'
import { PhysicalScreen } from './PhysicalScreen'
import { Computer } from '../ui/Computer'
import type { MissionId } from '../missions'
import type { ReactNode } from 'react'

/** Only mounted at the settled monitor pose: no HTML floating through furniture
 * while walking or transitioning. Html uses CSS transforms, not a texture. */
export function ArchiveScreen({
  onClose,
  onMissionComplete,
  subtitle,
}: {
  onClose: () => void
  onMissionComplete: (id: MissionId) => void
  subtitle?: ReactNode
}) {
  return (
    <PhysicalScreen
      position={TERMINAL_SCREENS.computer.position}
      rotation={TERMINAL_SCREENS.computer.rotation}
      distanceFactor={terminalHtmlScale('computer')}
    >
      <Computer
        onClose={onClose}
        onMissionComplete={onMissionComplete}
        subtitle={subtitle}
      />
    </PhysicalScreen>
  )
}
