import { useEffect } from 'react'
import { completedObjectiveCount, missions } from '../missions'
import type { ProtocolState } from '../protocol'
import { DeckMap } from './DeckMap'

/** Non-interactive reading mode: pointer lock remains owned by the FPS camera. */
export function HeldTabletDisplay({
  state,
  currentObjective,
  onDisplayReady,
}: {
  state: ProtocolState
  currentObjective: (typeof missions)[number] | null
  onDisplayReady?: () => void
}) {
  useEffect(() => onDisplayReady?.(), [onDisplayReady])
  return (
    <section className="held-tablet-display" aria-label="Held mission tablet">
      <header>
        <strong>CDS-01 · TASK MANAGER</strong>
        <span>
          {completedObjectiveCount(state.completed)} / {missions.length}
        </span>
      </header>
      <p>
        {state.guidance === 'skipped'
          ? 'Free exploration · Guidance paused'
          : currentObjective
            ? `Objective: ${currentObjective.title}`
            : 'Protocol complete'}
      </p>
      <div className="held-tablet-layout">
        <div className="held-tablet-tasks">
          <div className="held-tablet-section-label" aria-hidden="true">
            TASKS
          </div>
          <ul aria-label="Mission progress">
            {missions.map((mission) => (
              <li
                key={mission.id}
                data-complete={state.completed.includes(mission.id)}
              >
                <span aria-hidden="true">
                  {state.completed.includes(mission.id) ? '☑' : '□'}
                </span>{' '}
                {mission.title}
              </li>
            ))}
          </ul>
        </div>
        <div className="held-tablet-map">
          <DeckMap selected={currentObjective?.id ?? 'crew'} />
        </div>
      </div>
      <div className="held-tablet-tabs" aria-hidden="true">
        <span>☷ Tasks</span>
        <span className="selected">⌖ Deck map</span>
        <span>▤ Logs</span>
      </div>
      <footer>
        WASD · Move / Mouse · Look / R · Interact & skip tutorial / T · Lower
      </footer>
    </section>
  )
}
