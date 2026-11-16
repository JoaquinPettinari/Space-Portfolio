import { useState } from 'react'
import { completedObjectiveCount, missions } from '../missions'
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
      <aside className="tactical-sidebar">
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
        <section className="tactical-card">
          <h2>{section}</h2>
          {section === 'Station Overview' && (
            <>
              <h3>CRUZ DEL SUR</h3>
              <p>Observation bridge & entry airlock.</p>
              <p>
                Optional station inspection. Explore freely after crew
                verification.
              </p>
            </>
          )}
          {section === 'Docking Bay' && (
            <>
              <h3>PAMPA-07</h3>
              <p>Docking status unavailable.</p>
              <p>External berthing telemetry offline.</p>
            </>
          )}
          {section === 'Systems' && (
            <>
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
              <p className="tactical-note">
                Objective completion may include Skip. This display does not
                confirm email delivery.
              </p>
            </>
          )}
          {section === 'Mission Log' && (
            <>
              <p>
                Session objectives ·{' '}
                {completedObjectiveCount(protocol.completed)} /{' '}
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
        <section className="tactical-card tactical-status">
          <h2>Station status</h2>
          <dl>
            <dt>Power</dt>
            <dd>{lightsOn ? 'Restored' : 'Emergency lighting'}</dd>
            <dt>Bulkhead</dt>
            <dd>{bulkhead}</dd>
          </dl>
        </section>
      </aside>
      <div className="tactical-model-caption">
        <span>CDS-01 · CRUZ DEL SUR</span>
        <small>Vessel hologram · Rotate to inspect</small>
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
