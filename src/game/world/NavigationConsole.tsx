import {
  Suspense,
  useMemo,
  useRef,
  type ComponentRef,
  type RefObject,
} from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { BackSide, SRGBColorSpace } from 'three'
import { PhysicalScreen } from './PhysicalScreen'
import { TERMINAL_SCREENS, terminalHtmlScale } from '../interaction/station'
import { UNIFIED_ENVELOPE_ASSET } from './unifiedShipAssets'
import {
  CABIN_MASTER_ASSET,
  CABIN_MASTER_LEAVES_ASSET,
  assembleCurrentShip,
} from './cabinMaster'
import { GALACTIC_SKY } from './spaceScenery'
import { trapDialogFocus } from '../ui/dialogFocus'
import {
  createNavigationShip,
  navigateExterior,
  NAVIGATION_CAMERA,
  NAVIGATION_MIN_DISTANCE,
  NAVIGATION_MAX_DISTANCE,
  type NavigationAction,
} from './navigationView'
import './NavigationConsole.css'

type OrbitHandle = ComponentRef<typeof OrbitControls>

function focusReturnButton(element: HTMLButtonElement | null) {
  element?.focus({ preventScroll: true })
}

function ExteriorScene({ orbit }: { orbit: RefObject<OrbitHandle | null> }) {
  const envelope = useGLTF(UNIFIED_ENVELOPE_ASSET)
  const cabin = useGLTF(CABIN_MASTER_ASSET)
  const leaves = useGLTF(CABIN_MASTER_LEAVES_ASSET)
  const ship = useMemo(
    () =>
      createNavigationShip(
        assembleCurrentShip(envelope.scene, cabin.scene, leaves.scene),
      ),
    [envelope.scene, cabin.scene, leaves.scene],
  )
  const sky = useTexture(GALACTIC_SKY, (loaded) => {
    if (!Array.isArray(loaded)) loaded.colorSpace = SRGBColorSpace
  })
  return (
    <>
      <primitive object={ship} dispose={null} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 8, 5]} intensity={3} color="#ffe0b5" />
      <directionalLight
        position={[-4, 1, -5]}
        intensity={1.5}
        color="#79b3d9"
      />
      <mesh>
        <sphereGeometry args={[40, 32, 16]} />
        <meshBasicMaterial
          map={sky}
          side={BackSide}
          color="#778496"
          toneMapped={false}
        />
      </mesh>
      <OrbitControls
        ref={orbit}
        target={[0, 0, 0]}
        enablePan={false}
        enableDamping={false}
        minDistance={NAVIGATION_MIN_DISTANCE}
        maxDistance={NAVIGATION_MAX_DISTANCE}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
    </>
  )
}

const keys: Readonly<Record<string, NavigationAction>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  '+': 'in',
  '=': 'in',
  '-': 'out',
  Home: 'reset',
}

/** Mounted only while inspecting: an on-demand, bounded view of the cached
 * exterior asset. It cannot move the player or the actual ship in the world. */
export function NavigationConsole({ onClose }: { onClose: () => void }) {
  const orbit = useRef<OrbitHandle>(null)
  const screen = TERMINAL_SCREENS.navigation
  const move = (action: NavigationAction) => {
    if (orbit.current) navigateExterior(orbit.current, action)
  }
  return (
    <PhysicalScreen
      position={screen.position}
      distanceFactor={terminalHtmlScale('navigation')}
    >
      <section
        className="navigation-console"
        role="dialog"
        aria-modal="true"
        aria-labelledby="navigation-title"
        onKeyDown={trapDialogFocus}
      >
        <header>
          <strong id="navigation-title">EXTERIOR INSPECTION</strong>
          <span>CRUZ DEL SUR · CDS-01</span>
          <button
            ref={focusReturnButton}
            data-capture-pointer
            onClick={onClose}
          >
            Return · E / Esc
          </button>
        </header>
        <div className="navigation-body">
          <aside>
            <span className="navigation-status">EXTERNAL CAMERA</span>
            <strong>SHIP LOCKED</strong>
            <p>
              Orbit around the hull.
              <br />
              Drag to look · Scroll to zoom
            </p>
            <p>
              Keyboard: arrows · + / −<br />
              Home resets the view
            </p>
            <div className="navigation-actions">
              <button aria-label="Orbit left" onClick={() => move('left')}>
                ←
              </button>
              <button aria-label="Orbit right" onClick={() => move('right')}>
                →
              </button>
              <button aria-label="Orbit up" onClick={() => move('up')}>
                ↑
              </button>
              <button aria-label="Orbit down" onClick={() => move('down')}>
                ↓
              </button>
              <button aria-label="Zoom in" onClick={() => move('in')}>
                +
              </button>
              <button aria-label="Zoom out" onClick={() => move('out')}>
                −
              </button>
              <button onClick={() => move('reset')}>Reset view</button>
            </div>
          </aside>
          <div
            className="navigation-viewport"
            role="group"
            aria-label="Draggable exterior ship view"
            tabIndex={0}
            onKeyDown={(event) => {
              const action = keys[event.key]
              if (!action) return
              event.preventDefault()
              move(action)
            }}
          >
            <Suspense
              fallback={
                <span className="navigation-loading">
                  Acquiring exterior view…
                </span>
              }
            >
              <Canvas
                frameloop="demand"
                resize={{ offsetSize: true }}
                dpr={[1, 1.5]}
                camera={{
                  position: [...NAVIGATION_CAMERA],
                  fov: 40,
                  near: 0.1,
                  far: 80,
                }}
                gl={{ antialias: true, alpha: false }}
              >
                <ExteriorScene orbit={orbit} />
              </Canvas>
            </Suspense>
            <span className="navigation-origin" aria-hidden="true">
              FOCUS 0.0 / 0.0 / 0.0
            </span>
          </div>
        </div>
      </section>
    </PhysicalScreen>
  )
}
