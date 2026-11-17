import { useEffect, useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  ExtrudeGeometry,
  Matrix4,
  MeshStandardMaterial,
  SRGBColorSpace,
  Shape,
  Path,
} from 'three'
import {
  mergeGeometries,
  mergeVertices,
} from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ARRIVAL_DEPTH, ARRIVAL_ORIGIN_Z } from './arrivalRoomLayout'
import { EVAEquipment } from './EVAEquipment'
import { EVA_ALCOVE, EVA_EQUIPMENT_LAYOUT } from './evaEquipmentLayout'

const REAR = ARRIVAL_ORIGIN_Z + ARRIVAL_DEPTH - 0.04
const finishes = {
  shell: ['#46535a', 0.48, 0.4],
  dark: ['#111d24', 0.25, 0.65],
  metal: ['#8a999b', 0.78, 0.3],
  orange: ['#c29247', 0.4, 0.52],
  cyan: ['#7ce4ee', 0, 0.4],
  lamp: ['#ffd4a0', 0, 0.4],
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
  // The shallow mounting recess leaves the suit visible from the central aisle;
  // its deep floor plinth and top canopy still tie it to the rear wall.
  const bay = EVA_ALCOVE
  const depth = bay.backZ - bay.frontZ
  const middleZ = (bay.frontZ + bay.backZ) / 2
  const sideDepth = bay.backZ - bay.frameZ
  const sideMiddleZ = (bay.frameZ + bay.backZ) / 2
  box('dark', bay.centerX, 1.31, bay.backZ - 0.035, bay.width, 2.62, 0.07)
  for (const side of [-1, 1]) {
    const x = bay.centerX + (side * (bay.width - bay.jamb)) / 2
    box(
      'shell',
      x,
      bay.height / 2,
      sideMiddleZ,
      bay.jamb,
      bay.height,
      sideDepth,
    )
    // Recessed inner metal strips show the depth of the cavity.
    box('metal', x - side * 0.043, 1.33, -0.24, 0.012, 2.16, 0.045)
  }
  box('shell', bay.centerX, bay.height - 0.07, -0.33, bay.width, 0.14, 0.7)
  // Feet touch the recessed anti-slip deck; the plinth extends down to the floor.
  box(
    'shell',
    bay.centerX,
    (bay.floorY - 0.008) / 2,
    middleZ,
    bay.width,
    bay.floorY - 0.008,
    depth,
  )
  box(
    'dark',
    bay.centerX,
    bay.floorY - 0.004,
    middleZ,
    bay.width - 0.12,
    0.008,
    depth - 0.08,
  )
  const outline = (
    path: Shape | Path,
    halfWidth: number,
    bottom: number,
    top: number,
    corner: number,
  ) => {
    path.moveTo(-halfWidth + corner, bottom)
    path.lineTo(halfWidth - corner, bottom)
    path.lineTo(halfWidth, bottom + corner)
    path.lineTo(halfWidth, top - corner)
    path.lineTo(halfWidth - corner, top)
    path.lineTo(-halfWidth + corner, top)
    path.lineTo(-halfWidth, top - corner)
    path.lineTo(-halfWidth, bottom + corner)
    path.closePath()
  }
  const surround = new Shape()
  outline(surround, bay.width / 2, 0, bay.height, 0.09)
  const aperture = new Path()
  outline(
    aperture,
    bay.width / 2 - bay.jamb,
    bay.floorY,
    bay.height - 0.19,
    0.06,
  )
  surround.holes.push(aperture)
  const frame = new ExtrudeGeometry(surround, {
    depth: 0.075,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 1,
    steps: 1,
  })
  add('shell', mergeVertices(frame), bay.centerX, 0, bay.frameZ + 0.008)
  frame.dispose()
  box('dark', bay.centerX, 2.52, -0.687, 0.79, 0.057, 0.016)
  box('cyan', bay.centerX, 2.52, -0.697, 0.66, 0.015, 0.008)
  box('metal', bay.centerX, 2.42, -0.57, 0.85, 0.045, 0.25)
  box('lamp', bay.centerX, 2.394, -0.58, 0.68, 0.012, 0.105)
  box('dark', bay.centerX, 0.092, bay.frontZ - 0.007, 0.84, 0.057, 0.018)
  box('cyan', bay.centerX, 0.092, bay.frontZ - 0.018, 0.67, 0.018, 0.009)
  for (const x of [bay.centerX - 0.54, bay.centerX + 0.54])
    for (const y of [0.28, 1.25, 2.3])
      box('metal', x, y, bay.frameZ - 0.006, 0.024, 0.049, 0.018)
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
      material: new MeshStandardMaterial({
        color,
        metalness,
        roughness,
        emissive: finish === 'cyan' || finish === 'lamp' ? color : '#000000',
        emissiveIntensity: 1.8,
      }),
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
