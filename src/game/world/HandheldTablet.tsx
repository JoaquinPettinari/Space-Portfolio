import { useReducedMotionRef } from '../useReducedMotionRef'
import { useEffect, useRef, type ReactNode } from 'react'
import { Html, RoundedBox } from '@react-three/drei'
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

  const invalidate = useThree((value) => value.invalidate)
  const reducedMotion = useReducedMotionRef(invalidate)
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
        <RoundedBox
          args={[1.29, 0.87, 0.065]}
          radius={0.045}
          smoothness={2}
          position={[0, 0, -0.025]}
          raycast={ignoreRaycast}
        >
          <meshBasicMaterial color="#111d25" depthTest={false} />
        </RoundedBox>
        {[-1, 1].map((side) => (
          <group key={side}>
            {[-1, 1].map((row) => (
              <mesh
                key={row}
                position={[side * 0.59, row * 0.35, 0.046]}
                raycast={ignoreRaycast}
              >
                <circleGeometry args={[0.018, 8]} />
                <meshBasicMaterial color="#b7a47d" depthTest={false} />
              </mesh>
            ))}
            <mesh position={[side * 0.57, 0.26, 0.047]} raycast={ignoreRaycast}>
              <boxGeometry args={[0.014, 0.08, 0.012]} />
              <meshBasicMaterial color="#ffc477" depthTest={false} />
            </mesh>
            <group
              position={[side * 0.67, -0.24, 0.07]}
              rotation={[0, side * -0.2, side * -0.2]}
            >
              <RoundedBox
                args={[0.17, 0.25, 0.14]}
                radius={0.055}
                smoothness={2}
                raycast={ignoreRaycast}
              >
                <meshBasicMaterial color="#b6b6a6" depthTest={false} />
              </RoundedBox>
              {[0, 1, 2, 3].map((finger) => (
                <mesh
                  key={finger}
                  position={[-side * 0.055, 0.073 - finger * 0.047, 0.075]}
                  rotation={[0, 0, Math.PI / 2]}
                  raycast={ignoreRaycast}
                >
                  <capsuleGeometry args={[0.023, 0.075, 3, 6]} />
                  <meshBasicMaterial
                    color={finger % 2 ? '#727d7a' : '#818c87'}
                    depthTest={false}
                  />
                </mesh>
              ))}
              <mesh
                position={[-side * 0.085, 0.075, 0.12]}
                rotation={[0, 0, side * -0.5]}
                raycast={ignoreRaycast}
              >
                <capsuleGeometry args={[0.032, 0.09, 3, 8]} />
                <meshBasicMaterial color="#b6b6a6" depthTest={false} />
              </mesh>
              <RoundedBox
                position={[0, -0.18, -0.025]}
                args={[0.2, 0.14, 0.18]}
                radius={0.025}
                smoothness={2}
                raycast={ignoreRaycast}
              >
                <meshBasicMaterial color="#343e42" depthTest={false} />
              </RoundedBox>
              <mesh position={[0, -0.2, 0.071]} raycast={ignoreRaycast}>
                <boxGeometry args={[0.16, 0.035, 0.012]} />
                <meshBasicMaterial color="#c98d45" depthTest={false} />
              </mesh>
              <mesh position={[0, -0.33, -0.04]} raycast={ignoreRaycast}>
                <capsuleGeometry args={[0.092, 0.19, 3, 8]} />
                <meshBasicMaterial color="#b6b6a6" depthTest={false} />
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
