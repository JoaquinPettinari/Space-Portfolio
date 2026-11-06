import { useMemo } from 'react'
import { CuboidCollider } from '@react-three/rapier'
import { DoubleSide, Shape } from 'three'

type XYZ = [number, number, number]

function Plate({
  at,
  size,
  rotation,
  color = '#294055',
  glow = false,
}: {
  at: XYZ
  size: XYZ
  rotation?: XYZ
  color?: string
  glow?: boolean
}) {
  return (
    <mesh position={at} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={0.25}
        roughness={0.55}
        emissive={glow ? color : '#000000'}
        emissiveIntensity={glow ? 1.3 : 0}
      />
    </mesh>
  )
}

function Glass({
  at,
  size,
  rotation,
}: {
  at: XYZ
  size: [number, number]
  rotation?: XYZ
}) {
  return (
    <mesh position={at} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        color="#6596b8"
        transparent
        opacity={0.055}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function Wing({ side }: { side: number }) {
  const shape = useMemo(() => {
    const outline = new Shape()
    outline.moveTo(0, -2.7)
    outline.lineTo(5.8, 2.7)
    outline.lineTo(6.4, 4.3)
    outline.lineTo(0, 3.7)
    outline.closePath()
    return outline
  }, [])
  return (
    <group position={[side * 4.9, 0.35, 0]} scale={[side, 1, 1]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[shape, { depth: 0.22, bevelEnabled: false }]} />
        <meshStandardMaterial
          color="#304d65"
          metalness={0.4}
          roughness={0.5}
          side={DoubleSide}
        />
      </mesh>
      <Plate at={[3.8, 0.12, 2.6]} size={[0.7, 0.5, 3.6]} color="#182d42" />
      <Plate
        at={[3.8, 0.14, 4.42]}
        size={[0.5, 0.16, 0.035]}
        color="#74dcff"
        glow
      />
      <Plate
        at={[5.7, 0.05, 3.7]}
        size={[0.05, 0.08, 0.75]}
        color={side < 0 ? '#ff897b' : '#70e3d6'}
        glow
      />
    </group>
  )
}

/** An elliptical barrel vault: the glass follows the same curve as the hull. */
function RoofStrip({
  start,
  arc,
  z,
  length,
  glass = false,
  glow = false,
}: {
  start: number
  arc: number
  z: number
  length: number
  glass?: boolean
  glow?: boolean
}) {
  return (
    <group position={[0, 3.65, z]} scale={[5.1, 1.45, 1]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, length, 40, 1, true, start, arc]} />
        {glass ? (
          <meshBasicMaterial
            color="#6596b8"
            transparent
            opacity={0.055}
            side={DoubleSide}
            depthWrite={false}
          />
        ) : (
          <meshStandardMaterial
            color={glow ? '#9bdff4' : '#294055'}
            side={DoubleSide}
            metalness={0.25}
            roughness={0.55}
            emissive={glow ? '#9bdff4' : '#000000'}
            emissiveIntensity={glow ? 1 : 0}
          />
        )}
      </mesh>
    </group>
  )
}

function CurvedRoof() {
  const endCap = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-5.1, 3.65)
    for (let i = 0; i <= 40; i++) {
      const angle = -Math.PI / 2 + (i / 40) * Math.PI
      shape.lineTo(5.1 * Math.sin(angle), 3.65 + 1.45 * Math.cos(angle))
    }
    shape.closePath()
    return shape
  }, [])
  return (
    <group>
      {[-5.1, 5.1].map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <shapeGeometry args={[endCap]} />
          <meshStandardMaterial
            color="#294055"
            side={DoubleSide}
            metalness={0.25}
            roughness={0.55}
          />
        </mesh>
      ))}
      <RoofStrip start={-Math.PI / 2} arc={Math.PI} z={-4.35} length={1.7} />
      <RoofStrip start={-Math.PI / 2} arc={Math.PI} z={3.35} length={3.7} />
      <RoofStrip start={-0.18} arc={0.36} z={-1} length={5} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <RoofStrip
            start={side < 0 ? -Math.PI / 2 : 0.85}
            arc={Math.PI / 2 - 0.85}
            z={-1}
            length={5}
          />
          <RoofStrip
            start={side < 0 ? -0.85 : 0.18}
            arc={0.67}
            z={-1}
            length={5}
            glass
          />
          <RoofStrip
            start={side * 0.85 - 0.006}
            arc={0.012}
            z={-1}
            length={5}
            glow
          />
        </group>
      ))}
    </group>
  )
}

