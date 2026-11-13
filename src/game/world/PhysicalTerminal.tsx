import type { ReactNode } from 'react'
import { PhysicalScreen } from './PhysicalScreen'
import { TerminalPanel } from '../ui/TerminalPanel'
import { TERMINAL_SCREENS, terminalHtmlScale } from '../interaction/station'

/** Current 1.1 × .8 m wall displays; future console assets can replace the shell. */
export function PhysicalTerminal({
  kind,
  onClose,
  children,
  subtitle,
}: {
  kind: 'communications' | 'personal' | 'arcade' | 'crew'
  onClose: () => void
  children: ReactNode
  subtitle?: ReactNode
}) {
  const pose = TERMINAL_SCREENS[kind]
  return (
    <PhysicalScreen
      position={pose.position}
      rotation={pose.rotation}
      distanceFactor={terminalHtmlScale(kind)}
    >
      <div
        className={
          kind === 'communications'
            ? 'forward-terminal'
            : kind === 'personal' || kind === 'arcade'
              ? 'personal-terminal'
              : 'crew-terminal'
        }
      >
        <TerminalPanel
          physical
          communications={kind === 'communications'}
          title={
            kind === 'communications'
              ? 'Earth Communications'
              : kind === 'personal'
                ? 'Personal Workstation'
                : kind === 'arcade'
                  ? 'Recreation Terminal'
                  : 'Crew Access'
          }
          onClose={onClose}
          subtitle={subtitle}
        >
          {children}
        </TerminalPanel>
      </div>
    </PhysicalScreen>
  )
}
