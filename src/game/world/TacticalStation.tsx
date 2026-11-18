import { useReducedMotionRef } from '../useReducedMotionRef'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import {
  createTacticalShipModel,
  skipTacticalVisualRaycast,
} from './tacticalShipModel'
import { UNIFIED_ENVELOPE_ASSET } from './unifiedShipAssets'
import {
  CABIN_MASTER_ASSET,
  CABIN_MASTER_LEAVES_ASSET,
  assembleCurrentShip,
} from './cabinMaster'
import { PhysicalScreen } from './PhysicalScreen'
import { TerminalPanel } from '../ui/TerminalPanel'
import { TacticalPanel } from '../ui/TacticalPanel'
import { TERMINAL_SCREENS, terminalHtmlScale } from '../interaction/station'
import type { ProtocolState } from '../protocol'
import type { BulkheadPhase } from './bulkhead'
import {
  TACTICAL_DEFAULT_ZOOM,
  TACTICAL_MODEL_ANCHOR,
  TACTICAL_MODEL_SCALE,
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
  const envelope = useGLTF(UNIFIED_ENVELOPE_ASSET)
  const cabin = useGLTF(CABIN_MASTER_ASSET)
  const leaves = useGLTF(CABIN_MASTER_LEAVES_ASSET)
  const hologram = useMemo(
    () =>
      createTacticalShipModel(
        assembleCurrentShip(envelope.scene, cabin.scene, leaves.scene),
      ),
    [envelope.scene, cabin.scene, leaves.scene],
  )
  useEffect(() => () => hologram.dispose(), [hologram])
  const [zoom, setZoom] = useState(TACTICAL_DEFAULT_ZOOM)
  const [rotating, setRotating] = useState(true)

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
        position={TACTICAL_MODEL_ANCHOR}
        rotation={[TACTICAL_MODEL_TILT, 0, 0]}
        userData={{ interaction: 'tactical' }}
      >
        <group
          ref={model}
          name="tactical-ship-model"
          rotation={[0, Math.PI / 2, 0]}
          scale={(zoom / TACTICAL_DEFAULT_ZOOM) * TACTICAL_MODEL_SCALE}
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
