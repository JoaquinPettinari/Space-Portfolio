import type { StationControls } from '../useStationControls'
import type { useProtocol } from '../useProtocol'
import type { useCoffee } from '../useCoffee'
import { missions } from '../missions'
import { interactionHint } from '../interaction/hints'
import { EntryMenu } from './EntryMenu'
import { AmbientAudio } from './AmbientAudio'
import { Loading } from './Loading'
import { TerminalPanel } from './TerminalPanel'
import { PhotoInspection } from './PhotoInspection'
import type { ReactNode } from 'react'
import type { BulkheadPhase } from '../world/bulkhead'
type Props = {
  controls: StationControls
  protocolModel: ReturnType<typeof useProtocol>
  coffee: ReturnType<typeof useCoffee>
  suspended: boolean
  lightsOn: boolean
  bulkheadPhase: BulkheadPhase
  identity: 'idle' | 'scanning' | 'verified'
  scanSignal: number
  subtitle: ReactNode
}
export function GameHud({
  controls,
  protocolModel,
  coffee,
  suspended,
  lightsOn,
  bulkheadPhase,
  identity,
  scanSignal,
  subtitle,
}: Props) {
  const { state: protocol, currentObjective } = protocolModel
  const { completed } = protocol
  const {
    active,
    ready,
    error,
    mode,
    target,
    transitioning,
    tabletMode,
    tabletOpen,
    tabletRaised,
    showMouseHint,
    pauseStation,
    openTablet,
    resumeWalking,
  } = controls
  let objective = <p>Protocol complete. Enjoy your stay aboard CRUZ DEL SUR.</p>
  if (protocol.guidance === 'skipped')
    objective = <p>Free exploration · Guidance paused</p>
  else if (currentObjective)
    objective = (
      <div aria-live="polite">
        <p>
          <strong>{currentObjective.title}</strong>
        </p>
        <p>{currentObjective.action}</p>
      </div>
    )
  return (
    <>
      <div className="hud">
        <span>
          CRUZ DEL SUR <span className="hud-divider">/</span> CDS-01
        </span>
        <span>
          Move WASD · Look Mouse · Space Jump · T Tablet · To leave press ESC
        </span>
      </div>
      {active && (
        <div className="crosshair" aria-hidden="true">
          +
        </div>
      )}
      {active && !transitioning && !tabletRaised && target && (
        <div className="interaction-hint" role="status">
          {interactionHint(target, lightsOn, coffee.state.phase, bulkheadPhase)}
        </div>
      )}
      <EntryMenu
        active={
          active ||
          mode !== 'walking' ||
          tabletOpen ||
          (!showMouseHint && !error)
        }
        ready={ready && !transitioning}
        error={error}
      />
      {ready && mode === 'walking' && !tabletRaised && !showMouseHint && (
        <button
          className="quick-access-button"
          onClick={pauseStation}
          aria-label="Pause station"
        >
          Pause · Menu
        </button>
      )}
      <AmbientAudio
        coffeeSignal={coffee.state.cups}
        suspended={suspended}
        scanSignal={scanSignal}
        scanning={identity === 'scanning' && mode === 'crew'}
        hidden={mode !== 'walking' || active || !ready || tabletOpen}
      />
      {ready && mode === 'walking' && !tabletRaised && (
        <aside className="mission-hud" aria-label="Recovery objectives">
          <p className="eyebrow">RECOVERY PROTOCOL</p>
          <strong>
            {completed.length} / {missions.length} complete
          </strong>
          {objective}
          <button onClick={openTablet} disabled={transitioning}>
            Mission tablet · T
          </button>
          {coffee.state.achievement && (
            <p>Optional discovery: Zero-gravity coffee club ✓</p>
          )}
          {lightsOn && (
            <p>
              If you would rather skip the tutorial, go to the main computer.
              All professional records are available there.
            </p>
          )}
        </aside>
      )}
      {tabletMode === 'held' && !active && mode === 'walking' && (
        <button className="quick-access-button" onClick={openTablet}>
          Interact with tablet · R
        </button>
      )}
      {!ready && <Loading />}
      {((mode === 'walking' && !tabletOpen) || transitioning) && subtitle}
      {mode === 'photo' && !transitioning && (
        <TerminalPanel
          title="Project photo"
          onClose={resumeWalking}
          subtitle={subtitle}
        >
          <PhotoInspection />
        </TerminalPanel>
      )}
    </>
  )
}