/** Structural skin only; the main room's boundary colliders remain in Greybox. */
export function ShipHull() {
  return (
    <group>
      {/* One unbroken forward viewport, framed by opaque hull. */}
      <Plate at={[0, 0.62, -5.1]} size={[10.4, 1.24, 0.24]} />
      <Plate at={[0, 3.95, -5.1]} size={[10.4, 1.2, 0.3]} />
      {[-4.62, 4.62].map((x) => (
        <Plate key={x} at={[x, 2.3, -5.1]} size={[1.24, 2.2, 0.3]} />
      ))}
      <Glass at={[0, 2.3, -5.08]} size={[8, 2.1]} />
      <Plate
        at={[0, 1.25, -4.91]}
        size={[8, 0.035, 0.05]}
        color="#78d4eb"
        glow
      />
      <Plate
        at={[0, 3.36, -4.91]}
        size={[8, 0.035, 0.05]}
        color="#78d4eb"
        glow
      />

      {/* Two continuous windows per side, with substantial solid sections. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Plate at={[side * 5.1, 0.65, 0]} size={[0.24, 1.3, 10.4]} />
          <Plate at={[side * 5.1, 3.6, 0]} size={[0.3, 0.6, 10.4]} />
          {[-4.7, 0, 4.7].map((z) => (
            <Plate
              key={z}
              at={[side * 5.1, 2.3, z]}
              size={[0.3, 2, z === 0 ? 0.8 : 1]}
            />
          ))}
          {[-2.35, 2.35].map((z) => (
            <group key={z}>
              <Glass
                at={[side * 5.08, 2.3, z]}
                size={[3.9, 2]}
                rotation={[0, Math.PI / 2, 0]}
              />
              <Plate
                at={[side * 4.92, 1.31, z]}
                size={[0.05, 0.035, 3.9]}
                color="#78d4eb"
                glow
              />
            </group>
          ))}
          {/* Conservative shoulder colliders remain above the walking volume. */}
          <CuboidCollider
            args={[0.75, 0.1, 5.2]}
            position={[side * 4.56, 4.03, 0]}
            rotation={[0, 0, side * -0.65]}
          />
          <Wing side={side} />
        </group>
      ))}

      {/* Chamfered corners with matching colliders make an octagonal cabin. */}
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <group
            key={`${x}:${z}`}
            position={[x * 4.7, 2.25, z * 4.7]}
            rotation={[0, (-x * z * Math.PI) / 4, 0]}
          >
            <Plate at={[0, 0, 0]} size={[0.22, 4.5, 1.65]} color="#354c60" />
            <CuboidCollider args={[0.11, 2.25, 0.825]} />
          </group>
        )),
      )}

      {/* A solid rear bulkhead implies the rest of the ship beyond the door. */}
      <Plate at={[0, 2.25, 5.1]} size={[10.4, 4.5, 0.3]} color="#24394c" />
      {/* The port-side panel is owned by CrewDossier, including its frame. */}
      <group>
        <Plate
          at={[3.25, 1.65, 4.89]}
          size={[2.1, 2.9, 0.12]}
          color="#182c40"
        />
        <Plate
          at={[3.25, 2.85, 4.81]}
          size={[1.4, 0.04, 0.035]}
          color="#7297b0"
        />
        <Plate
          at={[3.25, 0.65, 4.81]}
          size={[1.4, 0.04, 0.035]}
          color="#7297b0"
        />
      </group>
      <CurvedRoof />
    </group>
  )
}
