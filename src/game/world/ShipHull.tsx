import { useMemo } from 'react'
import { CuboidCollider } from '@react-three/rapier'
import { DoubleSide, Shape } from 'three'

type XYZ = [number, number, number]

function Plate({
  at,
  size,
  rotation,
  color = '#252b31',
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

/** Structural skin and local colliders; broad room bounds remain in Greybox. */
export function ShipHull() {
  return (
    <group name="panoramic-industrial-bridge">
      <Plate at={[0, 0.6, -5.1]} size={[8, 1.2, 0.24]} />
      <Plate at={[0, 3.95, -5.1]} size={[8, 1.2, 0.3]} />
      <Glass at={[0, 2.3, -5.08]} size={[8, 2.1]} />
      <Plate
        at={[0, 1.24, -4.92]}
        size={[8, 0.055, 0.08]}
        color="#e8ad70"
        glow
      />
      <Plate at={[0, 3.38, -4.92]} size={[8, 0.1, 0.12]} />
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Diagonal glazing replaces the old opaque forward chamfer. */}
          <group
            position={[side * 4.5, 2.25, -4.5]}
            rotation={[0, (side * Math.PI) / 4, 0]}
          >
            <CuboidCollider args={[0.1, 2.25, Math.SQRT2 / 2]} />
            <Plate at={[0, -1.65, 0]} size={[0.2, 1.2, Math.SQRT2]} />
            <Plate at={[0, 1.7, 0]} size={[0.2, 1.1, Math.SQRT2]} />
            {[-1, 1].map((end) => (
              <Plate
                key={end}
                at={[0, 0, end * (Math.SQRT2 / 2 - 0.07)]}
                size={[0.22, 2.3, 0.14]}
              />
            ))}
            <Glass
              at={[0, 0.05, 0]}
              size={[Math.SQRT2 - 0.28, 2.1]}
              rotation={[0, Math.PI / 2, 0]}
            />
            <Plate
              at={[-side * 0.12, -1.02, 0]}
              size={[0.025, 0.035, Math.SQRT2 - 0.28]}
              color="#e8ad70"
              glow
            />
          </group>
          <Plate at={[side * 5.1, 0.6, 0.5]} size={[0.24, 1.2, 9]} />
          <Plate at={[side * 5.1, 3.95, 0.5]} size={[0.3, 1.2, 9]} />
          <Glass
            at={[side * 5.08, 2.3, -2]}
            size={[4, 2.1]}
            rotation={[0, Math.PI / 2, 0]}
          />
          <Plate
            at={[side * 4.94, 1.24, -2]}
            size={[0.055, 0.055, 4]}
            color="#e8ad70"
            glow
          />
          {/* Opaque rear service zones support memories, desk and technical panel. */}
          <Plate at={[side * 5.02, 2.25, 0.1]} size={[0.28, 2.3, 0.22]} />
          <Plate
            at={[side * 5.02, 2.25, 2.55]}
            size={[0.28, 2.3, 4.7]}
            color="#b1b0a6"
          />
          <CuboidCollider
            args={[0.14, 1.15, 2.35]}
            position={[side * 5.02, 2.25, 2.55]}
          />
          {[1.05, 4.45].map((z) => (
            <Plate key={z} at={[side * 4.85, 2.2, z]} size={[0.08, 2.3, 0.1]} />
          ))}
          <Plate
            at={[side * 4.84, 3.28, 2.65]}
            size={[0.07, 0.045, 4.1]}
            color="#ffd09a"
            glow
          />
          <group
            position={[side * 4.7, 2.25, 4.7]}
            rotation={[0, (-side * Math.PI) / 4, 0]}
          >
            <Plate at={[0, 0, 0]} size={[0.22, 4.5, 1.65]} />
            <CuboidCollider args={[0.11, 2.25, 0.825]} />
          </group>
          <Wing side={side} />
        </group>
      ))}
      {/* Keep the clear airlock doorway, width 2.5 and height 3.3. */}
      {[-3.225, 3.225].map((x) => (
        <Plate
          key={x}
          at={[x, 2.25, 5.1]}
          size={[3.95, 4.5, 0.3]}
          color="#41494e"
        />
      ))}
      {/* Reserved technical service panel; no interaction until separately implemented. */}
      <group position={[4.78, 1.55, 3.65]} rotation={[0, -Math.PI / 2, 0]}>
        <Plate at={[0, 0, 0]} size={[0.9, 1.2, 0.16]} />
        <CuboidCollider args={[0.45, 0.6, 0.08]} />
        <Plate
          at={[0, 0.18, 0.085]}
          size={[0.64, 0.43, 0.02]}
          color="#102b33"
        />
        {[-0.2, 0, 0.2].map((x) => (
          <Plate
            key={x}
            at={[x, -0.25, 0.09]}
            size={[0.08, 0.06, 0.025]}
            color="#77c7d4"
            glow
          />
        ))}
      </group>
      <Plate at={[0, 3.9, 5.1]} size={[2.5, 1.2, 0.3]} />
      <group name="industrial-bridge-ceiling">
        <Plate at={[0, 4.4, 0]} size={[10, 0.2, 10]} color="#171c22" />
        <CuboidCollider args={[5, 0.1, 5]} position={[0, 4.4, 0]} />
        {[-3.6, -1.2, 1.2, 3.6].map((z) => (
          <group key={z}>
            <Plate at={[0, 3.48, z]} size={[9.8, 0.36, 0.22]} />
            <CuboidCollider args={[4.9, 0.18, 0.11]} position={[0, 3.48, z]} />
            {[-3, 0, 3].map((x) => (
              <Plate
                key={x}
                at={[x, 3.292, z]}
                size={[1.05, 0.025, 0.12]}
                color="#ffd09a"
                glow
              />
            ))}
          </group>
        ))}
        {[-2.6, 0, 2.6].map((x) => (
          <group key={x}>
            <Plate
              at={[x, 3.92, 0]}
              size={[2.3, 0.1, 8.7]}
              color={x === 0 ? '#41474a' : '#333a3f'}
            />
            <CuboidCollider args={[1.15, 0.05, 4.35]} position={[x, 3.92, 0]} />
            <Plate
              at={[x - 1.1, 3.83, 0]}
              size={[0.07, 0.12, 8.7]}
              color="#171c22"
            />
            <Plate
              at={[x + 1.1, 3.83, 0]}
              size={[0.07, 0.12, 8.7]}
              color="#171c22"
            />
          </group>
        ))}
      </group>
    </group>
  )
}
