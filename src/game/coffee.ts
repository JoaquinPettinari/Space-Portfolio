export type CoffeeState = {
  phase: 'idle' | 'brewing' | 'ready' | 'enjoyed'
  cups: number
  achievement: boolean
}
export type CoffeeEvent = 'interact' | 'brew' | 'finish'
/** Legacy key used only to discard progress saved by older versions. */
export const COFFEE_STORAGE_KEY = 'cruz-del-sur.coffee'
export function coffeeReducer(
  state: CoffeeState,
  event: CoffeeEvent,
): CoffeeState {
  if (event === 'finish')
    return state.phase === 'brewing'
      ? { ...state, phase: 'ready', cups: state.cups + 1 }
      : state
  if (event === 'interact' && state.phase === 'ready')
    return { ...state, phase: 'enjoyed', achievement: true }
  if (state.phase === 'idle' || state.phase === 'enjoyed')
    return { ...state, phase: 'brewing' }
  return state
}
