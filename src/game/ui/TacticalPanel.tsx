import { useEffect } from 'react'
import { TriangleAlert, RadioTower, Radar } from 'lucide-react'
import { missions } from '../missions'
import type { ProtocolState } from '../protocol'
import './TacticalPanel.css'

const inspectionMissions = missions.filter((mission) => mission.id !== 'crew')
const issues = [
  { label: 'Hull stress', Icon: TriangleAlert, severity: 'critical' },
  { label: 'Comms offline', Icon: RadioTower, severity: 'critical' },
  { label: 'Sensor relay', Icon: Radar, severity: 'warning' },
] as const

export function TacticalPanel({
  protocol,
  onDiagnostics,
}: {
  protocol: ProtocolState
  onDiagnostics: () => void
}) {
  const inspected = protocol.completed.includes('tactical')
  useEffect(() => {
    if (!inspected) onDiagnostics()
  }, [inspected, onDiagnostics])
  return (
    <div className="tactical-console">
      <aside
        className="tactical-card tactical-findings"
        aria-label="Detected issues"
      >
        <h2>Detected issues</h2>
        <ul className="tactical-issues">
          {issues.map(({ label, Icon, severity }) => (
            <li className={`tactical-issue ${severity}`} key={label}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
              <span className="tactical-status-mark" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </aside>
      <div className="tactical-model-caption" aria-label="Vessel hologram">
        <span>
          TACTICAL INSPECTION <small>Ship status review</small>
        </span>
        <div className="tactical-projection" aria-hidden="true" />
      </div>
      <aside
        className="tactical-card tactical-progress"
        aria-label="Inspection progress"
      >
        <h2>Inspection progress</h2>
        <ol>
          {inspectionMissions.map((mission, index) => {
            const done = protocol.completed.includes(mission.id)
            const current =
              !done &&
              inspectionMissions.find(
                (item) => !protocol.completed.includes(item.id),
              )?.id === mission.id
            return (
              <li
                key={mission.id}
                className={done ? 'is-complete' : current ? 'is-current' : ''}
                aria-current={current ? 'step' : undefined}
              >
                <span className="tactical-step" aria-hidden="true">
                  {done ? '✓' : index + 1}
                </span>
                <span>{mission.title}</span>
              </li>
            )
          })}
        </ol>
      </aside>
    </div>
  )
}
