import { useEffect, useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Matrix4,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ARRIVAL_DEPTH, ARRIVAL_ORIGIN_Z } from './arrivalRoomLayout'
import { EVAEquipment } from './EVAEquipment'
import { EVA_EQUIPMENT_LAYOUT } from './evaEquipmentLayout'

const REAR = ARRIVAL_ORIGIN_Z + ARRIVAL_DEPTH - 0.04
const finishes = {
  shell: ['#46535a', 0.48, 0.4],
  dark: ['#111d24', 0.25, 0.65],
  metal: ['#8a999b', 0.78, 0.3],
  orange: ['#c29247', 0.4, 0.52],
} as const
type Finish = keyof typeof finishes

/** Compact equipment against the pressure wall. Shapes are baked into four
 * material batches once, rather than one draw per seam, pouch or fastener. */
function buildOutfitting() {
  const parts = new Map<Finish, BufferGeometry[]>()
  const add = (
    finish: Finish,
    geometry: BufferGeometry,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
  ) => {
    geometry.applyMatrix4(new Matrix4().makeScale(sx, sy, sz))
    geometry.translate(x, y, z)
    const list = parts.get(finish) ?? []
    list.push(geometry)
    parts.set(finish, list)
  }
  const box = (
    f: Finish,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) => add(f, new BoxGeometry(w, h, d), x, y, z)
  // Tall locker: paired doors, recessed gaskets, pull handles and top crate.
  box('shell', -3.28, 1.23, -0.12, 1.1, 2.32, 0.28)
  for (const x of [-3.55, -3.01]) {
    box('dark', x, 1.25, -0.267, 0.51, 2.09, 0.018)
    box('shell', x, 1.25, -0.283, 0.47, 2.03, 0.018)
    box(
      'metal',
      x + (x < -3.28 ? 0.17 : -0.17),
      1.12,
      -0.31,
      0.025,
      0.23,
      0.035,
    )
    for (let i = 0; i < 5; i++)
      box('dark', x, 2.05 + i * 0.027, -0.3, 0.29, 0.012, 0.012)
    box('orange', x, 0.4, -0.3, 0.23, 0.018, 0.012)
  }
  box('dark', -3.28, 0.09, -0.17, 1.12, 0.13, 0.34)
  box('shell', -3.28, 2.58, -0.11, 0.95, 0.25, 0.29)
  for (const x of [-3.62, -2.94]) {
    box('metal', x, 2.58, -0.27, 0.045, 0.2, 0.025)
    box('orange', x, 2.58, -0.289, 0.028, 0.038, 0.01)
  }
  // Narrower, recessed niche: its right edge clears the hatch surround by 24 cm.
  box('dark', -2.17, 1.59, -0.025, 0.95, 1.7, 0.04)
  box('shell', -2.17, 2.45, -0.08, 1.0, 0.055, 0.12)
  for (const x of [-2.6675, -1.6725])
    box('shell', x, 1.61, -0.08, 0.045, 1.7, 0.12)
  box('metal', -2.17, 2.23, -0.1, 0.68, 0.025, 0.03)
  box('metal', -2.17, 2.19, -0.1, 0.04, 0.1, 0.05)
  // Status display complements the existing emergency release; do not duplicate it.
  box('shell', 1.96, 1.98, -0.05, 0.79, 0.38, 0.08)
  // Captive bolts and lower threshold stripes keep the relief restrained.
  for (const x of [-3.77, -2.79, 1.76, 2.16])
    for (const y of [0.86, 1.37]) box('metal', x, y, -0.145, 0.017, 0.017, 0.01)
  return [...parts].map(([finish, geometries]) => {
    const geometry = mergeGeometries(geometries)!
    geometries.forEach((part) => part.dispose())
    const [color, metalness, roughness] = finishes[finish]
    return {
      finish,
      geometry,
      material: new MeshStandardMaterial({ color, metalness, roughness }),
    }
  })
}

function buildLabels(floor = false) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const c = canvas.getContext('2d')!
  c.fillStyle = floor ? '#263038' : '#08191f'
  c.fillRect(0, 0, 1024, 256)
  c.strokeStyle = '#b1a57a'
  c.lineWidth = 5
  c.strokeRect(10, 10, 1004, 236)
  c.textAlign = 'center'
  c.fillStyle = floor ? '#c7ad78' : '#7de4eb'
  c.font = '600 76px sans-serif'
  c.fillText(floor ? '⌃  ⌃  ⌃' : 'DOCK A–3', 512, 108)
  c.fillStyle = '#c4d3d5'
  c.font = '32px sans-serif'
  c.fillText(
    floor ? 'ARRIVAL ZONE  /  KEEP CLEAR' : 'PRESSURE LOCK  /  SEALED',
    512,
    180,
  )
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export function ArrivalOutfitting() {
  const batches = useMemo(() => buildOutfitting(), [])
  const labels = useMemo(() => buildLabels(), [])
  const floorLabel = useMemo(() => buildLabels(true), [])
  useEffect(
    () => () => {
      batches.forEach(({ geometry, material }) => {
        geometry.dispose()
        material.dispose()
      })
      labels.dispose()
      floorLabel.dispose()
    },
    [batches, labels, floorLabel],
  )
  return (
    <group position={[0, 0, REAR]} name="arrival-outfitting">
      <EVAEquipment />
      <group raycast={() => false}>
        {batches.map(({ finish, geometry, material }) => (
          <mesh key={finish} geometry={geometry} material={material} />
        ))}
        <mesh position={[1.96, 1.98, -0.096]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.71, 0.25]} />
          <meshBasicMaterial map={labels} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.012, -1.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.4, 0.48]} />
          <meshStandardMaterial
            map={floorLabel}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      </group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          position={[-3.28, 1.35, -0.14]}
          args={[0.56, 1.35, 0.17]}
        />
        <CuboidCollider
          position={EVA_EQUIPMENT_LAYOUT.colliderPosition}
          args={[...EVA_EQUIPMENT_LAYOUT.colliderHalfSize]}
        />
        <CuboidCollider
          position={[1.96, 1.98, -0.05]}
          args={[0.4, 0.2, 0.08]}
        />
      </RigidBody>
    </group>
  )
}
