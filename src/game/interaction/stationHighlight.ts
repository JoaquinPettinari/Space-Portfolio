import type { ObjectiveId } from '../missions'
import type { TerminalKind } from './station'

const destinations: Record<ObjectiveId, TerminalKind | null> = {
  lighting: null,
  tablet: null,
  crew: 'crew',
  archives: 'computer',
  uplink: 'communications',
  dossier: 'personal',
}

export function objectiveStation(objective: ObjectiveId | undefined) {
  return objective ? destinations[objective] : null
}

export function highlightOpacity(
  hovered: boolean,
  reduced: boolean,
  seconds: number,
) {
  return hovered || reduced
    ? 1
    : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(seconds * Math.PI))
}
