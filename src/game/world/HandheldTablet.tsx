import { useEffect, useRef, type ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { advanceTabletPose, type TabletMode } from '../tablet'
import { MissionTablet } from '../ui/MissionTablet'
import { HeldTabletDisplay } from '../ui/HeldTabletDisplay'
import type { ProtocolState } from '../protocol'
import { missions } from '../missions'
import '../ui/HandheldTablet.css'

const ignoreRaycast = () => {}

/** Camera-relative placeholder prop; no colliders, no scene interaction targets.
 * Mount once so the lower animation can finish; Game owns all input/capture. */
export function HandheldTablet({
  mode,
  state,
  currentObjective,
  onContinue,
  onSkip,
  onReplay,
  onClose,
  onResume,
  onOpenArchive,
  onAccessiblePortfolio,
  subtitle,
}: {
  mode: TabletMode
  state: ProtocolState
  currentObjective: (typeof missions)[number] | null
  onContinue: () => void
  onSkip: () => void
  onReplay: () => void
  onClose: () => void
  onResume: () => void
  onOpenArchive: () => void
  onAccessiblePortfolio?: () => void
  subtitle?: ReactNode
}) {
  const root = useRef<Group>(null)
  const prop = useRef<Group>(null)
  const screen = useRef<HTMLDivElement>(null)
  const pose = useRef({ raised: 0, focused: 0 })
  const reducedMotion = useRef(false)
  const invalidate = useThree((value) => value.invalidate)
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reducedMotion.current = media.matches
      invalidate()
    }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [invalidate])
  useEffect(() => invalidate(), [mode, invalidate])
  useFrame(({ camera, size }, delta) => {
    if (!root.current || !prop.current) return
    const raised = mode === 'lowered' ? 0 : 1
    const focused = mode === 'focused' ? 1 : 0
    const values = pose.current
    values.raised = advanceTabletPose(
      values.raised,
      raised,
      Math.min(delta, 0.05),
      reducedMotion.current,
    )
    values.focused = advanceTabletPose(
      values.focused,
      focused,
      Math.min(delta, 0.05),
      reducedMotion.current,
    )
    root.current.position.copy(camera.position)
    root.current.quaternion.copy(camera.quaternion)
    // Keep hands and frame inside the horizontal viewport on portrait screens.
    const scale = Math.min(1, size.width / size.height / 1.3)
    prop.current.scale.setScalar(scale)
    prop.current.position.set(
      0,
      -0.22 * scale + values.focused * 0.22 * scale - (1 - values.raised) * 1.4,
      -1.15,
    )
    root.current.visible = values.raised > 0
    if (screen.current) {
      screen.current.style.opacity = String(values.raised)
      screen.current.style.visibility =
        values.raised === 0 ? 'hidden' : 'visible'
    }
    if (values.raised !== raised || values.focused !== focused) invalidate()
  }, -0.25)
  return (
    <group ref={root} name="handheld-mission-tablet">
      <group ref={prop}>
        <mesh raycast={ignoreRaycast}>
          <boxGeometry args={[1.24, 0.82, 0.07]} />
          <meshBasicMaterial color="#26343d" depthTest={false} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.6, 0.34, 0.008]} raycast={ignoreRaycast}>
              <boxGeometry args={[0.13, 0.12, 0.08]} />
              <meshBasicMaterial color="#c57c38" depthTest={false} />
            </mesh>
            <group
              position={[side * 0.66, -0.22, 0.06]}
              rotation={[0, 0, side * -0.18]}
            >
              <mesh raycast={ignoreRaycast}>
                <boxGeometry args={[0.16, 0.28, 0.13]} />
                <meshBasicMaterial color="#a5aeb1" depthTest={false} />
              </mesh>
              <mesh
                position={[-side * 0.075, 0.04, 0.055]}
                rotation={[0, 0, side * 0.4]}
                raycast={ignoreRaycast}
              >
                <boxGeometry args={[0.07, 0.17, 0.09]} />
                <meshBasicMaterial color="#53606a" depthTest={false} />
              </mesh>
              <mesh position={[0, -0.18, -0.01]} raycast={ignoreRaycast}>
                <boxGeometry args={[0.19, 0.13, 0.16]} />
                <meshBasicMaterial color="#d3d7d6" depthTest={false} />
              </mesh>
            </group>
          </group>
        ))}
        <Html
          ref={screen}
          transform
          position={[0, 0, 0.041]}
          distanceFactor={0.56}
          zIndexRange={[5, 4]}
          pointerEvents={mode === 'focused' ? 'auto' : 'none'}
          style={{ opacity: 0, visibility: 'hidden' }}
        >
          {mode === 'focused' ? (
            <MissionTablet
              state={state}
              currentObjective={currentObjective}
              onContinue={onContinue}
              onSkip={onSkip}
              onReplay={onReplay}
              onClose={onClose}
              onResume={onResume}
              onOpenArchive={onOpenArchive}
              onAccessiblePortfolio={onAccessiblePortfolio}
              subtitle={subtitle}
              handheld
              onDisplayReady={invalidate}
            />
          ) : (
            <HeldTabletDisplay
              state={state}
              currentObjective={currentObjective}
              onDisplayReady={invalidate}
            />
          )}
        </Html>
      </group>
    </group>
  )
}
