/** Approved GDD lines are kept verbatim; remaining lines describe actual events. */
export const dialogueMessages = {
  arrival:
    'Welcome aboard CRUZ DEL SUR. Docking complete. Arrival systems online. Verify your credentials at Crew Access beside the secured bulkhead to enter the bridge.',
  restored:
    'Interior lighting online. Identify yourself at Crew Access to open the bridge bulkhead. Quick Portfolio Access remains available in your tablet.',
  unlocking: 'Bulkhead unlocking.',
  opening: 'Bulkhead opening. Keep clear of the moving leaves.',
  open: 'Bulkhead open. Explore freely. All professional records remain available at the Central Archive.',
  tabletPrompt: 'Press T to open your mission tablet.',
  tablet:
    'Mission guidance is optional. Explore at your own pace. For professional information, visit the Central Archive at any time.',
  identity:
    'Identity verified. Welcome aboard, Engineer. Your personnel record is available.',
  archives:
    'Expedition archive reviewed. All records remain available at the main computer.',
  communications:
    'Earth Communications. Messages are welcome in Spanish, English, Italian or Norwegian. Send Transmission sends a real message; Skip sends no email.',
  transmissionAccepted: 'Transmission accepted by the email provider.',
  transmissionSkipped: 'Communications objective complete. No email was sent.',
  dossier:
    'Dossier objective complete. Your CV remains available at the Personal Workstation and Central Archive.',
  complete:
    'Recovery protocol complete. All station facilities are available. Enjoy your stay aboard CRUZ DEL SUR.',
} as const

export type AssistantEvent = keyof typeof dialogueMessages

/** Readable without voice audio; active door events can supersede stale lines. */
export const DIALOGUE_DURATION_MS: Readonly<Record<AssistantEvent, number>> = {
  arrival: 10000,
  restored: 6500,
  unlocking: 4000,
  opening: 4000,
  open: 6000,
  tabletPrompt: 4000,
  tablet: 10000,
  identity: 6500,
  archives: 5000,
  communications: 9000,
  transmissionAccepted: 5000,
  transmissionSkipped: 5000,
  dossier: 7000,
  complete: 8000,
}

export interface DialogueState {
  current: AssistantEvent | null
  queue: readonly AssistantEvent[]
  seen: readonly AssistantEvent[]
}
type DialogueAction =
  | { type: 'enqueue'; event: AssistantEvent }
  | { type: 'dismiss' }
  | { type: 'clear' }

const entryOrder: readonly AssistantEvent[] = [
  'arrival',
  'restored',
  'unlocking',
  'opening',
  'open',
]

export function initialDialogue(): DialogueState {
  return { current: null, queue: [], seen: [] }
}

/** Queue only discrete events. Clearing visible guidance never re-arms old nags. */
export function dialogueReducer(
  state: DialogueState,
  action: DialogueAction,
): DialogueState {
  if (action.type === 'clear') {
    if (!state.current && !state.queue.length) return state
    return { ...state, current: null, queue: [] }
  }
  if (action.type === 'dismiss') {
    if (!state.current) return state
    return {
      ...state,
      current: state.queue[0] ?? null,
      queue: state.queue.slice(1),
    }
  }
  const event = action.event
  if (state.seen.includes(event)) return state
  if (event === 'tabletPrompt' && state.seen.includes('tablet')) return state
  const entryIndex = entryOrder.indexOf(event)
  if (
    entryIndex !== -1 &&
    state.seen.some((id) => entryOrder.indexOf(id) > entryIndex)
  )
    return state

  const seen = [...state.seen, event]
  let queue = state.queue
  if (event === 'tablet') {
    queue = queue.filter((id) => id !== 'tabletPrompt')
    if (state.current === 'tabletPrompt') return { current: event, queue, seen }
  }
  if (entryIndex !== -1) {
    queue = queue.filter((id) => !entryOrder.includes(id))
    if (state.current && entryOrder.includes(state.current))
      return { current: event, queue, seen }
  }
  if (!state.current) return { current: event, queue, seen }
  return { current: state.current, queue: [...queue, event], seen }
}
