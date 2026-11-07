import type { ReactNode } from 'react'
import { PhysicalScreen } from './PhysicalScreen'
import { TerminalPanel } from '../ui/TerminalPanel'
import { WALL_SCREEN_POSES } from '../interaction/station'

/** Current 1.1 × .8 m wall displays; future console assets can replace the shell. */
export function PhysicalTerminal({
  kind,
  onClose,
  onAccessiblePortfolio,
  children,
}: {
  kind: 'communications' | 'personal' | 'crew'
  onClose: () => void
  onAccessiblePortfolio?: () => void
  children: ReactNode
}) {
  const pose = WALL_SCREEN_POSES[kind]
  return (
    <PhysicalScreen
      position={pose.position}
      rotation={pose.rotation}
      distanceFactor={kind === 'communications' ? 2 / 3 : 4 / 7}
    >
      <div
        className={kind === 'communications' ? 'forward-terminal' : undefined}
      >
        <TerminalPanel
          physical
          title={
            kind === 'communications'
              ? 'Earth Communications'
              : kind === 'personal'
                ? 'Personal Workstation'
                : 'Crew Access'
          }
          onClose={onClose}
          onAccessiblePortfolio={onAccessiblePortfolio}
        >
          {children}
        </TerminalPanel>
      </div>
    </PhysicalScreen>
  )
}
