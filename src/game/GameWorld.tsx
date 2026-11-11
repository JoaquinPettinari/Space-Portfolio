import { Suspense, useEffect, type ReactNode } from 'react'
import { Physics } from '@react-three/rapier'
import { Greybox } from './world/Greybox'
import { DockingHatch } from './world/DockingHatch'
import { Player } from './player/Player'
import { MouseLook } from './player/MouseLook'
import { Workstation } from './world/Workstation'
import { Interaction } from './interaction/Interaction'
import { ArchiveScreen } from './world/ArchiveScreen'
import { TacticalStation } from './world/TacticalStation'
import { PhysicalTerminal } from './world/PhysicalTerminal'
import { HandheldTablet } from './world/HandheldTablet'
import type { useProtocol } from './useProtocol'
import { CrewDossier } from './world/CrewDossier'
import { CrewAccess } from './world/CrewAccess'
import { CrewIdentity } from './ui/CrewIdentity'
import { RearWorkstation } from './world/RearWorkstation'
import { ContactForm } from '../contact/ContactForm'
import { PersonalDesktop } from '../workstation/PersonalDesktop'
import type { useCoffee } from './useCoffee'
import { CoffeeMachine } from './world/CoffeeMachine'
import { ProjectPhoto } from './world/ProjectPhoto'
import type { StationControls } from './useStationControls'
import type { MissionId } from './missions'
import type { BulkheadPhase } from './world/bulkhead'

function Ready({ onReady }: { onReady: (ready: boolean) => void }) {
  useEffect(() => {
    onReady(true)
    return () => onReady(false)
  }, [onReady])
  return null
}
type Props = {
  subtitle: ReactNode
  controls: StationControls
  protocolModel: ReturnType<typeof useProtocol>
  coffee: ReturnType<typeof useCoffee>
  suspended: boolean
  lightsOn: boolean
  bulkheadPhase: BulkheadPhase
  onBulkheadPhaseChange: (phase: BulkheadPhase) => void
  identity: 'idle' | 'scanning' | 'verified'
  finishMission: (id: MissionId) => void
  onIdentityVerified: () => void
  onCameraRest: () => void
  onSkipMessage: () => void
  onBulkhead: () => void
  onDossier: () => void
  onTransmission: (outcome: 'accepted' | 'skipped') => void
  onAccessiblePortfolio?: () => void
}
export function GameWorld({
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
  onCameraRest,
  onSkipMessage,
  onBulkhead,
  onDossier,
  onTransmission,
  onAccessiblePortfolio,
}: Props) {
  const { state: protocol, dispatch, currentObjective } = protocolModel
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
    walkWithTablet,
  } = controls
  return (
    <Suspense fallback={null}>
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
          emergency={!lightsOn}
          bulkheadPhase={bulkheadPhase}
          onBulkheadPhaseChange={onBulkheadPhaseChange}
        />
        <DockingHatch />
        <Workstation target={target} />
        <CrewDossier target={target} />
        <CoffeeMachine state={coffee.state} target={target} />
        <ProjectPhoto />
        <CrewAccess
          scanning={mode === 'crew' && identity === 'scanning'}
          paused={suspended}
          verified={completed.includes('crew')}
          onComplete={onIdentityVerified}
        />
        <RearWorkstation target={target} />
        <Player
          active={playing}
          mode={mode}
          transitioning={transitioning}
          onRest={onCameraRest}
        />
      </Physics>
      {mode === 'crew' && !transitioning && (
        <PhysicalTerminal
          kind="crew"
          onClose={resumeWalking}
          subtitle={subtitle}
        >
          <CrewIdentity verified={identity === 'verified'} />
        </PhysicalTerminal>
      )}
      <TacticalStation
        active={mode === 'tactical' && !transitioning}
        paused={suspended || (mode !== 'walking' && mode !== 'tactical')}
        protocol={protocol}
        bulkhead={bulkheadPhase}
        lightsOn={lightsOn}
        onClose={resumeWalking}
      />
      <HandheldTablet
        mode={mode === 'walking' ? tabletMode : 'lowered'}
        state={protocol}
        currentObjective={currentObjective}
        onContinue={() => {
          dispatch({ type: 'continue' })
          walkWithTablet()
        }}
        onSkip={() => {
          dispatch({ type: 'skip' })
          onSkipMessage()
          walkWithTablet()
        }}
        onReplay={() => {
          dispatch({ type: 'replay' })
          walkWithTablet()
        }}
        onClose={resumeWalking}
        onResume={walkWithTablet}
        onOpenArchive={controls.openArchive}
        onAccessiblePortfolio={onAccessiblePortfolio}
        subtitle={subtitle}
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
      {mode === 'computer' && !transitioning && (
        <ArchiveScreen
          onClose={resumeWalking}
          onMissionComplete={finishMission}
          subtitle={subtitle}
        />
      )}
      <Interaction
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
      <Ready onReady={setReady} />
    </Suspense>
  )
}
