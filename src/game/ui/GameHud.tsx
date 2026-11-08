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
import './GameHud.css'
import { HudControls } from './HudControls'
import { Compass } from 'lucide-react'

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
      <div className="hud-brand">
        <div className="hud-brand__icon">
          <Compass size={44} strokeWidth={1.5} />
        </div>

        <div className="hud-brand__divider" />

        <div className="hud-brand__text">
          <span className="hud-brand__title">CRUZ DEL SUR</span>
          <span className="hud-brand__subtitle">PAMPA-07</span>
        </div>
      </div>
      {ready && mode === 'walking' && !tabletRaised && <HudControls />}
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
      <AmbientAudio
        coffeeSignal={coffee.state.cups}
        suspended={suspended}
        scanSignal={scanSignal}
        scanning={identity === 'scanning' && mode === 'crew'}
        hidden={mode !== 'walking' || active || !ready || tabletOpen}
      />
      {ready && mode === 'walking' && !tabletRaised && (
        <aside className="mission-hud" aria-label="Recovery objectives">
          <p className="eyebrow">CURRENT OBJECTIVE</p>

          <strong>
            {completed.length} / {missions.length} complete
          </strong>

          <div className="mission-hud-content">{objective}</div>

          <button onClick={openTablet} disabled={transitioning}>
            Mission tablet · T
          </button>
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
