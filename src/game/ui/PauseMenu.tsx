import { trapDialogFocus } from './dialogFocus'
import { useEffect, useRef, type ReactNode } from 'react'
import './PauseMenu.css'

type PauseMenuProps = {
  visible: boolean
  onResume: () => void
  onOpenArchive?: () => void
  onAccessiblePortfolio?: () => void
  subtitlesEnabled: boolean
  onToggleSubtitles: () => void
  error: string
  children: ReactNode
}

/** Keep audio mounted while the overlay is hidden so its preference survives. */
export function PauseMenu({
  visible,
  onResume,
  onOpenArchive,
  onAccessiblePortfolio,
  subtitlesEnabled,
  onToggleSubtitles,
  error,
  children,
}: PauseMenuProps) {
  const resume = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (visible) resume.current?.focus({ preventScroll: true })
  }, [visible])

  return (
    <div className="pause-menu-backdrop" hidden={!visible}>
      <section
        className="pause-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-menu-title"
        onKeyDown={trapDialogFocus}
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
        {onOpenArchive && (
          <button className="pause-menu__shortcut" onClick={onOpenArchive}>
            Quick Portfolio Access
          </button>
        )}
        {onAccessiblePortfolio && (
          <button
            className="pause-menu__shortcut"
            onClick={onAccessiblePortfolio}
          >
            Read without 3D
          </button>
        )}
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
          <a href="/credits.html" target="_blank" rel="noreferrer">
            Credits
          </a>
          <span>T · Tablet</span>
        </footer>
      </section>
    </div>
  )
}
