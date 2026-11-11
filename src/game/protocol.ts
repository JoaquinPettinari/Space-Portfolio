import {
  completeMission,
  missions,
  type MissionId,
  type ObjectiveId,
} from './missions'

/** Legacy key used only to discard progress saved by older versions. */
export const PROTOCOL_STORAGE_KEY = 'cruz-del-sur.protocol'
export interface ProtocolState {
  version: 1
  completed: ObjectiveId[]
  guidance: 'pending' | 'active' | 'skipped'
}
export type ProtocolEvent =
  | { type: 'activity'; id: MissionId }
  | { type: 'continue' }
  | { type: 'skip' }
  | { type: 'replay' }
  | { type: 'transmission'; outcome: 'accepted' | 'skipped' }

export function initialProtocol(): ProtocolState {
  return { version: 1, completed: ['lighting'], guidance: 'pending' }
}
export function protocolReducer(
  state: ProtocolState,
  event: ProtocolEvent,
): ProtocolState {
  switch (event.type) {
    case 'transmission':
      return state.completed.includes('uplink')
        ? state
        : { ...state, completed: [...state.completed, 'uplink'] }
    case 'activity': {
      const completed = completeMission(state.completed, event.id)
      return completed === state.completed ? state : { ...state, completed }
    }
    case 'continue':
      return { ...state, guidance: 'active' }
    case 'skip':
      return { ...state, guidance: 'skipped' }
    case 'replay':
      // Replaying guidance must never plunge an occupied room back into darkness.
      return {
        ...initialProtocol(),
        completed: ['lighting'],
        guidance: 'active',
      }
  }
}
export function getCurrentObjective(state: ProtocolState) {
  if (state.guidance === 'skipped') return null
  return (
    missions.find((mission) => !state.completed.includes(mission.id)) ?? null
  )
}
