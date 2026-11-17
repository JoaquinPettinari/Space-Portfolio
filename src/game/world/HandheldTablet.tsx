import { useReducedMotionRef } from '../useReducedMotionRef'
import { useEffect, useRef } from 'react'
import { Html, RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { advanceTabletPose, type TabletMode } from '../tablet'
import { HeldTabletDisplay } from '../ui/HeldTabletDisplay'
import { AstronautGlove } from './AstronautGlove'
import type { ProtocolState } from '../protocol'
import { missions } from '../missions'
import '../ui/HandheldTablet.css'

const ignoreRaycast = () => {}

/** Camera-relative rugged tablet prop; no colliders, no scene interaction targets.
 * Mount once so the lower animation can finish; Game owns all input/capture. */
export function HandheldTablet({
  mode,
  state,
  currentObjective,
}: {
  mode: TabletMode
  state: ProtocolState
  currentObjective: (typeof missions)[number] | null
}) {
  const root = useRef<Group>(null)
  const prop = useRef<Group>(null)
  const screen = useRef<HTMLDivElement>(null)
  const pose = useRef({ raised: 0 })

  const invalidate = useThree((value) => value.invalidate)
  const reducedMotion = useReducedMotionRef(invalidate)
  useEffect(() => invalidate(), [mode, invalidate])
  useFrame(({ camera, size }, delta) => {
    if (!root.current || !prop.current) return
    const raised = mode === 'lowered' ? 0 : 1
    const values = pose.current
    values.raised = advanceTabletPose(
      values.raised,
      raised,
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
      -0.065 * scale - (1 - values.raised) * 1.4,
      -1.15,
    )
    prop.current.rotation.x = -0.055
    root.current.visible = values.raised > 0
    if (screen.current) {
      screen.current.style.opacity = String(values.raised)
      screen.current.style.visibility =
        values.raised === 0 ? 'hidden' : 'visible'
    }
    if (values.raised !== raised) invalidate()
  }, -0.25)
  return (
    // Camera props render after the world, back to front, without writing depth.
    // Disabling depth tests alone lets later world meshes overwrite the bezel.
    <group ref={root} name="handheld-mission-tablet" renderOrder={1000}>
      <group ref={prop} renderOrder={1000}>
        <RoundedBox
          args={[1.24, 0.82, 0.07]}
          radius={0.035}
          smoothness={2}
          raycast={ignoreRaycast}
          renderOrder={1001}
        >
          <meshStandardMaterial
            roughness={0.54}
            metalness={0.28}
            color="#35414a"
            depthTest={false}
            depthWrite={false}
          />
        </RoundedBox>
        <RoundedBox
          args={[1.29, 0.87, 0.065]}
          radius={0.045}
          smoothness={2}
          position={[0, 0, -0.025]}
          raycast={ignoreRaycast}
          renderOrder={1000}
        >
          <meshStandardMaterial
            roughness={0.54}
            metalness={0.28}
            color="#111d25"
            depthTest={false}
            depthWrite={false}
          />
        </RoundedBox>
        {[-1, 1].map((side) => (
          <group key={side} renderOrder={1000}>
            {[-1, 1].map((row) => (
              <group key={row} renderOrder={1000}>
                <RoundedBox
                  args={[0.17, 0.055, 0.09]}
                  radius={0.012}
                  smoothness={2}
                  position={[side * 0.565, row * 0.41, 0.012]}
                  raycast={ignoreRaycast}
                  renderOrder={1002}
                >
                  <meshStandardMaterial
                    roughness={0.54}
                    metalness={0.28}
                    color="#b96b30"
                    depthTest={false}
                    depthWrite={false}
                  />
                </RoundedBox>
                <RoundedBox
                  args={[0.055, 0.15, 0.09]}
                  radius={0.012}
                  smoothness={2}
                  position={[side * 0.625, row * 0.365, 0.012]}
                  raycast={ignoreRaycast}
                  renderOrder={1002}
                >
                  <meshStandardMaterial
                    color="#b96b30"
                    roughness={0.54}
                    metalness={0.28}
                    depthTest={false}
                    depthWrite={false}
                  />
                </RoundedBox>
                <mesh
                  position={[side * 0.59, row * 0.35, 0.061]}
                  raycast={ignoreRaycast}
                  renderOrder={1003}
                >
                  <circleGeometry args={[0.012, 10]} />
                  <meshBasicMaterial
                    color="#171d23"
                    depthTest={false}
                    depthWrite={false}
                  />
                </mesh>
              </group>
            ))}
            <mesh
              position={[side * 0.57, 0.26, 0.047]}
              raycast={ignoreRaycast}
              renderOrder={1003}
            >
              <boxGeometry args={[0.014, 0.08, 0.012]} />
              <meshBasicMaterial
                color="#ffc477"
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <group
              position={[side * 0.73, -0.11, 0.005]}
              rotation={[0, side * -0.1, side * -0.08]}
              renderOrder={1000}
            >
              <group scale={[side, 1, 1]} renderOrder={1000}>
                <AstronautGlove overlay />
              </group>
            </group>
          </group>
        ))}
        <mesh
          position={[0, 0.365, 0.047]}
          raycast={ignoreRaycast}
          renderOrder={1003}
        >
          <circleGeometry args={[0.01, 12]} />
          <meshBasicMaterial
            color="#78c3d3"
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <mesh
          position={[0, -0.367, 0.047]}
          raycast={ignoreRaycast}
          renderOrder={1003}
        >
          <boxGeometry args={[0.24, 0.009, 0.008]} />
          <meshBasicMaterial
            color="#7c8b93"
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <Html
          ref={screen}
          transform
          position={[0, 0, 0.041]}
          distanceFactor={0.56}
          zIndexRange={[5, 4]}
          pointerEvents="none"
          style={{ opacity: 0, visibility: 'hidden' }}
        >
          <HeldTabletDisplay
            state={state}
            currentObjective={currentObjective}
            onDisplayReady={invalidate}
          />
        </Html>
      </group>
    </group>
  )
}
