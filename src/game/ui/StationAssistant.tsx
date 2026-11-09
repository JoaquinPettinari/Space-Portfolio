import { useEffect, useLayoutEffect, useRef } from 'react'
import { dialogueMessages, type AssistantEvent } from '../dialogue'
export type { AssistantEvent } from '../dialogue'

export function StationAssistant({
  event,
  onDismiss,
  dismissible = true,
}: {
  event: AssistantEvent
  onDismiss: () => void
  dismissible?: boolean
}) {
  const dismiss = useRef<HTMLButtonElement>(null)
  useLayoutEffect(() => {
    const button = dismiss.current
    return () => {
      // Expiry must not strand keyboard focus when its button disappears.
      if (button && document.activeElement === button) {
        const dialog = button.closest('[role="dialog"]')
        const destination = dialog?.querySelector<HTMLElement>(
          '[data-capture-pointer], header button',
        )
        destination?.focus({ preventScroll: true })
      }
    }
  }, [])
  return (
    <aside
      className="station-assistant"
      aria-label="Station assistant"
      role="status"
      data-dialogue-event={event}
    >
      <p className="eyebrow">CDS-01 / STATION ASSISTANT</p>
      <p>{dialogueMessages[event]}</p>
      {dismissible && (
        <button ref={dismiss} onClick={onDismiss} aria-label="Dismiss message">
          Dismiss
        </button>
      )}
    </aside>
  )
}

export function IdentificationPanel({ onClose }: { onClose: () => void }) {
  const cancel = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    cancel.current?.focus()
  }, [])
  return (
    <section
      className="hologram-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Crew identification"
      onKeyDown={(event) => {
        if (event.key === 'Tab') {
          event.preventDefault()
          cancel.current?.focus()
        }
      }}
    >
      <p className="eyebrow">CRUZ DEL SUR / ID READER</p>
      <h1>Verifying crew identity…</h1>
      <p role="status">Reading personnel card. No further action required.</p>
      <footer>
        <button ref={cancel} data-capture-pointer onClick={onClose}>
          Cancel scan
        </button>
      </footer>
    </section>
  )
}
