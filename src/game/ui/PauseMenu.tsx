import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import './PauseMenu.css'

type PauseMenuProps = {
  visible: boolean
  onResume: () => void
  subtitlesEnabled: boolean
  onToggleSubtitles: () => void
  error: string
  children: ReactNode
}

/** Keep audio mounted while the overlay is hidden so its preference survives. */
export function PauseMenu({
  visible,
  onResume,
  subtitlesEnabled,
  onToggleSubtitles,
  error,
  children,
}: PauseMenuProps) {
  const dialog = useRef<HTMLElement>(null)
  const resume = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (visible) resume.current?.focus({ preventScroll: true })
  }, [visible])
  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (!visible || event.key !== 'Tab') return
    const controls = Array.from(
      dialog.current?.querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)',
      ) ?? [],
    ).filter(
      (button) => !button.closest('[hidden], [inert], [aria-hidden="true"]'),
    )
    const first = controls[0]
    const last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }
  return (
    <div className="pause-menu-backdrop" hidden={!visible}>
      <section
        ref={dialog}
        className="pause-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-menu-title"
        onKeyDown={trapFocus}
      >
        <header>
          <h1 id="pause-menu-title">
            <span aria-hidden="true">Ⅱ</span> Game paused
          </h1>
          <span>CDS-01</span>
        </header>
        <button
          ref={resume}
          className="pause-menu__resume"
          data-capture-pointer
          onClick={onResume}
        >
          Resume mission
        </button>
        <div className="pause-menu__settings">
          {children}
          <button
            className="pause-menu__setting"
            aria-label="Subtitles"
            role="switch"
            aria-checked={subtitlesEnabled}
            onClick={onToggleSubtitles}
          >
            <span>Subtitles</span>
            <span className="setting-switch-state" aria-hidden="true">
              <span>{subtitlesEnabled ? 'On' : 'Off'}</span>
              <span className="setting-switch-track">
                <span />
              </span>
            </span>
          </button>
        </div>
        {error && (
          <p className="pause-menu__error" role="status">
            {error}
          </p>
        )}
        <footer>
          <span>ESC to resume</span>
          <span>T · Tablet</span>
        </footer>
      </section>
    </div>
  )
}
