import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
} from 'react'
import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Bone, CanvasTexture, SRGBColorSpace, Vector3, type Group } from 'three'
import { RADIO_TRACKS } from '../radioTracks'
import { RADIO_BUTTONS, type RadioAction } from '../radioControls'
import { RADIO_POSITION, type StationTarget } from '../interaction/station'
import { useShipRadio } from '../useShipRadio'
import { useHandInteraction } from './useHandInteraction'
import { positionRadioSleeveEnd } from './handSleeve'
import { StaticPanels, type StaticPanel } from './StaticPanels'
import {
  RADIO_ACTUATION_TIME,
  RADIO_BUTTON_DEPTH,
  RADIO_PRESS_DURATION,
  PHYSICAL_CONTACT_DELAY,
  RADIO_RELEASE_TIME,
  advanceContactGesture,
} from './physicalPress'
import gestureTiming from './gestureTiming.json'
import { useReducedMotionRef } from '../useReducedMotionRef'
import { GALLEY_RADIO } from './galleyLayout'

const ignoreRaycast = () => {}
const details: StaticPanel[] = [
  { at: [0, -0.19, 0.11], size: [0.77, 0.025, 0.035], color: '#151e25' },
  { at: [0, 0.28, -0.035], size: [0.56, 0.045, 0.065], color: '#29363e' },
  ...[-1, 1].flatMap((side): StaticPanel[] => [
    {
      at: [side * 0.26, 0.235, -0.035],
      size: [0.045, 0.09, 0.065],
      color: '#29363e',
    },
    {
      at: [side * 0.28, -0.22, 0],
      size: [0.11, 0.035, 0.16],
      color: '#151e25',
    },
    {
      at: [side * 0.37, 0, 0.025],
      size: [0.035, 0.34, 0.23],
      color: '#17232b',
    },
    {
      at: [side * 0.36, 0.17, 0.137],
      size: [0.018, 0.018, 0.006],
      color: '#a9b4b6',
      metalness: 0.8,
    },
    {
      at: [side * 0.36, -0.17, 0.137],
      size: [0.018, 0.018, 0.006],
      color: '#a9b4b6',
      metalness: 0.8,
    },
  ]),
  ...Array.from({ length: 13 }, (_, index): StaticPanel => ({
    at: [-0.235, -0.15 + index * 0.011, 0.139],
    size: [0.19, 0.007, 0.012],
    color: '#45545b',
    metalness: 0.65,
  })),
]
export type ShipRadioHandle = { press: (action: RadioAction) => void }

