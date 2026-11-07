import {
  lazy,
  Suspense,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Greybox } from './world/Greybox'
import { Player } from './player/Player'
import { MouseLook } from './player/MouseLook'
import { EntryMenu } from './ui/EntryMenu'
import { Workstation } from './world/Workstation'
import { Interaction } from './interaction/Interaction'
import type { StationMode, StationTarget } from './interaction/station'
import { ArchiveScreen } from './world/ArchiveScreen'
import { PhysicalTerminal } from './world/PhysicalTerminal'
import { Loading } from './ui/Loading'
import { AmbientAudio } from './ui/AmbientAudio'
import { HandheldTablet } from './world/HandheldTablet'
import { tabletTransition, type TabletMode } from './tablet'
import { missions, type MissionId } from './missions'
import { useProtocol } from './useProtocol'
import { AuxiliarySwitch } from './world/AuxiliarySwitch'
import { CrewDossier } from './world/CrewDossier'
import { PLAYER_SPAWN_POSITION, PLAYER_EYE_OFFSET } from './player/jump'
import { CrewAccess } from './world/CrewAccess'
import { CrewIdentity } from './ui/CrewIdentity'
import { RearWorkstation } from './world/RearWorkstation'
import { TerminalPanel } from './ui/TerminalPanel'
import { ContactForm } from '../contact/ContactForm'
import { PersonalDesktop } from '../workstation/PersonalDesktop'
import { useCoffee } from './useCoffee'
import { CoffeeMachine } from './world/CoffeeMachine'
import { ProjectPhoto } from './world/ProjectPhoto'
import { PhotoInspection } from './ui/PhotoInspection'
import { StationAssistant, type AssistantEvent } from './ui/StationAssistant'

const Diagnostics = import.meta.env.DEV
  ? lazy(() =>
      import('./debug/GameDiagnostics').then(({ GameDiagnostics }) => ({
        default: GameDiagnostics,
      })),
    )
  : null

function Ready({ onReady }: { onReady: (ready: boolean) => void }) {
  useEffect(() => {
    onReady(true)
    return () => onReady(false)
  }, [onReady])
  return null
}

