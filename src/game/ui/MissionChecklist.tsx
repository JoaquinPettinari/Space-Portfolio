import { missions, type ObjectiveId } from '../missions'

/** Read-only HUD projection of the same mission state used by the tablet. */
export function MissionChecklist({
  completed,
  current,
}: {
  completed: readonly ObjectiveId[]
  current?: ObjectiveId
}) {
  return (
    <ul className="mission-checklist" aria-label="Mission progress">
      {missions.map((mission) => {
        const done = completed.includes(mission.id)
        return (
          <li
            key={mission.id}
            data-complete={done}
            aria-current={!done && current === mission.id ? 'step' : undefined}
          >
            <span className="mission-checklist__box" aria-hidden="true">
              {done ? '✓' : ''}
            </span>
            <span>
              {done ? <s>{mission.title}</s> : mission.title}
              <span className="mission-checklist__status">
                {done ? ' — Complete' : ' — Pending'}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