/** Independent physical keys use the normal gaze ray and never change camera mode. */
export function ShipRadio({
  ref,
  paused,
  target,
}: {
  ref: Ref<ShipRadioHandle>
  paused: boolean
  target: StationTarget
}) {
  const radio = useShipRadio(paused)
  const root = useRef<Group>(null)
  const hand = useRef<Group>(null)
  const handModel = useHandInteraction('radio')
  const buttonContact = useRef(new Vector3())
  const sleeveTarget = useRef(new Vector3())
  const sleeveEnd = useMemo(() => {
    const bone = handModel.scene.getObjectByName('RADIO_SLEEVE_END')
    if (!(bone instanceof Bone))
      throw new Error('Missing radio sleeve end bone')
    return bone
  }, [handModel])
  const keys = useRef(new Map<RadioAction, Group>())
  const gesture = useRef({
    elapsed: 1,
    action: 'radio-play' as RadioAction,
    startedAt: null as number | null,
    actionCommitted: false,
  })
  const reduced = useReducedMotionRef()
  const face = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 768
    canvas.height = 192
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return { canvas, texture }
  }, [])
  const screenTexture = useRef(face.texture)
  const labels = useMemo(
    () =>
      RADIO_BUTTONS.map((button) => {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 128
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#e7f1f3'
          ctx.font = 'bold 38px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(button.symbol, 64, 64)
        }
        const texture = new CanvasTexture(canvas)
        texture.colorSpace = SRGBColorSpace
        return texture
      }),
    [],
  )
  useEffect(
    () => () => {
      face.texture.dispose()
      labels.forEach((texture) => texture.dispose())
    },
    [face, labels],
  )
  const seconds = Math.floor(radio.elapsed)
  const duration = Math.floor(radio.duration)
  useEffect(() => {
    if (!import.meta.env.DEV || !root.current) return
    // Update only playback data; replacing userData would erase the active gesture.
    root.current.userData.radioPlayback = {
      track: radio.track,
      playing: radio.playing,
      elapsed: radio.elapsed,
      duration: radio.duration,
      volume: radio.volume,
    }
  }, [radio.track, radio.playing, radio.elapsed, radio.duration, radio.volume])
  useEffect(() => {
    const ctx = face.canvas.getContext('2d')
    if (!ctx) return
    const track = RADIO_TRACKS[radio.track]
    ctx.fillStyle = '#06171f'
    ctx.fillRect(0, 0, 768, 192)
    ctx.fillStyle = '#6bb9c8'
    ctx.font = '18px monospace'
    ctx.fillText('CDS / NCS RADIO', 20, 28)
    ctx.fillStyle = '#d4e7eb'
    ctx.font = 'bold 30px sans-serif'
    ctx.fillText(track.title, 20, 72, 720)
    ctx.fillStyle = '#8aa8b4'
    ctx.font = '21px sans-serif'
    ctx.fillText(track.artists, 20, 106, 720)
    ctx.fillStyle = radio.error
      ? '#ef9568'
      : radio.playing
        ? '#6fe0bd'
        : '#d3b17a'
    ctx.font = '18px monospace'
    const stamp = (value: number) =>
      Math.floor(value / 60) + ':' + String(value % 60).padStart(2, '0')
    ctx.fillText(
      radio.error
        ? 'SIGNAL ERROR'
        : radio.pending
          ? 'TUNING'
          : radio.playing
            ? 'PLAYING'
            : 'STANDBY',
      20,
      146,
    )
    ctx.fillStyle = '#a9c2ca'
    ctx.fillText(
      stamp(seconds) +
        ' / ' +
        stamp(duration) +
        '    VOL ' +
        Math.round(radio.volume * 100) +
        '%',
      320,
      146,
    )
    ctx.fillStyle = '#27424c'
    ctx.fillRect(20, 168, 720, 4)
    ctx.fillStyle = '#73c8d3'
    ctx.fillRect(20, 168, 720 * (duration ? seconds / duration : 0), 4)
    screenTexture.current.needsUpdate = true
  }, [
    face,
    radio.track,
    radio.playing,
    radio.pending,
    radio.error,
    radio.volume,
    seconds,
    duration,
  ])
  useImperativeHandle(ref, () => ({
    press(action) {
      if (
        paused ||
        document.hidden ||
        gesture.current.elapsed < RADIO_PRESS_DURATION
      )
        return
      gesture.current.action = action
      gesture.current.elapsed = 0
      gesture.current.startedAt = performance.now()
      gesture.current.actionCommitted = false
    },
  }))
  useFrame(({ camera }, delta) => {
    const pose = gesture.current
    if (pose.elapsed >= RADIO_PRESS_DURATION) {
      if (hand.current) hand.current.visible = false
      return
    }
    if (paused || document.hidden || !document.hasFocus()) return
    // The first frame's delta also includes time before the E key was pressed.
    const step =
      pose.startedAt === null
        ? delta
        : Math.min(delta, (performance.now() - pose.startedAt) / 1000)
    pose.startedAt = null
    pose.elapsed = advanceContactGesture(
      pose.elapsed,
      step,
      gestureTiming.radio,
    )
    const button = RADIO_BUTTONS.find((entry) => entry.action === pose.action)
    if (!button) return
    if (hand.current) {
      hand.current.visible = pose.elapsed < RADIO_PRESS_DURATION
      hand.current.position.set(
        button.position[0],
        button.position[1],
        button.position[2] + RADIO_BUTTON_DEPTH / 2,
      )
    }
    handModel.sample(
      'radio_press',
      reduced.current
        ? Math.max(
            PHYSICAL_CONTACT_DELAY,
            Math.min(RADIO_RELEASE_TIME, pose.elapsed),
          )
        : pose.elapsed,
    )
    positionRadioSleeveEnd(sleeveEnd, camera, sleeveTarget.current)
    // The key follows the exported button track, so skin and key share a curve.
    const key = keys.current.get(pose.action)
    const anchor = handModel.anchors.button
    if (key && anchor && hand.current) {
      anchor.getWorldPosition(buttonContact.current)
      hand.current.worldToLocal(buttonContact.current)
      key.position.z =
        button.position[2] + buttonContact.current.z / GALLEY_RADIO.scale
    }
    // Set the contact/depression pose before committing the requested action.
    if (!pose.actionCommitted && pose.elapsed >= RADIO_ACTUATION_TIME) {
      pose.actionCommitted = true
      switch (pose.action) {
        case 'radio-play':
          void radio.toggle()
          break
        case 'radio-next':
          radio.next()
          break
        case 'radio-previous':
          radio.selectTrack(radio.track - 1)
          break
        case 'radio-louder':
          radio.changeVolume(radio.volume + 0.1)
          break
        case 'radio-quieter':
          radio.changeVolume(radio.volume - 0.1)
          break
      }
    }
    if (root.current && import.meta.env.DEV) {
      root.current.userData.radioPress =
        pose.elapsed < RADIO_PRESS_DURATION ? pose.action : null
      root.current.userData.radioGestureElapsed = pose.elapsed
      root.current.userData.radioActionCommitted = pose.actionCommitted
    }
  })
  return (
    <group
      ref={root}
      name="cds-desk-radio"
      position={RADIO_POSITION}
      rotation={[0, GALLEY_RADIO.rotation, 0]}
      scale={GALLEY_RADIO.scale}
    >
      <RoundedBox args={[0.8, 0.4, 0.25]} radius={0.025} smoothness={2}>
        <meshStandardMaterial
          color="#35424b"
          metalness={0.5}
          roughness={0.42}
        />
      </RoundedBox>
      <StaticPanels panels={details} />
      <RoundedBox
        args={[0.55, 0.145, 0.022]}
        position={[0.055, 0.09, 0.132]}
        radius={0.012}
        smoothness={2}
      >
        <meshStandardMaterial color="#101c24" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0.055, 0.09, 0.145]}>
        <planeGeometry args={[0.51, 0.1275]} />
        <meshBasicMaterial map={face.texture} toneMapped={false} />
      </mesh>
      <mesh position={[-0.22, 0.41, -0.04]} rotation={[0, 0, 0.55]}>
        <cylinderGeometry args={[0.004, 0.006, 0.32, 8]} />
        <meshStandardMaterial color="#b0b8b9" metalness={0.8} roughness={0.3} />
      </mesh>
      {RADIO_BUTTONS.map((button, index) => (
        <group
          key={button.action}
          ref={(value) => {
            if (value) keys.current.set(button.action, value)
            else keys.current.delete(button.action)
          }}
          name={button.action}
          position={button.position}
          userData={{ interaction: button.action }}
        >
          <RoundedBox
            args={[0.075, 0.058, RADIO_BUTTON_DEPTH]}
            radius={0.007}
            smoothness={2}
          >
            <meshStandardMaterial
              color={button.action === 'radio-play' ? '#bd6c3f' : '#667681'}
              metalness={0.45}
              roughness={0.35}
              emissive={target === button.action ? '#a3dce7' : '#000000'}
              emissiveIntensity={0.22}
            />
          </RoundedBox>
          <mesh position={[0, 0, 0.023]} raycast={ignoreRaycast}>
            <planeGeometry args={[0.058, 0.045]} />
            <meshBasicMaterial
              map={labels[index]}
              transparent
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      <group
        name="radio-press-hand"
        ref={hand}
        scale={1 / GALLEY_RADIO.scale}
        visible={false}
      >
        <primitive object={handModel.scene} dispose={null} />
      </group>
    </group>
  )
}
