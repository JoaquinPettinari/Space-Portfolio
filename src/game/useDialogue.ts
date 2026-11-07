import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  dialogueReducer,
  DIALOGUE_DURATION_MS,
  initialDialogue,
  type AssistantEvent,
} from './dialogue'

/** Session-only subtitles, independent of voice audio and animation preferences. */
export function useDialogue({ paused = false }: { paused?: boolean } = {}) {
  const [state, dispatch] = useReducer(
    dialogueReducer,
    undefined,
    initialDialogue,
  )
  const message = state.current
  const [hidden, setHidden] = useState(() => document.hidden)
  const clock = useRef<{ event: AssistantEvent | null; remainingMs: number }>({
    event: null,
    remainingMs: 0,
  })

  useEffect(() => {
    const visibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [])

  useEffect(() => {
    const timer = clock.current
    if (timer.event !== message) {
      timer.event = message
      timer.remainingMs = message ? DIALOGUE_DURATION_MS[message] : 0
    }
    if (!message || paused || hidden) return
    const startedAt = performance.now()
    const timeout = window.setTimeout(
      () => dispatch({ type: 'dismiss' }),
      timer.remainingMs,
    )
    return () => {
      window.clearTimeout(timeout)
      timer.remainingMs = Math.max(
        0,
        timer.remainingMs - (performance.now() - startedAt),
      )
    }
  }, [message, paused, hidden])

  const enqueue = useCallback(
    (event: AssistantEvent) => dispatch({ type: 'enqueue', event }),
    [],
  )
  const dismiss = useCallback(() => dispatch({ type: 'dismiss' }), [])
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])
  return { message, enqueue, dismiss, clear }
}
