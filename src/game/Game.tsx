import { EXTERIOR_CAMERA_FAR } from './world/asterionModel'
import { crewDossier } from '../data/documents'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { GameWorld } from './GameWorld'
import { opaqueDepthOrder } from './rendering/opaqueDepthOrder'
import { GameHud } from './ui/GameHud'
import { useStationControls } from './useStationControls'
import { useProtocol } from './useProtocol'
import { useCoffee } from './useCoffee'
import { PLAYER_SPAWN_POSITION, PLAYER_EYE_OFFSET } from './player/jump'
import type { MissionId } from './missions'
import { useDialogue } from './useDialogue'
import { PassageDialogueCheckpoint } from './world/PassageDialogueCheckpoint'
import { StationAssistant } from './ui/StationAssistant'
import { requestBridgeAccess, type BulkheadPhase } from './world/bulkhead'
import type { IdentityPhase } from './world/identification'
import { claimArrivalWelcome } from './intro/useDockingIntro'
const Diagnostics = import.meta.env.DEV
  ? lazy(() =>
      import('./debug/GameDiagnostics').then(({ GameDiagnostics }) => ({
        default: GameDiagnostics,
      })),
    )
  : null

export function Game({
  suspended = false,
  onAccessiblePortfolio,
  introComplete = true,
  introRevealing = false,
  prepareInterior = true,
  onInteriorReady,
}: {
  suspended?: boolean
  onAccessiblePortfolio?: () => void
  introComplete?: boolean
  introRevealing?: boolean
  prepareInterior?: boolean
  onInteriorReady?: (ready: boolean) => void
}) {
  const gameplaySuspended = suspended || !introComplete
  const protocolModel = useProtocol()
  const { state: protocol, dispatch } = protocolModel
  const { completed } = protocol
  const lightsOn = completed.includes('lighting')
  const [bulkheadPhase, setBulkheadPhase] = useState<BulkheadPhase>('closed')
  const bulkheadOpen = bulkheadPhase === 'open'
  const coffee = useCoffee(gameplaySuspended)
  const [identity, setIdentity] = useState<IdentityPhase>('idle')
  const [scanSignal, setScanSignal] = useState(0)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const controls = useStationControls({
    suspended: gameplaySuspended,
    onTabletOpened: () => {
      finishMission('tablet')
      if (protocol.guidance !== 'skipped') enqueue('tablet')
    },
    onModeChange: () =>
      setIdentity(completed.includes('crew') ? 'verified' : 'idle'),
  })
  const dialogue = useDialogue({
    paused: gameplaySuspended || controls.showMouseHint,
    soundEnabled,
  })
  const { enqueue } = dialogue
  const finishMission = (id: MissionId) => {
    dispatch({ type: 'activity', id })
    if (
      (id === 'archives' || id === 'diagnostics') &&
      !completed.includes('archives')
    )
      enqueue('archives')
    if (id === 'dossier') enqueue('dossier')
  }
  useEffect(() => {
    onInteriorReady?.(controls.ready)
  }, [controls.ready, onInteriorReady])
  useEffect(() => {
    if (introComplete && controls.ready && claimArrivalWelcome())
      enqueue('arrival')
  }, [introComplete, controls.ready, enqueue])
  useEffect(() => {
    if (
      bulkheadPhase === 'open' &&
      !completed.includes('tablet') &&
      protocol.guidance !== 'skipped'
    )
      enqueue('tabletPrompt')
  }, [bulkheadPhase, completed, protocol.guidance, enqueue])
  useEffect(() => {
    if (controls.mode === 'communications' && !controls.transitioning)
      enqueue('communications')
  }, [controls.mode, controls.transitioning, enqueue])
  // Completion voice remains disabled until the actual relay-repair story exists.
  // The current optional four-objective tracker is not proof of restored comms.
  const { mode, tabletOpen, transitioning } = controls
  let frameLoop: 'never' | 'demand' | 'always' = 'always'
  // Scene mounting/downloads continue without frames. Reserve the GPU for the
  // movie until its fade completes, then prepare behind opaque black.
  if (
    !prepareInterior ||
    suspended ||
    (!introComplete && !introRevealing && controls.ready)
  )
    frameLoop = 'never'
  else if (
    (introComplete && controls.showMouseHint && !transitioning) ||
    tabletOpen ||
    (mode !== 'walking' && mode !== 'crew' && !transitioning)
  )
    frameLoop = 'demand'
  const dismissMessage = () => {
    document
      .querySelector<HTMLElement>(
        '[role="dialog"] [data-capture-pointer], .mission-tablet header button',
      )
      ?.focus()
    dialogue.dismiss()
  }
  const subtitle =
    dialogue.message &&
    controls.ready &&
    !gameplaySuspended &&
    subtitlesEnabled ? (
      <StationAssistant
        event={dialogue.message}
        speaking={dialogue.speaking}
        caption={dialogue.caption}
        onDismiss={dismissMessage}
        dismissible={mode === 'walking' && !tabletOpen}
      />
    ) : null
  const downloadDossier = () => {
    const link = document.createElement('a')
    link.href = crewDossier.href
    link.download = crewDossier.filename
    document.body.append(link)
    link.click()
    link.remove()
    finishMission('dossier')
  }
  return (
    <div className="game" aria-label="Explorable 3D room">
      <Canvas
        frameloop={frameLoop}
        onCreated={({ camera, gl }) => {
          camera.rotation.set(0, 0, 0)
          gl.setOpaqueSort(opaqueDepthOrder)
        }}
        camera={{
          position: [
            PLAYER_SPAWN_POSITION[0],
            PLAYER_SPAWN_POSITION[1] + PLAYER_EYE_OFFSET,
            PLAYER_SPAWN_POSITION[2],
          ],
          fov: 65,
          near: 0.1,
          far: EXTERIOR_CAMERA_FAR,
        }}
        dpr={[1, 1.5]}
        fallback={<p className="fallback">This experience requires WebGL.</p>}
      >
        <color attach="background" args={['#030815']} />
        {/* Neutral indirect fill preserves photo/metal colors; local practicals
            provide the warmth instead of tinting every surface amber. */}
        <ambientLight
          name="cabin-ambient"
          intensity={lightsOn ? 0.38 : 0.2}
          color="#c7d5e0"
        />
        <hemisphereLight args={['#d4ddec', '#30271f', lightsOn ? 0.7 : 0.35]} />
        <directionalLight
          position={[4, 8, -6]}
          color="#ffe0ba"
          intensity={lightsOn ? 1.6 : 0.7}
        />
        <directionalLight
          position={[-3, 4, 5]}
          color="#9cc9e8"
          intensity={lightsOn ? 0.65 : 0.2}
        />

        <GameWorld
          prepareInterior={prepareInterior}
          subtitle={null}
          controls={controls}
          protocolModel={protocolModel}
          coffee={coffee}
          suspended={gameplaySuspended}
          lightsOn={lightsOn}
          bulkheadPhase={bulkheadPhase}
          onBulkheadPhaseChange={setBulkheadPhase}
          identity={identity}
          onIdentityContact={() => {
            setIdentity('scanning')
            setScanSignal((v) => v + 1)
          }}
          finishMission={finishMission}
          onIdentityVerified={() => {
            setBulkheadPhase((phase) => requestBridgeAccess(phase, true))
            setIdentity('verified')
            finishMission('crew')
            enqueue('crewVerified')
          }}
          onCameraRest={() => {
            controls.setTransitioning(false)
            if (mode === 'crew' && !completed.includes('crew')) {
              setIdentity('presenting')
            }
          }}
          onTransmission={(outcome) => {
            dispatch({ type: 'transmission', outcome })
            enqueue(
              outcome === 'accepted'
                ? 'transmissionAccepted'
                : 'transmissionSkipped',
            )
          }}
          onBulkhead={() => {
            setBulkheadPhase((phase) =>
              requestBridgeAccess(phase, completed.includes('crew')),
            )
          }}
          onDossier={downloadDossier}
        />
        <PassageDialogueCheckpoint
          active={
            controls.playing &&
            mode === 'walking' &&
            !transitioning &&
            !suspended
          }
          onCross={() => enqueue('bridgeIntroduction')}
        />
        {Diagnostics && (
          <Suspense fallback={null}>
            <Diagnostics
              session={{
                protocol,
                coffee: coffee.state,
                bulkheadOpen,
                bulkheadPhase,
                identity,
              }}
            />
          </Suspense>
        )}
      </Canvas>
      <div hidden={!introComplete} inert={!introComplete}>
        <GameHud
          onAccessiblePortfolio={onAccessiblePortfolio}
          subtitlesEnabled={subtitlesEnabled}
          onToggleSubtitles={() => setSubtitlesEnabled((value) => !value)}
          onSoundChange={setSoundEnabled}
          controls={controls}
          protocolModel={protocolModel}
          coffee={coffee}
          suspended={gameplaySuspended}
          lightsOn={lightsOn}
          bulkheadPhase={bulkheadPhase}
          identity={identity}
          scanSignal={scanSignal}
          subtitle={subtitle}
        />
      </div>
    </div>
  )
}
