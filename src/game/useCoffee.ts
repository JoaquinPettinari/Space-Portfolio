import { useEffect, useReducer } from 'react'
import { coffeeReducer, COFFEE_STORAGE_KEY, type CoffeeState } from './coffee'

export function useCoffee(paused: boolean) {
  const [state, dispatch] = useReducer(
    coffeeReducer,
    undefined,
    (): CoffeeState => ({ phase: 'idle', cups: 0, achievement: false }),
  )
  useEffect(() => {
    if (state.phase !== 'brewing' || paused) return
    const timer = window.setTimeout(() => dispatch('finish'), 1200)
    return () => window.clearTimeout(timer)
  }, [state.phase, paused])
  useEffect(() => {
    try {
      localStorage.removeItem(COFFEE_STORAGE_KEY)
    } catch {
      /* Exploration does not require storage. */
    }
  }, [])
  return { state, dispatch }
}
