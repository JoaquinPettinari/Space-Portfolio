import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { PhysicalScreen } from './PhysicalScreen'
import { TerminalPanel } from '../ui/TerminalPanel'
import { TacticalPanel } from '../ui/TacticalPanel'
import { TERMINAL_SCREENS, terminalHtmlScale } from '../interaction/station'
import { bridgePoint } from './bridgePlacement'
import type { ProtocolState } from '../protocol'
import type { BulkheadPhase } from './bulkhead'

/** A small wireframe of the existing bridge and rear airlock, not a final ship asset. */
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
  const [zoom, setZoom] = useState(0.8)
  const [rotating, setRotating] = useState(true)
  const reduced = useRef(false)
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reduced.current = query.matches
      invalidate()
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [invalidate])
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
        position={bridgePoint([0, 1.85, 0.5])}
        rotation={[0.35, 0, 0]}
        userData={{ interaction: 'tactical' }}
      >
        <group ref={model} scale={active ? zoom : 0.65}>
          <mesh>
            <boxGeometry args={[1.05, 0.36, 1.05]} />
            <meshBasicMaterial color="#42e8f5" wireframe />
          </mesh>
          <mesh position={[0, -0.06, 0.71]}>
            <boxGeometry args={[0.28, 0.36, 0.37]} />
            <meshBasicMaterial color="#e6b778" wireframe />
          </mesh>
          <mesh position={[0, -0.08, 0.05]}>
            <boxGeometry args={[0.21, 0.1, 0.27]} />
            <meshBasicMaterial color="#83f6ff" wireframe />
          </mesh>
          <mesh position={[0, -0.07, -0.4]}>
            <boxGeometry args={[0.86, 0.1, 0.15]} />
            <meshBasicMaterial color="#83f6ff" wireframe />
          </mesh>
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
