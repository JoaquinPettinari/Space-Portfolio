import type { CoffeeState } from '../coffee'
import type { StationTarget } from './station'
import type { BulkheadPhase } from '../world/bulkhead'

export function interactionHint(
  target: StationTarget,
  lightsOn: boolean,
  coffee: CoffeeState['phase'],
  bulkhead: BulkheadPhase = 'closed',
) {
  switch (target) {
    case 'tactical':
      return 'E Tactical Table'
    case 'crew':
      return 'E Crew Access'
    case 'bulkhead':
      if (!lightsOn) return 'Restore auxiliary power first'
      if (bulkhead === 'unlocking') return 'Bulkhead unlocking…'
      if (bulkhead === 'opening') return 'Bulkhead opening…'
      if (bulkhead === 'open') return 'Bulkhead open'
      return 'E Open bulkhead'
    case 'coffee':
      if (coffee === 'brewing') return 'Coffee brewing…'
      return coffee === 'ready' ? 'E Drink coffee' : 'E Brew coffee'
    case 'photo':
      return 'E Inspect project photo'
    case 'lighting':
      return lightsOn ? 'Auxiliary power online' : 'E Restore lighting'
    case 'personal':
      return 'E Personal Workstation'
    case 'communications':
      return 'E Earth Communications'
    case 'computer':
      return 'E Use computer'
    case 'dossier':
      return 'E Download crew dossier (CV / PDF)'
    case null:
      return ''
  }
}
