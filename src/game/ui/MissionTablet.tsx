import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { missions, type ObjectiveId } from '../missions'
import type { ProtocolState } from '../protocol'
import { DeckMap } from './DeckMap'

export function MissionTablet({
  state,
  currentObjective,
  onContinue,
  onSkip,
  onReplay,
  onClose,
  handheld = false,
  onResume,
  onDisplayReady,
  onOpenArchive,
  onAccessiblePortfolio,
  subtitle,
}: {
  state: ProtocolState
  currentObjective: (typeof missions)[number] | null
  onContinue: () => void
  onSkip: () => void
  onReplay: () => void
  onClose: () => void
  handheld?: boolean
  onResume?: () => void
  onDisplayReady?: () => void
  onOpenArchive?: () => void
  onAccessiblePortfolio?: () => void
  subtitle?: ReactNode
}) {
  const { completed, guidance } = state
  const [selected, setSelected] = useState<ObjectiveId>(
    currentObjective?.id ?? 'tablet',
  )
  const dialog = useRef<HTMLElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const mission = missions.find((item) => item.id === selected)!
  useEffect(() => {
    close.current?.focus({ preventScroll: true })
    onDisplayReady?.()
  }, [onDisplayReady])
  const trapFocus = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return
    const buttons = dialog.current?.querySelectorAll('button')
    if (!buttons?.length) return
    const first = buttons[0],
      last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  return (
    <div className={handheld ? 'handheld-tablet-interface' : 'tablet-backdrop'}>
      <section
        ref={dialog}
        className="mission-tablet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tablet-title"
        onKeyDown={trapFocus}
      >
        <header>
          <div>
            <p className="eyebrow">CRUZ DEL SUR / RECOVERY PROTOCOL</p>
            <h1 id="tablet-title">Mission tablet</h1>
          </div>
          <button ref={close} onClick={onClose}>
            Close tablet
          </button>
        </header>
        <p>
          Mission guidance is optional. Explore at your own pace. For
          professional information, visit the Central Archive at any time.
        </p>
        <div className="protocol-actions" aria-label="Protocol settings">
          {onOpenArchive && (
            <button onClick={onOpenArchive}>Quick Portfolio Access</button>
          )}
          {onAccessiblePortfolio && (
            <button onClick={onAccessiblePortfolio}>Read without 3D</button>
          )}
          {onResume && <button onClick={onResume}>Walk with tablet · R</button>}
          <button onClick={onContinue}>
            {guidance === 'skipped' ? 'Resume Protocol' : 'Continue Protocol'}
          </button>
          {guidance !== 'skipped' && (
            <button onClick={onSkip}>Skip Tutorial</button>
          )}
          <button onClick={onReplay}>Replay Protocol</button>
        </div>
        <p role="status">
          {guidance === 'skipped'
            ? 'Guidance paused. All facilities remain available.'
            : currentObjective
              ? `Current objective: ${currentObjective.title}`
              : 'Protocol complete. Enjoy your stay aboard CRUZ DEL SUR.'}
        </p>
        <p className="mission-progress" role="status">
          {completed.length} / {missions.length} objectives complete
        </p>
        <div className="tablet-layout">
          <div className="tablet-objectives" aria-label="Mission objectives">
            {missions.map((item) => (
              <button
                key={item.id}
                aria-pressed={selected === item.id}
                data-complete={completed.includes(item.id)}
                onMouseEnter={() => setSelected(item.id)}
                onFocus={() => setSelected(item.id)}
                onClick={() => setSelected(item.id)}
              >
                <span>{completed.includes(item.id) ? '✓' : '○'}</span>
                <span>
                  {item.title}
                  <small>
                    {completed.includes(item.id) ? 'Complete' : 'Available'}
                  </small>
                </span>
              </button>
            ))}
          </div>
          <div className="tablet-map">
            <DeckMap selected={selected} />
            <div className="map-objective" aria-live="polite">
              <strong>{mission.title}</strong>
              <p>{mission.action}</p>
            </div>
            <small>
              Hover, focus or tap an objective to locate its station. The
              personal workstation is on the rear starboard wall. Central
              Archive also offers the CV download.
            </small>
          </div>
        </div>
        {subtitle}
        <footer>
          {completed.length === missions.length
            ? 'Recovery protocol complete. Enjoy your stay.'
            : 'Suggested route only. All portfolio sections remain accessible.'}
          <span>
            {handheld
              ? 'R · Walk with tablet / T · Lower / ESC · Pause'
              : 'T · Resume / ESC · Pause'}
          </span>
        </footer>
      </section>
    </div>
  )
}
