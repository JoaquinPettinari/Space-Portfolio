import { useEffect, useReducer } from 'react'
import {
  getCurrentObjective,
  loadProtocol,
  protocolReducer,
  saveProtocol,
} from './protocol'
export function useProtocol() {
  const [state, dispatch] = useReducer(protocolReducer, undefined, () =>
    loadProtocol(),
  )
  useEffect(() => {
    saveProtocol(state)
  }, [state])
  return { state, dispatch, currentObjective: getCurrentObjective(state) }
}
