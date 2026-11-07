import { useEffect, useReducer } from 'react'
import {
  getCurrentObjective,
  initialProtocol,
  PROTOCOL_STORAGE_KEY,
  protocolReducer,
} from './protocol'
export function useProtocol() {
  const [state, dispatch] = useReducer(
    protocolReducer,
    undefined,
    initialProtocol,
  )
  useEffect(() => {
    try {
      // Retire only the old gameplay key; preferences belong to other systems.
      localStorage.removeItem(PROTOCOL_STORAGE_KEY)
    } catch {
      // Storage access is not required for an in-memory session.
    }
  }, [])
  return { state, dispatch, currentObjective: getCurrentObjective(state) }
}
