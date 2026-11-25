import { Suspense, useRef, type ReactNode } from 'react'
import { InteriorReady } from './intro/InteriorReady'
import { Physics } from '@react-three/rapier'
import { Greybox } from './world/Greybox'
import { DockingHatch } from './world/DockingHatch'
import { Player } from './player/Player'
import { MouseLook } from './player/MouseLook'
import { Workstation } from './world/Workstation'
import { StationHighlights } from './world/StationHighlights'
import { Interaction } from './interaction/Interaction'
import { ArchiveScreen } from './world/ArchiveScreen'
import { TacticalStation } from './world/TacticalStation'
import { PhysicalTerminal } from './world/PhysicalTerminal'
import { HandheldTablet } from './world/HandheldTablet'
import type { useProtocol } from './useProtocol'
import { CrewAccess } from './world/CrewAccess'
import { CrewIdentity } from './ui/CrewIdentity'
import { RearWorkstation } from './world/RearWorkstation'
import { ContactForm } from '../contact/ContactForm'
import { PersonalDesktop } from '../workstation/PersonalDesktop'
import { RecreationDesktop } from '../workstation/RecreationDesktop'
import type { useCoffee } from './useCoffee'
import { CoffeeMachine } from './world/CoffeeMachine'
import { ShipRadio, type ShipRadioHandle } from './world/ShipRadio'
import { NavigationConsole } from './world/NavigationConsole'
import { ZeroContributionLights } from './rendering/WarmLightFastPath'
import type { StationControls } from './useStationControls'
import type { MissionId } from './missions'
import type { BulkheadPhase } from './world/bulkhead'
import type { IdentityPhase } from './world/identification'

type Props = {
  prepareInterior: boolean
  subtitle: ReactNode
  controls: StationControls
  protocolModel: ReturnType<typeof useProtocol>
  coffee: ReturnType<typeof useCoffee>
  suspended: boolean
  lightsOn: boolean
  bulkheadPhase: BulkheadPhase
  onBulkheadPhaseChange: (phase: BulkheadPhase) => void
  identity: IdentityPhase
  onIdentityContact: () => void
  finishMission: (id: MissionId) => void
  onIdentityVerified: () => void
  onCameraRest: () => void
  onBulkhead: () => void
  onDossier: () => void
  onTransmission: (outcome: 'accepted' | 'skipped') => void
}
export function GameWorld({
  prepareInterior,
  subtitle,
  controls,
  protocolModel,
  coffee,
  suspended,
  lightsOn,
  bulkheadPhase,
  onBulkheadPhaseChange,
  identity,
  finishMission,
  onIdentityVerified,
  onIdentityContact,
  onCameraRest,
  onBulkhead,
  onDossier,
  onTransmission,
}: Props) {
  const radio = useRef<ShipRadioHandle>(null)
  const { state: protocol, currentObjective } = protocolModel
  const { completed } = protocol
  const {
    playing,
    mode,
    target,
    transitioning,
    tabletMode,
    tabletOpen,
    tabletRaised,
    captureRef,
    setReady,
    setTarget,
    changeMode,
    resumeWalking,
  } = controls
  return (
    <Suspense fallback={null}>
      {playing &&
        !suspended &&
        mode === 'walking' &&
        !transitioning &&
        !tabletRaised && (
          <StationHighlights target={target} objective={currentObjective?.id} />
        )}
      <Physics
        timeStep={1 / 60}
        paused={
          suspended ||
          ((!playing || mode !== 'walking' || transitioning) &&
            !(
              mode === 'crew' &&
              identity === 'verified' &&
              (bulkheadPhase === 'unlocking' || bulkheadPhase === 'opening')
            ))
        }
        updatePriority={-1}
      >
        <Greybox
          exteriorPaused={suspended || controls.showMouseHint}
          prepareInterior={prepareInterior}
          emergency={!lightsOn}
          bulkheadPhase={bulkheadPhase}
          onBulkheadPhaseChange={onBulkheadPhaseChange}
        />
        <DockingHatch />
        <Workstation target={target} />
        <CoffeeMachine state={coffee.state} target={target} />
        <CrewAccess
          presenting={mode === 'crew' && identity === 'presenting'}
          scanning={mode === 'crew' && identity === 'scanning'}
          paused={suspended || transitioning}
          verified={completed.includes('crew')}
          onComplete={onIdentityVerified}
          onContact={onIdentityContact}
        />
        <RearWorkstation target={target} />
        <Player
          active={playing}
          mode={mode}
          transitioning={transitioning}
          onRest={onCameraRest}
        />
        <InteriorReady active={prepareInterior} onReady={setReady} />
      </Physics>
      {mode === 'crew' && !transitioning && (
        <PhysicalTerminal
          kind="crew"
          onClose={resumeWalking}
          subtitle={subtitle}
        >
          <CrewIdentity
            verified={identity === 'verified'}
            scanning={identity === 'scanning'}
          />
        </PhysicalTerminal>
      )}
      <TacticalStation
        onDiagnostics={() => finishMission('tactical')}
        active={mode === 'tactical' && !transitioning}
        paused={suspended || (mode !== 'walking' && mode !== 'tactical')}
        protocol={protocol}
        onClose={resumeWalking}
      />
      <ShipRadio
        ref={radio}
        target={target}
        paused={suspended || controls.showMouseHint}
      />
      {mode === 'navigation' && !transitioning && (
        <NavigationConsole onClose={resumeWalking} />
      )}
      <HandheldTablet
        mode={mode === 'walking' ? tabletMode : 'lowered'}
        state={protocol}
        currentObjective={currentObjective}
      />
      {mode === 'communications' && !transitioning && (
        <PhysicalTerminal
          kind="communications"
          onClose={resumeWalking}
          subtitle={subtitle}
        >
          <ContactForm onComplete={onTransmission} />
        </PhysicalTerminal>
      )}
      {mode === 'personal' && !transitioning && (
        <PhysicalTerminal
          kind="personal"
          onClose={resumeWalking}
          subtitle={subtitle}
        >
          <PersonalDesktop
            onDossier={() => finishMission('dossier')}
            onBrewCoffee={() => coffee.dispatch('brew')}
          />
        </PhysicalTerminal>
      )}
      {mode === 'arcade' && !transitioning && (
        <PhysicalTerminal
          kind="arcade"
          onClose={resumeWalking}
          subtitle={subtitle}
        >
          <RecreationDesktop onBrewCoffee={() => coffee.dispatch('brew')} />
        </PhysicalTerminal>
      )}
      {mode === 'computer' && !transitioning && (
        <ArchiveScreen
          onClose={resumeWalking}
          onMissionComplete={finishMission}
          subtitle={subtitle}
        />
      )}
      <Interaction
        onRadio={(action) => radio.current?.press(action)}
        onBulkhead={onBulkhead}
        onCoffee={() => coffee.dispatch('interact')}
        active={playing && !transitioning && !tabletRaised}
        mode={mode}
        onTarget={setTarget}
        onMode={changeMode}
        onDossier={onDossier}
      />
      <MouseLook
        captureRef={captureRef}
        canCapture={
          !suspended && mode === 'walking' && !tabletOpen && !transitioning
        }
        enabled={playing && mode === 'walking' && !transitioning}
        onLock={controls.onLock}
        onUnlock={controls.onUnlock}
      />
      <ZeroContributionLights />
    </Suspense>
  )
}
