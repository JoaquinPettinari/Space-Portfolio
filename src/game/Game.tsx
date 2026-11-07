import {
  lazy,
  Suspense,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
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
import { Computer } from './ui/Computer'
import { Loading } from './ui/Loading'
import { AmbientAudio } from './ui/AmbientAudio'
import { MissionTablet } from './ui/MissionTablet'
import { missions, type MissionId } from './missions'
import { useProtocol } from './useProtocol'
import { AuxiliarySwitch } from './world/AuxiliarySwitch'
import { CrewDossier } from './world/CrewDossier'
import { PLAYER_SPAWN_Y, PLAYER_EYE_OFFSET } from './player/jump'
import { CrewHologram } from './world/CrewHologram'
import { HologramPanel } from './ui/HologramPanel'
import { CrewIdentification } from './world/CrewIdentification'
import {
  IdentificationPanel,
  StationAssistant,
  type AssistantEvent,
} from './ui/StationAssistant'

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
}: {
  suspended?: boolean
  onPauseChange?: (paused: boolean) => void
}) {
  const [showMouseHint, setShowMouseHint] = useState(false)
  const [tabletOpen, setTabletOpen] = useState(false)
  const { state: protocol, dispatch, currentObjective } = useProtocol()
  const { completed } = protocol
  const lightsOn = completed.includes('lighting')
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
    setTabletOpen(true)
    setActive(false)
    document.exitPointerLock()
  }
  const resumeWalking = () => {
    setTabletOpen(false)
    setShowMouseHint(false)
    if (mode !== 'walking') changeMode('walking')
    captureRef.current?.()
  }
  const toggleTablet = useEffectEvent(() => {
    if (suspended || !ready || transitioning || mode !== 'walking') return
    if (tabletOpen) resumeWalking()
    else openTablet()
  })
  const pauseStation = () => {
    setTabletOpen(false)
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
    const element = event.target
    if (
      element instanceof HTMLElement &&
      element.closest('input, textarea, select, [contenteditable="true"]')
    )
      return
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
    if (event.code === 'Escape') {
      pauseStation()
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
            : tabletOpen || (mode === 'computer' && !transitioning)
              ? 'demand'
              : 'always'
        }
        onCreated={({ camera }) => camera.rotation.set(0, 0, 0)}
        camera={{
          position: [0, PLAYER_SPAWN_Y + PLAYER_EYE_OFFSET, 3.5],
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
            <Greybox emergency={!lightsOn} />
            <AuxiliarySwitch restored={lightsOn} target={target} />
            <Workstation target={target} />
            <CrewDossier target={target} />
            <Player
              active={playing}
              mode={mode}
              transitioning={transitioning}
              onRest={() => {
                setTransitioning(false)
                if (mode === 'hologram') {
                  setIdentity('scanning')
                  setScanSignal((value) => value + 1)
                }
              }}
            />
          </Physics>
          <CrewHologram
            active={mode === 'hologram' && identity === 'verified'}
          />
          {mode === 'hologram' && identity === 'scanning' && (
            <CrewIdentification
              active
              paused={suspended}
              onComplete={() => {
                setIdentity('verified')
                finishMission('crew')
                setMessage('identity')
              }}
            />
          )}
          <Interaction
            active={playing && !transitioning}
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
      {active && !transitioning && target && (
        <div className="interaction-hint" role="status">
          {target === 'lighting'
            ? lightsOn
              ? 'Auxiliary power online'
              : 'E · Restore lighting'
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
      {ready && mode === 'walking' && !tabletOpen && !showMouseHint && (
        <button
          className="quick-access-button"
          onClick={pauseStation}
          aria-label="Pause station"
        >
          Pause · Menu
        </button>
      )}
      <AmbientAudio
        suspended={suspended}
        scanSignal={scanSignal}
        scanning={identity === 'scanning' && mode === 'hologram'}
        hidden={mode !== 'walking' || active || !ready || tabletOpen}
      />
      {ready && mode === 'walking' && !tabletOpen && (
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
          {lightsOn && (
            <p>
              If you would rather skip the tutorial, go to the main computer.
              All professional records are available there.
            </p>
          )}
        </aside>
      )}
      {tabletOpen && (
        <MissionTablet
          state={protocol}
          currentObjective={currentObjective}
          onContinue={() => {
            dispatch({ type: 'continue' })
            resumeWalking()
          }}
          onSkip={() => {
            dispatch({ type: 'skip' })
            resumeWalking()
          }}
          onReplay={() => {
            dispatch({ type: 'replay' })
            resumeWalking()
          }}
          onClose={resumeWalking}
        />
      )}
      {!ready && <Loading />}
      {mode === 'hologram' && !transitioning && (
        <>
          <div className="hologram-input-shield" aria-hidden="true" />
          {identity === 'verified' ? (
            <HologramPanel
              onClose={resumeWalking}
              assistant={
                message && (
                  <StationAssistant
                    event={message}
                    onDismiss={dismissMessage}
                  />
                )
              }
            />
          ) : (
            <IdentificationPanel onClose={resumeWalking} />
          )}
        </>
      )}
      {message && ready && !tabletOpen && !suspended && mode === 'walking' && (
        <StationAssistant event={message} onDismiss={dismissMessage} />
      )}
      {mode === 'computer' && !transitioning && (
        <Computer onClose={resumeWalking} onMissionComplete={finishMission} />
      )}
    </div>
  )
}
