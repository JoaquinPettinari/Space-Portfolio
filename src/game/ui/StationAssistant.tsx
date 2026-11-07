import { useEffect, useRef } from 'react'

const stationMessages = {
  arrival:
    'Welcome aboard CRUZ DEL SUR. Interior lighting is offline. Activate the auxiliary switch on your left inside the airlock.',
  restored:
    'Interior lighting online. Press E at the bulkhead to enter the observation room. Explore freely. To skip the tutorial, visit the main computer for all professional records.',
  identity:
    'Identity verified. Welcome aboard, Engineer. Your personnel record is available.',
  archives:
    'Expedition archive reviewed. All records remain available at the main computer.',
} as const
export type AssistantEvent = keyof typeof stationMessages

export function StationAssistant({
  event,
  onDismiss,
}: {
  event: AssistantEvent
  onDismiss: () => void
}) {
  return (
    <aside
      className="station-assistant"
      aria-label="Station assistant"
      role="status"
    >
      <p className="eyebrow">CDS-01 / STATION ASSISTANT</p>
      <p>{stationMessages[event]}</p>
      <button onClick={onDismiss} aria-label="Dismiss message">
        Dismiss
      </button>
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
