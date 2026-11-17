import { useEffect } from 'react'
import { BatteryFull, Wifi, MapPin, ClipboardList } from 'lucide-react'
import {
  completedObjectiveCount,
  missions,
  type ObjectiveId,
} from '../missions'
import type { ProtocolState } from '../protocol'
import { DeckMap } from './DeckMap'

const objectiveLocations: Partial<Record<ObjectiveId, string>> = {
  crew: 'Arrival deck · Crew Access',
  archives: 'Bridge · Port archive console',
  uplink: 'Bridge · Starboard communications',
  dossier: 'Bridge · Personal workstation',
}

/** Read-only mission/map reader: mouse and movement remain owned by FPS input. */
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
        <strong>
          CDS-01 <span>MISSION ASSISTANT</span>
        </strong>
        <div aria-label="Local link online">
          <Wifi size={21} aria-hidden="true" />
          <BatteryFull size={25} aria-hidden="true" />
        </div>
      </header>
      <div className="held-tablet-summary">
        <span>EXPEDITION / PAMPA-07</span>
        <strong>
          {completedObjectiveCount(state.completed)} / {missions.length}
        </strong>
      </div>
      <p>
        {state.guidance === 'skipped'
          ? 'Free exploration · Guidance paused'
          : currentObjective
            ? `Objective: ${currentObjective.title}`
            : 'Protocol complete'}
      </p>
      <div className="held-tablet-layout">
        <div className="held-tablet-tasks">
          <div className="held-tablet-section-label">
            <ClipboardList size={18} aria-hidden="true" /> TASKS{' '}
            <span>01—04</span>
          </div>
          <ul aria-label="Mission progress">
            {missions.map((mission, index) => (
              <li
                key={mission.id}
                data-current={mission.id === currentObjective?.id}
                data-complete={state.completed.includes(mission.id)}
              >
                <span className="held-task-check" aria-hidden="true">
                  {state.completed.includes(mission.id)
                    ? '✓'
                    : String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong>{mission.title}</strong>
                  <small>
                    <MapPin size={11} aria-hidden="true" />
                    {objectiveLocations[mission.id]}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="held-tablet-map">
          <div className="held-tablet-section-label">
            DECK MAP <span>UPPER DECK</span>
          </div>
          <DeckMap selected={currentObjective?.id ?? 'crew'} />
          <span className="held-map-legend">
            <i /> CURRENT OBJECTIVE
          </span>
        </div>
      </div>
      <footer>
        <span>WASD · Move / Mouse · Look</span>
        <strong>T · Lower tablet</strong>
      </footer>
    </section>
  )
}
