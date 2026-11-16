import { useReducedMotionRef } from '../useReducedMotionRef'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, type Group } from 'three'
import {
  createTacticalShipModel,
  skipTacticalVisualRaycast,
} from './tacticalShipModel'
import { UNIFIED_ENVELOPE_ASSET } from './unifiedShipAssets'
import { PhysicalScreen } from './PhysicalScreen'
import { TerminalPanel } from '../ui/TerminalPanel'
import { TacticalPanel } from '../ui/TacticalPanel'
import { TERMINAL_SCREENS, terminalHtmlScale } from '../interaction/station'
import { bridgePoint } from './bridgePlacement'
import type { ProtocolState } from '../protocol'
import type { BulkheadPhase } from './bulkhead'
import {
  tacticalDisplayLayout,
  TACTICAL_MODEL_TILT,
} from './tacticalDisplayLayout'

/** A shared-asset ship miniature; the projector owns only its merged display geometry. */
export function TacticalStation({
  active,
  paused,
  protocol,
  bulkhead,
  lightsOn,
  onClose,
}: {
  active: boolean
  paused: boolean
  protocol: ProtocolState
  bulkhead: BulkheadPhase
  lightsOn: boolean
  onClose: () => void
}) {
  const model = useRef<Group>(null)
  const { scene } = useGLTF(UNIFIED_ENVELOPE_ASSET)
  const hologram = useMemo(() => createTacticalShipModel(scene), [scene])
  useEffect(() => () => hologram.dispose(), [hologram])
  const [zoom, setZoom] = useState(0.8)
  const [rotating, setRotating] = useState(true)
  const aspect = useThree((state) => state.size.width / state.size.height)
  const camera = useThree((state) => state.camera)
  const display = useMemo(
    () =>
      tacticalDisplayLayout(
        [hologram.size.x, hologram.size.y, hologram.size.z],
        aspect,
        camera instanceof PerspectiveCamera ? camera.fov : 65,
      ),
    [hologram, aspect, camera],
  )

  const invalidate = useThree((state) => state.invalidate)
  const reduced = useReducedMotionRef(invalidate)
  useFrame((_, delta) => {
    if (
      !model.current ||
      paused ||
      document.hidden ||
      reduced.current ||
      !rotating
    )
      return
    model.current.rotation.y += Math.min(delta, 0.05) * 0.18
    if (active) invalidate()
  })
  const screen = TERMINAL_SCREENS.tactical
  return (
    <>
      <group
        position={active ? screen.position : bridgePoint([0, 1.62, 0.5])}
        rotation={active ? [0, screen.rotation, 0] : [0.16, 0, 0]}
        userData={{ interaction: 'tactical' }}
      >
        <group position={active ? display.position : [0, 0, 0]}>
          <group rotation={active ? [TACTICAL_MODEL_TILT, 0, 0] : [0, 0, 0]}>
            <group
              ref={model}
              name="tactical-ship-model"
              rotation={[0, Math.PI / 2, 0]}
              scale={active ? zoom * display.scale : 0.65}
            >
              <group position={[0, -hologram.size.y / 2, 0]}>
                <group
                  raycast={skipTacticalVisualRaycast}
                  name="tactical-ship-visual"
                >
                  <mesh geometry={hologram.surface}>
                    <meshBasicMaterial
                      color="#07527c"
                      transparent
                      opacity={0.4}
                      depthWrite
                      toneMapped={false}
                    />
                  </mesh>
                  <lineSegments geometry={hologram.edges}>
                    <lineBasicMaterial
                      color="#63d9ff"
                      transparent
                      opacity={0.55}
                      depthWrite={false}
                      toneMapped={false}
                    />
                  </lineSegments>
                </group>
                <mesh
                  name="tactical-ship-interaction-proxy"
                  position={[0, hologram.size.y / 2, 0]}
                >
                  <boxGeometry
                    args={[hologram.size.x, hologram.size.y, hologram.size.z]}
                  />
                  <meshBasicMaterial visible={false} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
      {active && (
        <PhysicalScreen
          position={screen.position}
          rotation={screen.rotation}
          distanceFactor={terminalHtmlScale('tactical')}
        >
          <div className="tactical-terminal">
            <TerminalPanel physical title="Tactical Table" onClose={onClose}>
              <TacticalPanel
                protocol={protocol}
                bulkhead={bulkhead}
                lightsOn={lightsOn}
                zoom={zoom}
                rotating={rotating}
                onZoom={(value) => {
                  setZoom(value)
                  invalidate()
                }}
                onRotate={(direction) => {
                  if (model.current)
                    model.current.rotation.y += (direction * Math.PI) / 8
                  invalidate()
                }}
                onToggleRotation={() => {
                  setRotating((value) => !value)
                  invalidate()
                }}
              />
            </TerminalPanel>
          </div>
        </PhysicalScreen>
      )}
    </>
  )
}
