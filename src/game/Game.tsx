import { lazy, Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { GameWorld } from './GameWorld'
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
  const [identity, setIdentity] = useState<'idle' | 'scanning' | 'verified'>(
    'idle',
  )
  const [scanSignal, setScanSignal] = useState(0)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const dialogue = useDialogue({ paused: suspended })
  const { enqueue, clear } = dialogue
  const finishMission = (id: MissionId) => {
    dispatch({ type: 'activity', id })
    if (
      (id === 'archives' || id === 'diagnostics') &&
      !completed.includes('archives')
    )
      enqueue('archives')
    if (id === 'dossier') enqueue('dossier')
  }
  const controls = useStationControls({
    suspended,
    onTabletOpened: () => {
      finishMission('tablet')
      if (protocol.guidance !== 'skipped') enqueue('tablet')
    },
    onModeChange: () =>
      setIdentity(completed.includes('crew') ? 'verified' : 'idle'),
  })
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
    link.href = '/documents/joaquin-pettinari-cv.pdf'
    link.download = 'joaquin-pettinari-cv.pdf'
    document.body.append(link)
    link.click()
    link.remove()
    finishMission('dossier')
  }
  return (
    <div className="game" aria-label="Explorable 3D room">
      <Canvas
        frameloop={frameLoop}
        onCreated={({ camera }) => camera.rotation.set(0, 0, 0)}
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
        <ambientLight
          name="cabin-ambient"
          intensity={lightsOn ? 0.65 : 0.25}
          color="#9bbfe3"
        />
        <hemisphereLight args={['#a7dfff', '#16273c', lightsOn ? 1.4 : 0.45]} />
        <directionalLight
          position={[4, 8, -6]}
          color="#d0edff"
          intensity={lightsOn ? 2.4 : 0.8}
        />
        <directionalLight
          position={[-3, 4, 5]}
          color="#84b6dc"
          intensity={lightsOn ? 1.6 : 0.35}
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
              setIdentity('scanning')
              setScanSignal((v) => v + 1)
            }
          }}
          onSkipMessage={clear}
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
          onAccessiblePortfolio={onAccessiblePortfolio}
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
