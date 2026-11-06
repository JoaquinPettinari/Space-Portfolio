import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { missions, type MissionId } from '../missions'

export function MissionTablet({
  completed,
  onClose,
}: {
  completed: MissionId[]
  onClose: () => void
}) {
  const [selected, setSelected] = useState<MissionId>('tablet')
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
            <p className="eyebrow">ORBIT / RECOVERY OPERATIONS</p>
            <h1 id="tablet-title">Mission tablet</h1>
          </div>
          <button ref={close} onClick={onClose}>
            Close tablet
          </button>
        </header>
        <p>
          A particle storm disrupted our Earth link. Recover the crew records
          and prepare a transmission. Complete objectives in any order.
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
              viewBox="0 0 400 380"
              role="img"
              aria-label="Observatory deck map. Hologram at the central table, crew dossier by the rear airlock, archives at the forward terminal."
            >
              <path
                d="M80 25 H320 L375 90 V290 L320 345 H80 L25 290 V90 Z"
                fill="#102c3b"
                stroke="#6dabbf"
                strokeWidth="3"
              />
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
              <circle
                cx={
                  selected === 'dossier' ? 110 : selected === 'crew' ? 287 : 200
                }
                cy={
                  selected === 'dossier'
                    ? 295
                    : selected === 'crew'
                      ? 225
                      : selected === 'tablet'
                        ? 210
                        : 75
                }
                r="39"
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
              dossier is beside the rear airlock.
            </small>
          </div>
        </div>
        <footer>
          {completed.length === missions.length
            ? 'Recovery checklist complete. Earth transmission remains yours to send.'
            : 'No required order. All portfolio sections remain accessible.'}
          <span>T / ESC · Close</span>
        </footer>
      </section>
    </div>
  )
}
