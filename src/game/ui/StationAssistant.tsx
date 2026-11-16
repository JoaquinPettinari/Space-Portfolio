import { useEffect, useLayoutEffect, useRef } from 'react'
import { X } from 'lucide-react'
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
      className={`station-assistant${dismissible ? ' station-assistant--dismissible' : ''}`}
      aria-label="Station assistant"
      role="status"
      data-dialogue-event={event}
    >
      <span className="subtitle-speaker" aria-label="Station AI">
        IA
      </span>
      <p className="subtitle-message">{dialogueMessages[event]}</p>
      <svg
        className="subtitle-waveform"
        width="32"
        height="28"
        viewBox="0 0 32 28"
        aria-hidden="true"
      >
        <path
          d="M2 11v6m5-10v14m5-18v22m5-16v10m5-13v16m5-11v6m4-4v2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
      {dismissible && (
        <button
          className="subtitle-dismiss"
          ref={dismiss}
          onClick={onDismiss}
          aria-label="Dismiss message"
          title="Dismiss message"
        >
          <X size={16} aria-hidden="true" />
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
