import type { StationTarget } from '../interaction/station'
import { PERSONAL_POSITION, ARCADE_POSITION } from '../interaction/station'
import { WallTerminal } from './WallTerminal'

/** Shared perimeter desk and chair physics live in Workstation. */
export function RearWorkstation({ target }: { target: StationTarget }) {
  return (
    <>
      <WallTerminal
        kind="personal"
        position={[...PERSONAL_POSITION]}
        rotation={-Math.PI / 2}
        target={target}
      />
      <WallTerminal
        kind="arcade"
        position={[...ARCADE_POSITION]}
        rotation={Math.PI / 2}
        target={target}
      />
    </>
  )
}