export function Game({
  suspended = false,
  onPauseChange,
  archiveRef,
  onAccessiblePortfolio,
}: {
  suspended?: boolean
  onPauseChange?: (paused: boolean) => void
  archiveRef?: Ref<{ openArchive: () => void }>
  onAccessiblePortfolio?: () => void
}) {
  const [showMouseHint, setShowMouseHint] = useState(false)
  const coffee = useCoffee(suspended)
  const [tabletMode, setTabletMode] = useState<TabletMode>('lowered')
  const tabletOpen = tabletMode === 'focused'
  const tabletRaised = tabletMode !== 'lowered'
  const { state: protocol, dispatch, currentObjective } = useProtocol()
  const { completed } = protocol
  const lightsOn = completed.includes('lighting')
  const [bulkheadOpen, setBulkheadOpen] = useState(lightsOn)
  const [message, setMessage] = useState<AssistantEvent | null>(() =>
    lightsOn ? null : 'arrival',
  )
  const [identity, setIdentity] = useState<'idle' | 'scanning' | 'verified'>(
    'idle',
  )
  const [scanSignal, setScanSignal] = useState(0)
  const finishMission = (id: MissionId) => {
    dispatch({ type: 'activity', id })
    if (
      (id === 'archives' || id === 'diagnostics') &&
      !completed.includes('archives')
    )
      setMessage('archives')
  }
  const [active, setActive] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<StationMode>('walking')
  const [target, setTarget] = useState<StationTarget>(null)
  const [transitioning, setTransitioning] = useState(false)
  const captureRef = useRef<(() => void) | null>(null)
  const playing = active && !suspended
  useEffect(() => {
    onPauseChange?.(
      !active &&
        !tabletOpen &&
        mode === 'walking' &&
        (showMouseHint || !!error),
    )
  }, [active, tabletOpen, mode, showMouseHint, error, onPauseChange])
  useEffect(() => {
    if (suspended && document.pointerLockElement) document.exitPointerLock()
  }, [suspended])
  const changeMode = (next: StationMode) => {
    setTabletMode('lowered')
    setShowMouseHint(false)
    if (next === mode) return
    setIdentity('idle')
    setTarget(null)
    setTransitioning(true)
    setMode(next)
    if (next !== 'walking') {
      setActive(false)
      document.exitPointerLock()
    }
  }
  const openTablet = () => {
    finishMission('tablet')
    setShowMouseHint(false)
    setTabletMode('focused')
    setActive(false)
    document.exitPointerLock()
  }
  const resumeWalking = () => {
    setTabletMode('lowered')
    setShowMouseHint(false)
    if (mode !== 'walking') changeMode('walking')
    captureRef.current?.()
  }
  useImperativeHandle(archiveRef, () => ({
    openArchive: () => {
      setTabletMode('lowered')
      changeMode('computer')
    },
  }))
  const toggleTablet = useEffectEvent(() => {
    if (suspended || !ready || transitioning || mode !== 'walking') return
    if (tabletMode === 'lowered') finishMission('tablet')
    setTabletMode(tabletTransition(tabletMode, 'toggle'))
    if (tabletOpen) captureRef.current?.()
  })
  const walkWithTablet = () => {
    setTabletMode(tabletTransition(tabletMode, 'resume'))
    setShowMouseHint(false)
    captureRef.current?.()
  }
  const pauseStation = () => {
    setTabletMode('lowered')
    if (mode !== 'walking') changeMode('walking')
    setShowMouseHint(true)
    if (document.pointerLockElement) document.exitPointerLock()
  }
  const dismissMessage = () => {
    document
      .querySelector<HTMLElement>('[role="dialog"] [data-capture-pointer]')
      ?.focus()
    setMessage(null)
  }
  const keyboard = useEffectEvent((event: KeyboardEvent) => {
    if (suspended || event.defaultPrevented) return
    if (event.code === 'Escape') {
      pauseStation()
      return
    }
    const element = event.target
    if (
      element instanceof HTMLElement &&
      element.closest('input, textarea, select, [contenteditable="true"]')
    )
      return
    if (
      event.code === 'KeyR' &&
      !event.repeat &&
      ready &&
      !transitioning &&
      mode === 'walking' &&
      tabletRaised
    ) {
      event.preventDefault()
      if (tabletOpen) walkWithTablet()
      else openTablet()
    }
    if (
      event.code === 'KeyT' &&
      !event.repeat &&
      ready &&
      !transitioning &&
      mode === 'walking'
    ) {
      event.preventDefault()
      toggleTablet()
    }
    if (
      event.code === 'KeyE' &&
      !event.repeat &&
      ready &&
      !transitioning &&
      mode !== 'walking'
    ) {
      event.preventDefault()
      resumeWalking()
    }
  })
  useEffect(() => {
    const failed = () =>
      setError('Could not capture the mouse. Click the scene to try again.')
    const blur = () => document.exitPointerLock()
    // Explicit handling also works in browsers where synthetic Escape events
    // do not invoke the browser's default Pointer Lock shortcut.
    const escape = (event: KeyboardEvent) => keyboard(event)
    document.addEventListener('pointerlockerror', failed)
    window.addEventListener('blur', blur)
    window.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerlockerror', failed)
      window.removeEventListener('blur', blur)
      window.removeEventListener('keydown', escape)
    }
  }, [])

  return (
    <div className="game" aria-label="Explorable 3D room">
      <Canvas
        frameloop={
          suspended
            ? 'never'
            : tabletOpen ||
                (mode !== 'walking' && mode !== 'crew' && !transitioning)
              ? 'demand'
              : 'always'
        }
        onCreated={({ camera }) => camera.rotation.set(0, 0.35, 0)}
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
        <Suspense fallback={null}>
          <Physics
            timeStep={1 / 60}
            paused={!playing || mode !== 'walking' || transitioning}
            updatePriority={-1}
          >
            <Greybox emergency={!lightsOn} bulkheadOpen={bulkheadOpen} />
            <AuxiliarySwitch restored={lightsOn} target={target} />
            <AuxiliarySwitch
              restored={lightsOn}
              target={target}
              position={[-1.4, 1.65, 6.1]}
              rotation={Math.PI / 2}
            />
            <Workstation target={target} />
            <CrewDossier target={target} />
            <CoffeeMachine state={coffee.state} target={target} />
            <ProjectPhoto />
            <CrewAccess
              scanning={mode === 'crew' && identity === 'scanning'}
              paused={suspended}
              verified={completed.includes('crew')}
              onComplete={() => {
                setIdentity('verified')
                finishMission('crew')
              }}
            />
            <RearWorkstation target={target} />
            <Player
              active={playing}
              mode={mode}
              transitioning={transitioning}
              onRest={() => {
                setTransitioning(false)
                if (mode === 'crew') {
                  setIdentity('scanning')
                  setScanSignal((value) => value + 1)
                }
              }}
            />
          </Physics>
          {mode === 'crew' && !transitioning && (
            <PhysicalTerminal kind="crew" onClose={resumeWalking}>
              <CrewIdentity verified={identity === 'verified'} />
            </PhysicalTerminal>
          )}
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
              setMessage(null)
              walkWithTablet()
            }}
            onReplay={() => {
              dispatch({ type: 'replay' })
              walkWithTablet()
            }}
            onClose={resumeWalking}
            onResume={walkWithTablet}
          />
          {mode === 'communications' && !transitioning && (
            <PhysicalTerminal
              kind="communications"
              onClose={resumeWalking}
              onAccessiblePortfolio={onAccessiblePortfolio}
            >
              <ContactForm
                onComplete={(outcome) =>
                  dispatch({ type: 'transmission', outcome })
                }
              />
            </PhysicalTerminal>
          )}
          {mode === 'personal' && !transitioning && (
            <PhysicalTerminal
              kind="personal"
              onClose={resumeWalking}
              onAccessiblePortfolio={onAccessiblePortfolio}
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
              onAccessiblePortfolio={onAccessiblePortfolio}
            />
          )}
          <Interaction
            onBulkhead={() => {
              if (lightsOn) setBulkheadOpen(true)
            }}
            onCoffee={() => coffee.dispatch('interact')}
            active={playing && !transitioning && !tabletRaised}
            mode={mode}
            onTarget={setTarget}
            onMode={changeMode}
            onLighting={() => {
              finishMission('lighting')
              if (!lightsOn) setMessage('restored')
            }}
            onDossier={() => {
              const link = document.createElement('a')
              link.href = '/documents/joaquin-pettinari-cv.pdf'
              link.download = 'joaquin-pettinari-cv.pdf'
              document.body.append(link)
              link.click()
              link.remove()
              finishMission('dossier')
            }}
          />
          <MouseLook
            captureRef={captureRef}
            canCapture={
              !suspended && mode === 'walking' && !tabletOpen && !transitioning
            }
            enabled={playing && mode === 'walking' && !transitioning}
            onLock={() => {
              setActive(true)
              setShowMouseHint(false)
              setError('')
            }}
            onUnlock={() => setActive(false)}
          />
          <Ready onReady={setReady} />
        </Suspense>
        {Diagnostics && (
          <Suspense fallback={null}>
            <Diagnostics />
          </Suspense>
        )}
      </Canvas>
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
          {target === 'crew'
            ? 'E · Crew Access'
            : target === 'bulkhead'
              ? lightsOn
                ? 'E · Open bulkhead'
                : 'Restore auxiliary power first'
              : target === 'coffee'
                ? coffee.state.phase === 'brewing'
                  ? 'Coffee brewing…'
                  : coffee.state.phase === 'ready'
                    ? 'E · Drink coffee'
                    : 'E · Brew coffee'
                : target === 'photo'
                  ? 'E · Inspect project photo'
                  : target === 'lighting'
                    ? lightsOn
                      ? 'Auxiliary power online'
                      : 'E · Restore lighting'
                    : target === 'personal'
                      ? 'E · Personal Workstation'
                      : target === 'communications'
                        ? 'E · Earth Communications'
                        : target === 'computer'
                          ? 'E · Use computer'
                          : target === 'hologram'
                            ? 'E · Activate crew hologram'
                            : 'E · Download crew dossier (CV / PDF)'}
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
          {protocol.guidance === 'skipped' ? (
            <p>Free exploration · Guidance paused</p>
          ) : currentObjective ? (
            <div aria-live="polite">
              <p>
                <strong>{currentObjective.title}</strong>
              </p>
              <p>{currentObjective.action}</p>
            </div>
          ) : (
            <p>Protocol complete. Enjoy your stay aboard CRUZ DEL SUR.</p>
          )}
          <button onClick={openTablet}>Mission tablet · T</button>
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
      {message &&
        ready &&
        !tabletRaised &&
        !suspended &&
        mode === 'walking' && (
          <StationAssistant event={message} onDismiss={dismissMessage} />
        )}
      {mode === 'photo' && !transitioning && (
        <TerminalPanel title="Project photo" onClose={resumeWalking}>
          <PhotoInspection />
        </TerminalPanel>
      )}
    </div>
  )
}
