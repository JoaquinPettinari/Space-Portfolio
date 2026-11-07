import { useEffect, useId, useRef, type ReactNode } from 'react'

/** Shared DOM shell for station terminals; game owns Escape and capture. */
export function TerminalPanel({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const id = useId()
  const root = useRef<HTMLElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    close.current?.focus({ preventScroll: true })
  }, [])
  return (
    <section
      ref={root}
      className="computer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const items = root.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]',
        )
        const available = Array.from(items ?? []).filter(
          (item) =>
            item.tabIndex >= 0 &&
            !item.closest('[hidden], [inert], [aria-hidden="true"]'),
        )
        const first = available[0],
          last = available.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
    >
      <div className="monitor-bezel">
        <div className="desktop">
          <header className="desktop-bar">
            <span>CRUZ DEL SUR / CDS-01</span>
            <h1 id={id}>{title}</h1>
          </header>
          <div className="desktop-content portfolio-content">{children}</div>
          <footer className="desktop-footer">
            <span>E to resume · ESC to pause</span>
            <button ref={close} data-capture-pointer onClick={onClose}>
              Leave terminal
            </button>
          </footer>
        </div>
      </div>
    </section>
  )
}
