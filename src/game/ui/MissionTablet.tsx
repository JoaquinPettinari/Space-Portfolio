import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { missions, type ObjectiveId } from '../missions'
import type { ProtocolState } from '../protocol'

export function MissionTablet({
  state,
  currentObjective,
  onContinue,
  onSkip,
  onReplay,
  onClose,
}: {
  state: ProtocolState
  currentObjective: (typeof missions)[number] | null
  onContinue: () => void
  onSkip: () => void
  onReplay: () => void
  onClose: () => void
}) {
  const { completed, guidance } = state
  const [selected, setSelected] = useState<ObjectiveId>(
    currentObjective?.id ?? 'tablet',
  )
  const dialog = useRef<HTMLElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const mission = missions.find((item) => item.id === selected)!
  useEffect(() => {
    close.current?.focus()
  }, [])
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
    <div className="tablet-backdrop">
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
            <svg
              viewBox="0 0 400 410"
              role="img"
              aria-label="CRUZ DEL SUR deck map. Auxiliary power beside the rear airlock. Hologram at the central table, crew dossier by the rear airlock, archives at the forward terminal, Earth Communications on the port wall."
            >
              <path
                d="M80 25 H320 L375 90 V290 L320 345 H80 L25 290 V90 Z"
                fill="#102c3b"
                stroke="#6dabbf"
                strokeWidth="3"
              />
              <rect
                x="160"
                y="345"
                width="80"
                height="55"
                fill="#102c3b"
                stroke="#6dabbf"
              />
              <rect x="168" y="362" width="12" height="12" fill="#ffd384" />
              <text
                x="200"
                y="392"
                textAnchor="middle"
                fill="#ceeff8"
                fontSize="10"
              >
                ENTRY AIRLOCK
              </text>
              <path
                d="M110 25 H290 M25 110 V180 M25 210 V280 M375 110 V180 M375 210 V280"
                stroke="#9ce8ff"
                strokeWidth="8"
              />
              <rect
                x="145"
                y="53"
                width="110"
                height="44"
                rx="8"
                fill="#3eacc4"
                stroke="#c3f5ff"
                strokeWidth="3"
              />
              <rect
                x="40"
                y="190"
                width="50"
                height="40"
                rx="4"
                fill="#3eacc4"
              />
              <text
                x="65"
                y="180"
                textAnchor="middle"
                fill="#ceeff8"
                fontSize="10"
              >
                EARTH COMMS
              </text>
              <circle
                cx={
                  selected === 'uplink'
                    ? 65
                    : selected === 'lighting'
                      ? 175
                      : selected === 'dossier'
                        ? 320
                        : selected === 'crew'
                          ? 287
                          : 200
                }
                cy={
                  selected === 'uplink'
                    ? 210
                    : selected === 'lighting'
                      ? 368
                      : selected === 'dossier'
                        ? 295
                        : selected === 'crew'
                          ? 225
                          : selected === 'tablet'
                            ? 210
                            : 75
                }
                r={selected === 'lighting' ? 20 : 39}
                fill="none"
                stroke="#8ff4ff"
                strokeWidth="2"
                strokeDasharray="4 6"
              />
              <text
                x="200"
                y="125"
                textAnchor="middle"
                fill="#ceeff8"
                fontSize="13"
              >
                FORWARD TERMINAL
              </text>
              <rect
                x="255"
                y="170"
                width="65"
                height="110"
                rx="16"
                fill="#234554"
                stroke="#577d8e"
              />
              <rect
                x="85"
                y="280"
                width="50"
                height="30"
                rx="4"
                fill="#3eacc4"
              />
              <text
                x="110"
                y="270"
                textAnchor="middle"
                fill="#ceeff8"
                fontSize="11"
              >
                CREW DOSSIER
              </text>
              <rect
                x="300"
                y="280"
                width="40"
                height="30"
                rx="4"
                fill="#3eacc4"
              />
              <text
                x="320"
                y="335"
                textAnchor="middle"
                fill="#ceeff8"
                fontSize="9"
              >
                PERSONAL OS
              </text>
              <rect
                x="242"
                y="282"
                width="26"
                height="26"
                rx="4"
                fill="#ffd384"
              />
              <text
                x="270"
                y="275"
                textAnchor="middle"
                fill="#ffd384"
                fontSize="11"
              >
                AUX POWER
              </text>
              <text
                x="200"
                y="320"
                textAnchor="middle"
                fill="#8aafbd"
                fontSize="12"
              >
                REAR AIRLOCK
              </text>
              <path d="M165 345 H235" stroke="#de8c77" strokeWidth="8" />
            </svg>
            <div className="map-objective" aria-live="polite">
              <strong>{mission.title}</strong>
              <p>{mission.action}</p>
            </div>
            <small>
              Hover, focus or tap an objective to locate its station. The crew
              workstation is on the rear starboard wall; a second CV copy is
              beside the airlock.
            </small>
          </div>
        </div>
        <footer>
          {completed.length === missions.length
            ? 'Recovery protocol complete. Enjoy your stay.'
            : 'Suggested route only. All portfolio sections remain accessible.'}
          <span>T · Resume / ESC · Pause</span>
        </footer>
      </section>
    </div>
  )
}
