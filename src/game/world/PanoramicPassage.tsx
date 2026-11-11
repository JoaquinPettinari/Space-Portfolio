import { useLayoutEffect, useRef } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { DoubleSide, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import type { InstancedMesh } from 'three'
import { ENTRY_OFFSET } from './bridgeLayout'

type Box = {
  at: [number, number, number]
  size: [number, number, number]
  tilt?: number
}
const start = 5.1
const length = ENTRY_OFFSET + 0.1
const center = start + length / 2
const bayLength = length / 3
const ribs: Box[] = []
const gaskets: Box[] = []
const hull: Box[] = []
const floor: Box[] = []
const lights: Box[] = []
for (let i = 0; i < 6; i++) {
  const z = start + ((i + 0.5) * length) / 6
  for (const side of [-1, 1]) {
    floor.push({
      at: [side * 0.69, -0.016, z],
      size: [1.34, 0.032, length / 6 - 0.025],
    })
  }
}
for (const side of [-1, 1]) {
  // Exterior stringers and a lower hull shoulder remain visible through the glass.
  hull.push(
    { at: [side * 1.88, -0.18, center], size: [0.48, 0.3, length] },
    { at: [side * 2.12, 0.24, center], size: [0.14, 0.18, length] },
  )
  for (const y of [0.2, 2.92]) {
    ribs.push({ at: [side * 1.5, y, center], size: [0.18, 0.24, length] })
  }
  for (const y of [0.34, 2.78]) {
    gaskets.push({ at: [side * 1.45, y, center], size: [0.08, 0.045, length] })
  }
  lights.push({ at: [side * 1.38, 0.31, center], size: [0.025, 0.025, length] })
  for (let i = 0; i <= 3; i++) {
    const z = start + i * bayLength
    // Ribs lean along the glazing, entirely outside the 2.8 m clear walkway.
    const tilt = i === 0 || i === 3 ? 0 : 0.12
    ribs.push({ at: [side * 1.53, 1.5, z], size: [0.18, 3.02, 0.13], tilt })
    gaskets.push({
      at: [side * 1.455, 1.55, z],
      size: [0.055, 2.45, 0.19],
      tilt,
    })
    hull.push({ at: [side * 1.88, -0.01, z], size: [0.67, 0.14, 0.2] })
  }
}
for (let i = 0; i <= 3; i++) {
  ribs.push({ at: [0, 3.13, start + i * bayLength], size: [3.18, 0.14, 0.16] })
}
const roofSpine: Box[] = [{ at: [0, 3.13, center], size: [0.16, 0.14, length] }]

function matrices(boxes: readonly Box[]) {
  return boxes.map(({ at, size, tilt = 0 }) =>
    new Matrix4().compose(
      new Vector3(...at),
      new Quaternion().setFromEuler(new Euler(tilt, 0, 0)),
      new Vector3(...size),
    ),
  )
}
const batches = [
  {
    name: 'passage-ribs',
    transforms: matrices([...ribs, ...roofSpine]),
    color: '#313b42',
  },
  { name: 'passage-gaskets', transforms: matrices(gaskets), color: '#0d171b' },
  { name: 'passage-outer-hull', transforms: matrices(hull), color: '#727a7e' },
  {
    name: 'passage-deck-panels',
    transforms: matrices(floor),
    color: '#465057',
  },
  {
    name: 'passage-guide-lights',
    transforms: matrices(lights),
    color: '#e8ad70',
    emissive: true,
  },
]
function BoxBatch({
  transforms,
  color,
  name,
  emissive = false,
}: (typeof batches)[number]) {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!mesh.current) return
    transforms.forEach((matrix, i) => mesh.current!.setMatrixAt(i, matrix))
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingBox()
    mesh.current.computeBoundingSphere()
  }, [transforms])
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, transforms.length]}
      name={name}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        roughness={0.55}
        metalness={0.35}
        emissive={emissive ? color : '#000000'}
        emissiveIntensity={emissive ? 0.8 : 0}
      />
    </instancedMesh>
  )
}

/** Six-metre reveal: about two seconds at the existing three-metre/second walking speed. */
export function PanoramicPassage() {
  return (
    <RigidBody type="fixed" colliders={false} name="panoramic-passage">
      <CuboidCollider
        args={[1.52, 0.1, length / 2]}
        position={[0, -0.1, center]}
      />
      <mesh position={[0, -0.11, center]}>
        <boxGeometry args={[3.04, 0.2, length]} />
        <meshStandardMaterial color="#17232b" roughness={0.65} />
      </mesh>
      <CuboidCollider
        args={[1.52, 0.08, length / 2]}
        position={[0, 3.08, center]}
      />
      {[-1, 1].map((side) => (
        <CuboidCollider
          key={side}
          args={[0.06, 1.5, length / 2]}
          position={[side * 1.46, 1.5, center]}
        />
      ))}
      {batches.map((batch) => (
        <BoxBatch key={batch.name} {...batch} />
      ))}
      {[0, 1, 2].map((i) => {
        const z = start + (i + 0.5) * bayLength
        return (
          <group key={i}>
            <mesh position={[0, 3, z]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[2.8, bayLength]} />
              <meshBasicMaterial
                color="#6596b8"
                transparent
                opacity={0.085}
                side={DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[side * 1.45, 1.55, z]}
                rotation={[0, Math.PI / 2, 0]}
              >
                <planeGeometry args={[bayLength, 2.44]} />
                <meshBasicMaterial
                  color="#6596b8"
                  transparent
                  opacity={0.085}
                  side={DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        )
      })}
    </RigidBody>
  )
}
