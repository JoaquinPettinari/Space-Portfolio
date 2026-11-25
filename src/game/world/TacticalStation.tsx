import { useReducedMotionRef } from '../useReducedMotionRef'
import { useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { GzipGLTFLoader } from '../rendering/GzipGLTFLoader'
import type { Group } from 'three'
import {
  readTacticalShipModel,
  TACTICAL_DISPLAY_ASSET,
  skipTacticalVisualRaycast,
} from './tacticalShipModel'
import { PhysicalScreen } from './PhysicalScreen'
import { TerminalPanel } from '../ui/TerminalPanel'
import { TacticalPanel } from '../ui/TacticalPanel'
import { TERMINAL_SCREENS, terminalHtmlScale } from '../interaction/station'
import type { ProtocolState } from '../protocol'
import {
  TACTICAL_MODEL_ANCHOR,
  TACTICAL_MODEL_SCALE,
  TACTICAL_MODEL_TILT,
} from './tacticalDisplayLayout'

/** The lossless offline miniature shares cached geometry and owns its materials. */
export function TacticalStation({
  active,
  paused,
  protocol,
  onClose,
  onDiagnostics,
}: {
  active: boolean
  paused: boolean
  protocol: ProtocolState
  onClose: () => void
  onDiagnostics: () => void
}) {
  const model = useRef<Group>(null)
  const asset = useLoader(GzipGLTFLoader, TACTICAL_DISPLAY_ASSET)
  const hologram = useMemo(
    () => readTacticalShipModel(asset.scene),
    [asset.scene],
  )
  const invalidate = useThree((state) => state.invalidate)
  const reduced = useReducedMotionRef(invalidate)
  useFrame((_, delta) => {
    if (!model.current || paused || document.hidden || reduced.current) return
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
          scale={TACTICAL_MODEL_SCALE}
        >
          <group position={[0, -hologram.size.y / 2, 0]}>
            <group
              raycast={skipTacticalVisualRaycast}
              name="tactical-ship-visual"
            >
              <mesh>
                <primitive object={hologram.surface} attach="geometry" />
                <meshBasicMaterial
                  color="#087480"
                  transparent
                  opacity={0.52}
                  depthWrite
                  toneMapped={false}
                />
              </mesh>
              <lineSegments>
                <primitive object={hologram.edges} attach="geometry" />
                <lineBasicMaterial
                  color="#59edf5"
                  transparent
                  opacity={0.72}
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
                onDiagnostics={onDiagnostics}
                protocol={protocol}
              />
            </TerminalPanel>
          </div>
        </PhysicalScreen>
      )}
    </>
  )
}
