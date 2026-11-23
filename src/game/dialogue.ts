import { dialogueManifest } from './dialogueManifest'
export type AssistantEvent = keyof typeof dialogueManifest
export const dialogueMessages = Object.fromEntries(
  Object.entries(dialogueManifest).map(([id, line]) => [id, line.caption]),
) as Record<AssistantEvent, string>
export const DIALOGUE_DURATION_MS = Object.fromEntries(
  Object.entries(dialogueManifest).map(([id, line]) => [id, line.durationMs]),
) as Record<AssistantEvent, number>
export interface DialogueState {
  current: AssistantEvent | null
  queue: readonly AssistantEvent[]
  seen: readonly AssistantEvent[]
}
type DialogueAction =
  | { type: 'enqueue'; event: AssistantEvent }
  | { type: 'dismiss' }
  | { type: 'clear' }
export function initialDialogue(): DialogueState {
  return { current: null, queue: [], seen: [] }
}
/** Only actual enabled events narrate. Interrupted lines never replay later. */
export function dialogueReducer(
  state: DialogueState,
  action: DialogueAction,
): DialogueState {
  if (action.type === 'clear') return { ...state, current: null, queue: [] }
  if (action.type === 'dismiss') {
    if (!state.current) return state
    return {
      ...state,
      current: state.queue[0] ?? null,
      queue: state.queue.slice(1),
    }
  }
  const event = action.event
  if (!dialogueManifest[event].enabled || state.seen.includes(event))
    return state
  if (
    event === 'arrival' &&
    state.seen.some(
      (id) => id === 'crewVerified' || id === 'bridgeIntroduction',
    )
  )
    return state
  if (event === 'tabletPrompt' && state.seen.includes('tablet')) return state
  const seen = [...state.seen, event]
  const queue =
    event === 'tablet'
      ? state.queue.filter((id) => id !== 'tabletPrompt')
      : state.queue
  if (
    !state.current ||
    (event === 'tablet' && state.current === 'tabletPrompt') ||
    dialogueManifest[event].priority > dialogueManifest[state.current].priority
  )
    return { current: event, queue, seen }
  return { current: state.current, queue: [...queue, event], seen }
}
/** Future completion requires real story completion AND actual relay restoration. */
export function canNarrateMissionComplete(
  storyComplete: boolean,
  relayRestored: boolean,
) {
  return storyComplete && relayRestored
}
