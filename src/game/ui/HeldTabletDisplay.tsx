import { useEffect } from 'react'
import { missions } from '../missions'
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
        <strong>CRUZ DEL SUR · MISSION TABLET</strong>
        <span>
          {state.completed.length} / {missions.length}
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
        <DeckMap selected={currentObjective?.id ?? 'tablet'} />
      </div>
      <footer>
        WASD · Move / Mouse · Look / R · Interact & skip tutorial / T · Lower
      </footer>
    </section>
  )
}
