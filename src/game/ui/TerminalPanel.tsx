import { useEffect, useId, useRef, type ReactNode } from 'react'
import './Computer.css'
import { Compass, Satellite } from 'lucide-react'

/** Shared DOM shell for station terminals; game owns Escape and capture. */
export function TerminalPanel({
  title,
  onClose,
  children,
  physical = false,
  subtitle,
  communications = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  physical?: boolean
  subtitle?: ReactNode
  communications?: boolean
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
      className={
        physical ? 'computer physical-archive physical-terminal' : 'computer'
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const items = root.current?.querySelectorAll<HTMLElement>(
          ':is(button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), textarea:not(:disabled), select:not(:disabled), [tabindex="0"])',
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
            {communications ? (
              <span className="communications-brand">
                <Compass size={34} aria-hidden="true" />
                <span>
                  <strong>CRUZ DEL SUR</strong>
                  <small>CDS-01</small>
                </span>
              </span>
            ) : (
              <span>CRUZ DEL SUR / CDS-01</span>
            )}
            <h1 id={id}>
              {communications && <Satellite size={27} aria-hidden="true" />}
              {title}
            </h1>
          </header>
          <div className="desktop-content portfolio-content">{children}</div>
          {subtitle}
          <footer className="desktop-footer">
            <span>E / ESC · Return to station</span>
            <button ref={close} data-capture-pointer onClick={onClose}>
              Leave terminal
            </button>
          </footer>
        </div>
      </div>
    </section>
  )
}
