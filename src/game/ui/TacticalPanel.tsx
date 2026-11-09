import { useState } from 'react'
import { missions } from '../missions'
import type { ProtocolState } from '../protocol'
import type { BulkheadPhase } from '../world/bulkhead'
import './TacticalPanel.css'

export function TacticalPanel({
  protocol,
  bulkhead,
  lightsOn,
  onRotate,
  zoom,
  onZoom,
  rotating,
  onToggleRotation,
}: {
  protocol: ProtocolState
  bulkhead: BulkheadPhase
  lightsOn: boolean
  onRotate: (direction: number) => void
  zoom: number
  onZoom: (value: number) => void
  rotating: boolean
  onToggleRotation: () => void
}) {
  const [section, setSection] = useState('Station Overview')
  return (
    <div className="tactical-console">
      <nav aria-label="Tactical sections">
        {['Station Overview', 'Docking Bay', 'Systems', 'Mission Log'].map(
          (item) => (
            <button
              key={item}
              aria-pressed={section === item}
              onClick={() => setSection(item)}
            >
              {item}
            </button>
          ),
        )}
      </nav>
      <div className="tactical-body">
        <section className="tactical-card">
          <h2>{section}</h2>
          {section === 'Station Overview' && (
            <>
              <h3>CRUZ DEL SUR</h3>
              <p>Observation bridge & entry airlock.</p>
              <p>
                Optional station inspection. Explore freely after restoring
                power.
              </p>
            </>
          )}
          {section === 'Docking Bay' && (
            <>
              <h3>PAMPA-07</h3>
              <p>Docking status unavailable.</p>
              <p>
                No docking telemetry or approved vessel model is connected in
                this build.
              </p>
            </>
          )}
          {section === 'Systems' && (
            <dl>
              <dt>Auxiliary power</dt>
              <dd>{lightsOn ? 'Online' : 'Offline'}</dd>
              <dt>Bridge bulkhead</dt>
              <dd>{bulkhead}</dd>
              <dt>Crew identity</dt>
              <dd>
                {protocol.completed.includes('crew')
                  ? 'Verified'
                  : 'Not verified'}
              </dd>
            </dl>
          )}
          {section === 'Mission Log' && (
            <>
              <p>
                Session objectives · {protocol.completed.length} /{' '}
                {missions.length}
              </p>
              <ul>
                {missions.map((mission) => (
                  <li key={mission.id}>
                    {protocol.completed.includes(mission.id) ? '✓' : '○'}{' '}
                    {mission.title}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <div className="tactical-model-caption">
          <span>CDS-01</span>
          <small>
            Bridge + airlock schematic
            <br />
            Provisional geometry · not a final vessel model
          </small>
        </div>
        <section className="tactical-card tactical-status">
          <h2>Station status</h2>
          <dl>
            <dt>Power</dt>
            <dd>{lightsOn ? 'Restored' : 'Emergency lighting'}</dd>
            <dt>Bulkhead</dt>
            <dd>{bulkhead}</dd>
            <dt>Protocol guidance</dt>
            <dd>{protocol.guidance}</dd>
            <dt>Communications objective</dt>
            <dd>
              {protocol.completed.includes('uplink') ? 'Completed' : 'Pending'}
            </dd>
          </dl>
          <p className="tactical-note">
            Objective completion may include Skip. This display does not confirm
            email delivery.
          </p>
        </section>
      </div>
      <div
        className="tactical-model-controls"
        role="group"
        aria-label="Hologram controls"
      >
        <button onClick={() => onRotate(-1)}>Rotate left</button>
        <button onClick={() => onRotate(1)}>Rotate right</button>
        <button aria-pressed={rotating} onClick={onToggleRotation}>
          Auto rotate
        </button>
        <label>
          Zoom{' '}
          <input
            type="range"
            min="0.65"
            max="1"
            step="0.05"
            value={zoom}
            onChange={(event) => onZoom(Number(event.target.value))}
          />
        </label>
      </div>
    </div>
  )
}
