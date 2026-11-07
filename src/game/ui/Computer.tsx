import { useEffect, useRef, type KeyboardEvent } from 'react'
import { PortfolioContent } from '../../portfolio/PortfolioContent'
import type { MissionId } from '../missions'

export function Computer({
  onClose,
  onMissionComplete,
}: {
  onClose: () => void
  onMissionComplete?: (id: MissionId) => void
}) {
  const close = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => {
    close.current?.focus()
  }, [])
  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return
    const items = dialog.current?.querySelectorAll<HTMLElement>(
      ':is(button:not(:disabled), a[href])',
    )
    if (!items?.length) return
    const first = items[0],
      last = items[items.length - 1]
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement?.matches('[tabindex="-1"]'))
    ) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  return (
    <section
      ref={dialog}
      className="computer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="computer-title"
      onKeyDown={trapFocus}
    >
      <div className="monitor-bezel">
        <div className="desktop">
          <header className="desktop-bar">
            <span>CRUZ DEL SUR / CDS-01</span>
            <h1 id="computer-title">Central Archive</h1>
          </header>
          <PortfolioContent onActivity={onMissionComplete} />
          <footer className="desktop-footer">
            <span>PROFESSIONAL RECORDS · ACCESS UNRESTRICTED</span>
            <button ref={close} data-capture-pointer onClick={onClose}>
              Exit computer
            </button>
          </footer>
        </div>
        <div className="monitor-brand">
          C R U Z D E L S U R <span>●</span>
        </div>
      </div>
      <p className="computer-help">
        E / Exit computer to resume · ESC to pause and release the mouse.
      </p>
    </section>
  )
}
