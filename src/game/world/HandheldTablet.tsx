import { useEffect, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { Quaternion, Scene, Vector3, type Group } from 'three'
import { useReducedMotionRef } from '../useReducedMotionRef'
import { advanceTabletPose, type TabletMode } from '../tablet'
import { smoothGesture } from './physicalPress'
import { useHandInteraction } from './useHandInteraction'
import gestureTiming from './gestureTiming.json'
import { HeldTabletDisplay } from '../ui/HeldTabletDisplay'
import type { ProtocolState } from '../protocol'
import { missions } from '../missions'
import '../ui/HandheldTablet.css'

/** A depth-separated foreground pass preserves finger/frame self-occlusion. */
export function HandheldTablet({
  mode,
  state,
  currentObjective,
}: {
  mode: TabletMode
  state: ProtocolState
  currentObjective: (typeof missions)[number] | null
}) {
  const model = useHandInteraction('tablet')
  const root = useRef<Group>(null)
  const screen = useRef<HTMLDivElement>(null)
  const [foreground] = useState(() => new Scene())
  const poseRef = useRef({
    raised: 0,
    target: 0,
    blend: 0,
    fromPosition: new Vector3(),
    fromRotation: new Quaternion(),
    toRotation: new Quaternion(),
  })
  const motion = model.scene.getObjectByName('TABLET_MOTION')
  if (!motion || !model.anchors.screen)
    throw new Error('Tablet export requires motion and screen anchors')
  const { invalidate, scene: world } = useThree()
  const reduced = useReducedMotionRef(invalidate)
  useEffect(() => invalidate(), [mode, invalidate])
  useFrame(({ camera, size }, delta) => {
    if (!root.current || document.hidden) return
    const pose = poseRef.current
    const target = mode === 'lowered' ? 0 : 1
    const changing =
      target !== pose.target || pose.raised !== target || pose.blend > 0
    if (!target && !changing) return
    if (target !== pose.target) {
      pose.fromPosition.copy(motion.position)
      pose.fromRotation.copy(motion.quaternion)
      pose.blend = pose.raised > 0 && pose.raised < 1 ? 0.1 : 0
      pose.target = target
    }
    pose.raised = advanceTabletPose(pose.raised, target, delta, reduced.current)
    if (reduced.current) pose.blend = 0
    if (changing)
      model.sample(
        target ? 'tablet_raise' : 'tablet_lower',
        target
          ? pose.raised * gestureTiming.tablet.raise
          : (1 - pose.raised) * gestureTiming.tablet.lower,
      )
    // Reversing T midway blends from the current pose into the opposite clip.
    if (pose.blend > 0 && !reduced.current) {
      pose.blend = Math.max(0, pose.blend - delta)
      const weight = smoothGesture(1 - pose.blend / 0.1)
      motion.position.lerpVectors(pose.fromPosition, motion.position, weight)
      pose.toRotation.copy(motion.quaternion)
      motion.quaternion.copy(pose.fromRotation).slerp(pose.toRotation, weight)
    }
    const scale = Math.min(1, size.width / size.height / 1.3)
    root.current.position.copy(camera.position)
    root.current.quaternion.copy(camera.quaternion)
    model.scene.scale.setScalar(scale)
    root.current.visible = pose.raised > 0
    if (screen.current) {
      screen.current.style.opacity = String(smoothGesture(pose.raised))
      screen.current.style.visibility = pose.raised === 0 ? 'hidden' : 'visible'
    }
    if (pose.raised !== target || pose.blend > 0) invalidate()
  }, -0.25)
  useFrame(({ gl, camera }) => {
    const autoClear = gl.autoClear
    const autoReset = gl.info.autoReset
    gl.info.autoReset = false
    gl.info.reset()
    gl.render(world, camera)
    if (root.current?.visible) {
      gl.autoClear = false
      gl.clearDepth()
      gl.render(foreground, camera)
    }
    gl.autoClear = autoClear
    gl.info.autoReset = autoReset
  }, 1)
  return createPortal(
    <>
      <hemisphereLight args={['#fff0db', '#52606b', 1.3]} />
      <directionalLight position={[3, 5, 4]} intensity={2} color="#ffe4c5" />
      <group ref={root} name="handheld-mission-tablet" visible={false}>
        <group position={[0, -0.02, -0.36]} rotation={[-0.055, 0, 0]}>
          <primitive object={model.scene} dispose={null} />
        </group>
      </group>
      {createPortal(
        <Html
          ref={screen}
          transform
          distanceFactor={0.1592}
          zIndexRange={[5, 4]}
          pointerEvents="none"
          style={{ opacity: 0, visibility: 'hidden' }}
        >
          <HeldTabletDisplay
            state={state}
            currentObjective={currentObjective}
            onDisplayReady={invalidate}
          />
        </Html>,
        model.anchors.screen,
      )}
    </>,
    foreground,
  )
}
