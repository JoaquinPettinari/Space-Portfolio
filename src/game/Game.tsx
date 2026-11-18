import { crewDossier } from '../data/documents'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { GameWorld } from './GameWorld'
import { opaqueDepthOrder } from './rendering/opaqueDepthOrder'
import { ZeroContributionLights } from './rendering/WarmLightFastPath'
import { GameHud } from './ui/GameHud'
import { useStationControls } from './useStationControls'
import { useProtocol } from './useProtocol'
import { useCoffee } from './useCoffee'
import { PLAYER_SPAWN_POSITION, PLAYER_EYE_OFFSET } from './player/jump'
import type { MissionId } from './missions'
import { useDialogue } from './useDialogue'
import { missions } from './missions'
import { StationAssistant } from './ui/StationAssistant'
import { requestBridgeAccess, type BulkheadPhase } from './world/bulkhead'
import type { IdentityPhase } from './world/identification'
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
}: {
  suspended?: boolean
  onAccessiblePortfolio?: () => void
}) {
  const protocolModel = useProtocol()
  const { state: protocol, dispatch } = protocolModel
  const { completed } = protocol
  const lightsOn = completed.includes('lighting')
  const [bulkheadPhase, setBulkheadPhase] = useState<BulkheadPhase>('closed')
  const bulkheadOpen = bulkheadPhase === 'open'
  const coffee = useCoffee(suspended)
  const [identity, setIdentity] = useState<IdentityPhase>('idle')
  const [scanSignal, setScanSignal] = useState(0)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const controls = useStationControls({
    suspended,
    onTabletOpened: () => {
      finishMission('tablet')
      if (protocol.guidance !== 'skipped') enqueue('tablet')
    },
    onModeChange: () =>
      setIdentity(completed.includes('crew') ? 'verified' : 'idle'),
  })
  const dialogue = useDialogue({
    paused: suspended || controls.showMouseHint,
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
    if (controls.ready) enqueue('arrival')
  }, [controls.ready, enqueue])
  useEffect(() => {
    if (bulkheadPhase !== 'closed') enqueue(bulkheadPhase)
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
  useEffect(() => {
    if (missions.every(({ id }) => completed.includes(id))) enqueue('complete')
  }, [completed, enqueue])
  const { mode, tabletOpen, transitioning } = controls
  let frameLoop: 'never' | 'demand' | 'always' = 'always'
  if (suspended) frameLoop = 'never'
  else if (
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
    dialogue.message && controls.ready && !suspended && subtitlesEnabled ? (
      <StationAssistant
        event={dialogue.message}
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
          far: 120,
        }}
        dpr={[1, 1.5]}
        fallback={<p className="fallback">This experience requires WebGL.</p>}
      >
        <color attach="background" args={['#030815']} />
        <ZeroContributionLights ready={controls.ready} />
        <ambientLight
          name="cabin-ambient"
          intensity={lightsOn ? 0.5 : 0.2}
          color="#dfbf94"
        />
        <hemisphereLight
          args={['#ffe0b0', '#251b16', lightsOn ? 0.85 : 0.35]}
        />
        <directionalLight
          position={[4, 8, -6]}
          color="#ffd099"
          intensity={lightsOn ? 2 : 0.7}
        />
        <directionalLight
          position={[-3, 4, 5]}
          color="#84afcd"
          intensity={lightsOn ? 0.45 : 0.2}
        />

        <GameWorld
          subtitle={null}
          controls={controls}
          protocolModel={protocolModel}
          coffee={coffee}
          suspended={suspended}
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
            enqueue('identity')
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
      <GameHud
        onAccessiblePortfolio={onAccessiblePortfolio}
        subtitlesEnabled={subtitlesEnabled}
        onToggleSubtitles={() => setSubtitlesEnabled((value) => !value)}
        controls={controls}
        protocolModel={protocolModel}
        coffee={coffee}
        suspended={suspended}
        lightsOn={lightsOn}
        bulkheadPhase={bulkheadPhase}
        identity={identity}
        scanSignal={scanSignal}
        subtitle={subtitle}
      />
    </div>
  )
}
