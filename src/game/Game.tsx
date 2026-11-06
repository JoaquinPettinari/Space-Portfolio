import { lazy, Suspense, useEffect, useEffectEvent, useState } from 'react'
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
import { missions, completeMission, type MissionId } from './missions'
import { CrewDossier } from './world/CrewDossier'
import { PLAYER_SPAWN_Y, PLAYER_EYE_OFFSET } from './player/jump'
import { CrewHologram } from './world/CrewHologram'
import { HologramPanel } from './ui/HologramPanel'

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

export function Game() {
  const [showMouseHint, setShowMouseHint] = useState(false)
  const [tabletOpen, setTabletOpen] = useState(false)
  const [completed, setCompleted] = useState<MissionId[]>([])
  const finishMission = (id: MissionId) =>
    setCompleted((current) => completeMission(current, id))
  const [active, setActive] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<StationMode>('walking')
  const [target, setTarget] = useState<StationTarget>(null)
  const [transitioning, setTransitioning] = useState(false)
  const changeMode = (next: StationMode) => {
    setShowMouseHint(false)
    if (next === mode) return
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
  const toggleTablet = useEffectEvent(() => {
    if (!ready || transitioning || mode !== 'walking') return
    if (tabletOpen) setTabletOpen(false)
    else openTablet()
  })
  const escapeMode = useEffectEvent(() => {
    setTabletOpen(false)
    if (mode !== 'walking') changeMode('walking')
  })
  useEffect(() => {
    const failed = () =>
      setError('Could not capture the mouse. Click the scene to try again.')
    const blur = () => document.exitPointerLock()
    // Explicit handling also works in browsers where synthetic Escape events
    // do not invoke the browser's default Pointer Lock shortcut.
    const escape = (event: KeyboardEvent) => {
      if (event.code === 'KeyT' && !event.repeat) {
        event.preventDefault()
        toggleTablet()
      }
      if (event.code === 'Escape') {
        escapeMode()
        setShowMouseHint(true)
        if (document.pointerLockElement) document.exitPointerLock()
      }
    }
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
          tabletOpen || (mode === 'computer' && !transitioning)
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
        <ambientLight intensity={0.65} color="#9bbfe3" />
        <hemisphereLight args={['#a7dfff', '#16273c', 1.4]} />
        <directionalLight
          position={[4, 8, -6]}
          color="#d0edff"
          intensity={2.4}
        />
        <directionalLight
          position={[-3, 4, 5]}
          color="#84b6dc"
          intensity={1.6}
        />
        <Suspense fallback={null}>
          <Physics
            timeStep={1 / 60}
            paused={!active || mode !== 'walking' || transitioning}
            updatePriority={-1}
          >
            <Greybox emergency={!completed.includes('diagnostics')} />
            <Workstation target={target} />
            <CrewDossier target={target} />
            <Player
              active={active}
              mode={mode}
              transitioning={transitioning}
              onRest={() => {
                setTransitioning(false)
                if (mode === 'hologram') finishMission('crew')
              }}
            />
          </Physics>
          <CrewHologram active={mode === 'hologram'} />
          <Interaction
            active={active && !transitioning}
            mode={mode}
            onTarget={setTarget}
            onMode={changeMode}
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
            canCapture={mode === 'walking' && !tabletOpen && !transitioning}
            enabled={active && mode === 'walking' && !transitioning}
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
          ORBIT <span className="hud-divider">/</span> OBSERVATORY 01
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
          {target === 'computer'
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
      <AmbientAudio
        hidden={mode !== 'walking' || active || !ready || tabletOpen}
      />
      {ready && mode === 'walking' && !tabletOpen && (
        <aside className="mission-hud" aria-label="Recovery objectives">
          <p className="eyebrow">RECOVERY OPERATIONS</p>
          <strong>
            {completed.length} / {missions.length} complete
          </strong>
          <p>Complete in any order</p>
          <ul className="mission-checklist">
            {missions.map((mission) => (
              <li
                key={mission.id}
                data-complete={completed.includes(mission.id)}
              >
                <span
                  aria-label={
                    completed.includes(mission.id) ? 'Complete' : 'Available'
                  }
                >
                  {completed.includes(mission.id) ? '✓' : '☐'}
                </span>{' '}
                {mission.title}
                {mission.id === 'tablet' ? ' · T' : ''}
              </li>
            ))}
          </ul>
          <button onClick={openTablet}>Mission tablet · T</button>
        </aside>
      )}
      {tabletOpen && (
        <MissionTablet
          completed={completed}
          onClose={() => setTabletOpen(false)}
        />
      )}
      {!ready && <Loading />}
      {mode === 'hologram' && !transitioning && (
        <>
          <div className="hologram-input-shield" aria-hidden="true" />
          <HologramPanel onClose={() => changeMode('walking')} />
        </>
      )}
      {mode === 'computer' && !transitioning && (
        <Computer
          onClose={() => changeMode('walking')}
          onMissionComplete={finishMission}
        />
      )}
    </div>
  )
}
