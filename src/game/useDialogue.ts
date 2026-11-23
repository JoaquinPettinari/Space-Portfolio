import { getDialogueCues } from './dialogueCaptions'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  dialogueReducer,
  initialDialogue,
  type AssistantEvent,
} from './dialogue'
import { dialogueManifest } from './dialogueManifest'
import { createDialoguePlayback } from './dialoguePlayback'

export function useDialogue({
  paused = false,
  soundEnabled = false,
}: { paused?: boolean; soundEnabled?: boolean } = {}) {
  const [state, dispatch] = useReducer(
    dialogueReducer,
    undefined,
    initialDialogue,
  )
  const message = state.current
  const [activeCaption, setActiveCaption] = useState<{
    event: AssistantEvent
    text: string
  } | null>(null)
  const [hidden, setHidden] = useState(() => document.hidden)
  const [speaking, setSpeaking] = useState(false)
  const controller = useRef<ReturnType<typeof createDialoguePlayback> | null>(
    null,
  )
  useEffect(() => {
    const visibility = () => setHidden(document.hidden)
    const retry = (event: Event) => {
      if (event.isTrusted) controller.current?.retry()
    }
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('pointerdown', retry)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('pointerdown', retry)
    }
  }, [])
  useEffect(() => {
    if (!message) return
    const playback = createDialoguePlayback(
      dialogueManifest[message],
      () => dispatch({ type: 'dismiss' }),
      setSpeaking,
      undefined,
      (text) => setActiveCaption({ event: message, text }),
    )
    controller.current = playback
    return () => {
      playback.dispose()
      controller.current = null
    }
  }, [message])
  useEffect(() => {
    controller.current?.setOptions({ paused: paused || hidden, soundEnabled })
  }, [message, paused, hidden, soundEnabled])
  const enqueue = useCallback(
    (event: AssistantEvent) => dispatch({ type: 'enqueue', event }),
    [],
  )
  const dismiss = useCallback(() => dispatch({ type: 'dismiss' }), [])
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])
  const caption = message
    ? activeCaption?.event === message
      ? activeCaption.text
      : getDialogueCues(dialogueManifest[message])[0].text
    : ''
  return { message: state.current, caption, speaking, enqueue, dismiss, clear }
}
