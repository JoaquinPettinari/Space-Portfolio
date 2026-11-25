import { describe, expect, it } from 'vitest'
import { highlightOpacity, objectiveStation } from './stationHighlight'
import {
  getCurrentObjective,
  initialProtocol,
  protocolReducer,
} from '../protocol'

describe('station guidance', () => {
  it('moves the beacon through mission destinations and clears it when skipped', () => {
    let state = initialProtocol()
    expect(objectiveStation(getCurrentObjective(state)?.id)).toBe('crew')
    state = protocolReducer(state, { type: 'activity', id: 'crew' })
    expect(objectiveStation(getCurrentObjective(state)?.id)).toBe('tactical')
    state = protocolReducer(state, { type: 'activity', id: 'tactical' })
    expect(objectiveStation(getCurrentObjective(state)?.id)).toBe('computer')
    state = protocolReducer(state, { type: 'activity', id: 'archives' })
    expect(objectiveStation(getCurrentObjective(state)?.id)).toBe(
      'communications',
    )
    state = protocolReducer(state, { type: 'transmission', outcome: 'skipped' })
    expect(objectiveStation(getCurrentObjective(state)?.id)).toBe('personal')
    state = protocolReducer(state, { type: 'skip' })
    expect(objectiveStation(getCurrentObjective(state)?.id)).toBeNull()
  })
  it('pulses softly but keeps aiming and reduced-motion feedback steady', () => {
    expect(highlightOpacity(false, false, 0.5)).toBeCloseTo(1)
    expect(highlightOpacity(false, false, 1.5)).toBeCloseTo(0.35)
    for (const time of [0, 0.5, 1.5, 100]) {
      expect(highlightOpacity(true, false, time)).toBe(1)
      expect(highlightOpacity(false, true, time)).toBe(1)
    }
  })
})
