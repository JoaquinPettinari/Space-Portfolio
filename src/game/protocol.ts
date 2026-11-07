import {
  completeMission,
  missions,
  type MissionId,
  type ObjectiveId,
} from './missions'

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
  return { version: 1, completed: [], guidance: 'pending' }
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
        completed: state.completed.includes('lighting') ? ['lighting'] : [],
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
function isObjective(value: unknown): value is ObjectiveId {
  return missions.some((mission) => mission.id === value)
}
export function parseProtocol(raw: string | null): ProtocolState {
  if (!raw) return initialProtocol()
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return initialProtocol()
    if (
      !('version' in value) ||
      value.version !== 1 ||
      !('completed' in value) ||
      !Array.isArray(value.completed) ||
      !value.completed.every(isObjective) ||
      !('guidance' in value) ||
      (value.guidance !== 'pending' &&
        value.guidance !== 'active' &&
        value.guidance !== 'skipped')
    )
      return initialProtocol()
    // Version 1 is the first persisted schema. Unknown versions reset safely;
    // add explicit migrations only when a previous schema actually exists.
    return {
      version: 1,
      completed: [...new Set(value.completed)],
      guidance: value.guidance,
    }
  } catch {
    return initialProtocol()
  }
}
type ProtocolStorage = Pick<Storage, 'getItem' | 'setItem'>
export function loadProtocol(storage?: ProtocolStorage): ProtocolState {
  try {
    return parseProtocol(
      (storage ?? window.localStorage).getItem(PROTOCOL_STORAGE_KEY),
    )
  } catch {
    return initialProtocol()
  }
}
export function saveProtocol(
  state: ProtocolState,
  storage?: ProtocolStorage,
): boolean {
  try {
    ;(storage ?? window.localStorage).setItem(
      PROTOCOL_STORAGE_KEY,
      JSON.stringify(state),
    )
    return true
  } catch {
    // Private browsing or quota restrictions must not prevent exploration.
    return false
  }
}
