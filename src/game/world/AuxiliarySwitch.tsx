import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
} from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh, MeshStandardMaterial } from 'three'
import { POWER_POSITION } from '../interaction/station'
import {
  advanceLever,
  leverAngle,
  startLever,
  type LeverMotion,
} from './powerLever'

export type PowerSwitchHandle = { activate: () => void }

/** Animation is local; the existing protocol owns power state. */
export function AuxiliarySwitch({
  restored,
  paused,
  onComplete,
  ref,
}: {
  restored: boolean
  paused: boolean
  onComplete: () => void
  ref: Ref<PowerSwitchHandle>
}) {
  const { scene } = useGLTF('/models/cruz-del-sur-auxiliary-power-switch.glb')
  const motion = useRef<LeverMotion>({
    elapsed: 0,
    moving: false,
    latched: false,
  })
  const model = useMemo(() => {
    const root = scene.clone(true)
    const pivot = new Group()
    pivot.name = 'auxiliary-lever-pivot'
    pivot.position.set(0, -0.072, 0.091)
    root.add(pivot)
    root.updateMatrixWorld(true)
    for (const name of [
      'LEVER_SHAFT_ANIMATE',
      'LEVER_GRIP_ANIMATE',
      'LEVER_GRIP_AMBER_ANIMATE',
    ]) {
      const part = root.getObjectByName(name)
      if (!part) throw new Error(`Power switch asset is missing ${name}`)
      pivot.attach(part)
    }
    const lamps = ['Indicator_OFF_Red', 'Indicator_ON_Green'].map((name) => {
      const mesh = root.getObjectByName(name)
      if (!(mesh instanceof Mesh))
        throw new Error(`Power switch asset is missing ${name}`)
      const material = new MeshStandardMaterial({ roughness: 0.4 })
      mesh.material = material
      return material
    })
    return { root, pivot, lamps }
  }, [scene])
  const animatedModel = useRef<typeof model | null>(null)
  useEffect(() => {
    animatedModel.current = model
    return () => {
      animatedModel.current = null
    }
  }, [model])
  useEffect(
    () => () => model.lamps.forEach((material) => material.dispose()),
    [model],
  )
  useImperativeHandle(
    ref,
    () => ({
      activate: () => {
        startLever(motion.current, restored)
      },
    }),
    [restored],
  )
  useFrame((_, delta) => {
    const current = animatedModel.current
    if (!current) return
    const completed = advanceLever(
      motion.current,
      delta,
      paused || document.hidden,
    )
    const progress = restored ? 1 : Math.min(motion.current.elapsed / 0.6, 1)
    current.pivot.rotation.x = leverAngle(progress)
    current.lamps.forEach((material, index) => {
      const lit = index === (restored ? 1 : 0)
      material.color.set(
        lit ? (index === 0 ? '#e33024' : '#32e68b') : '#152019',
      )
      material.emissive.copy(material.color)
      material.emissiveIntensity = lit ? 0.8 : 0
    })
    if (completed) onComplete()
  })
  return (
    <group
      name="auxiliary-light-switch"
      position={[
        POWER_POSITION[0] + 0.08,
        POWER_POSITION[1],
        POWER_POSITION[2],
      ]}
      rotation={[0, Math.PI / 2, 0]}
      userData={{ interaction: 'lighting' }}
    >
      <primitive object={model.root} dispose={null} />
      {/* Simple raycast volume; the existing wall remains the physics boundary. */}
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[0.35, 0.55, 0.21]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh>
    </group>
  )
}
