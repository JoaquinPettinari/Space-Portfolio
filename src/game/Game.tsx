import { lazy, Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Greybox } from './world/Greybox'
import { Player } from './player/Player'
import { EntryMenu } from './ui/EntryMenu'

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
  const [active, setActive] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const failed = () =>
      setError('No se pudo capturar el mouse. Volvé a pulsar Entrar.')
    const blur = () => document.exitPointerLock()
    // Explicit handling also works in browsers where synthetic Escape events
    // do not invoke the browser's default Pointer Lock shortcut.
    const escape = (event: KeyboardEvent) => {
      if (event.code === 'Escape' && document.pointerLockElement) {
        document.exitPointerLock()
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
    <div className="game" aria-label="Habitación 3D explorable">
      <Canvas
        camera={{ position: [0, 1.55, 3.5], fov: 65, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        fallback={<p className="fallback">Esta experiencia necesita WebGL.</p>}
      >
        <color attach="background" args={['#171b22']} />
        <ambientLight intensity={1} />
        <directionalLight position={[2, 5, 3]} intensity={1.8} />
        <Suspense fallback={null}>
          <Physics timeStep={1 / 60} paused={!active} updatePriority={-1}>
            <Greybox />
            <Player active={active} />
          </Physics>
          <PointerLockControls
            selector="#enter-station"
            minPolarAngle={0.1}
            maxPolarAngle={Math.PI - 0.1}
            onLock={() => {
              setActive(true)
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
        SPACE PORTFOLIO / GREYBOX <span>WASD · Mouse · ESC</span>
      </div>
      {active && (
        <div className="crosshair" aria-hidden="true">
          +
        </div>
      )}
      <EntryMenu active={active} ready={ready} error={error} />
    </div>
  )
}
