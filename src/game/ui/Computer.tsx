import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { PortfolioContent } from '../../portfolio/PortfolioContent'
import type { MissionId } from '../missions'
import './Computer.css'

export function Computer({
  onClose,
  onMissionComplete,
  onDisplayReady,
  subtitle,
}: {
  onClose: () => void
  onMissionComplete?: (id: MissionId) => void
  onDisplayReady?: () => void
  subtitle?: ReactNode
}) {
  const close = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => {
    close.current?.focus({ preventScroll: true })
    onDisplayReady?.()
  }, [onDisplayReady])
  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return
    const items = dialog.current?.querySelectorAll<HTMLElement>(
      ':is(button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]):not([tabindex="-1"]), textarea:not(:disabled))',
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
      className="computer physical-archive"
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
          {subtitle}
          <footer className="desktop-footer">
            <span>E · Return / ESC · Pause</span>
            <button ref={close} data-capture-pointer onClick={onClose}>
              Exit computer
            </button>
          </footer>
        </div>
      </div>
    </section>
  )
}
