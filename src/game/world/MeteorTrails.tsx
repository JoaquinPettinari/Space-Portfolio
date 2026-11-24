import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  DataTexture,
  DoubleSide,
  DynamicDrawUsage,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  RGBAFormat,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useReducedMotionRef } from '../useReducedMotionRef'
import { advanceExteriorTime } from './asterionMotion'
import { METEOR_COUNT, sampleMeteor } from './meteorMotion'

/** Six sparse trails share one draw and a tiny procedural falloff, without lights. */
export function MeteorTrails({ paused }: { paused: boolean }) {
  const model = useMemo(() => {
    const pixels = new Uint8Array(64 * 16 * 4)
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 64; x++) {
        const width = Math.max(0, 1 - Math.abs((y - 7.5) / 7.5)) ** 3
        const tail = Math.sin((Math.PI * x) / 63) ** 0.7
        pixels.set(
          [255, 255, 255, Math.round(255 * width * tail)],
          (y * 64 + x) * 4,
        )
      }
    const texture = new DataTexture(pixels, 64, 16, RGBAFormat)
    texture.needsUpdate = true
    const a = new PlaneGeometry(1, 1)
    const b = a.clone().rotateX(Math.PI / 2)
    const geometry = mergeGeometries([a, b])!
    a.dispose()
    b.dispose()
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
      forceSinglePass: true,
      toneMapped: false,
    })
    const mesh = new InstancedMesh(geometry, material, METEOR_COUNT)
    mesh.name = 'orbital-meteor-trails'
    mesh.frustumCulled = false
    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    mesh.visible = false
    return {
      mesh,
      dispose: () => {
        mesh.dispose()
        geometry.dispose()
        material.dispose()
        texture.dispose()
      },
    }
  }, [])
  const elapsed = useRef(0)
  const mesh = useRef<InstancedMesh>(null)
  const transform = useRef(new Object3D())
  const position = useRef(new Vector3())
  const direction = useRef(new Vector3())
  const axis = useMemo(() => new Vector3(1, 0, 0), [])
  const color = useMemo(() => new Color(), [])
  const reducedMotion = useReducedMotionRef()
  useEffect(() => () => model.dispose(), [model])
  useFrame((_, delta) => {
    const current = mesh.current
    if (!current) return
    if (reducedMotion.current) {
      current.visible = false
      return
    }
    const next = advanceExteriorTime(
      elapsed.current,
      delta,
      paused || document.hidden,
    )
    if (next === elapsed.current) return
    elapsed.current = next
    let visible = false
    for (let i = 0; i < METEOR_COUNT; i++) {
      const intensity = sampleMeteor(
        next,
        i,
        position.current,
        direction.current,
      )
      visible ||= intensity > 0
      transform.current.position.copy(position.current)
      transform.current.quaternion.setFromUnitVectors(axis, direction.current)
      transform.current.scale.set(5.5, 0.16, 0.16)
      transform.current.updateMatrix()
      current.setMatrixAt(i, transform.current.matrix)
      current.setColorAt(
        i,
        color.setRGB(0.52 * intensity, 0.8 * intensity, intensity),
      )
    }
    current.visible = visible
    current.instanceMatrix.needsUpdate = true
    if (current.instanceColor) current.instanceColor.needsUpdate = true
  })
  return <primitive ref={mesh} object={model.mesh} dispose={null} />
}
