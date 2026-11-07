import { useEffect, useReducer } from 'react'
import { coffeeReducer, COFFEE_STORAGE_KEY, type CoffeeState } from './coffee'

export function useCoffee(paused: boolean) {
  const [state, dispatch] = useReducer(
    coffeeReducer,
    undefined,
    (): CoffeeState => {
      let achievement = false
      try {
        achievement = localStorage.getItem(COFFEE_STORAGE_KEY) === '1'
      } catch {
        /* Optional storage. */
      }
      return { phase: 'idle', cups: 0, achievement }
    },
  )
  useEffect(() => {
    if (state.phase !== 'brewing' || paused) return
    const timer = window.setTimeout(() => dispatch('finish'), 1200)
    return () => window.clearTimeout(timer)
  }, [state.phase, paused])
  useEffect(() => {
    if (!state.achievement) return
    try {
      localStorage.setItem(COFFEE_STORAGE_KEY, '1')
    } catch {
      /* Exploration does not require storage. */
    }
  }, [state.achievement])
  return { state, dispatch }
}
