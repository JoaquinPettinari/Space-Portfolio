import { CuboidCollider } from '@react-three/rapier'
import { FrontSide } from 'three'
import { BOW_EDGES, segmentPose, roofHeight } from './bridgeLayout'
import { BridgeDesignation } from './BridgeDesignation'
import { BridgeRoof } from './BridgeRoof'
import { ExteriorHull } from './ExteriorHull'
import { HullPanel } from './HullPanel'

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

/** Structural skin and local colliders; broad room bounds remain in Greybox. */
export function ShipHull() {
  return (
    <group name="panoramic-industrial-bridge">
      {BOW_EDGES.map(([a, b], index) => {
        const edge = segmentPose(a, b)
        const leftHeight = roofHeight(a[1]),
          rightHeight = roofHeight(b[1]),
          height = Math.max(leftHeight, rightHeight)
        return (
          <group
            key={index}
            position={[edge.x, 0, edge.z]}
            rotation={[0, edge.yaw, 0]}
          >
            <CuboidCollider
              args={[edge.length / 2, height / 2, 0.1]}
              position={[0, height / 2, 0]}
            />
            {/* Lower hull skin is supplied by the Blender interior. */}
            <HullPanel
              glass
              side={FrontSide}
              points={[
                [-edge.length / 2, 0.8, 0],
                [edge.length / 2, 0.8, 0],
                [edge.length / 2, rightHeight, 0],
                [-edge.length / 2, leftHeight, 0],
              ]}
            />
            {[-1, 1].map((end) => (
              <Plate
                key={end}
                at={[
                  end * (edge.length / 2 - 0.055),
                  (0.8 + (end < 0 ? leftHeight : rightHeight)) / 2,
                  0,
                ]}
                size={[0.11, (end < 0 ? leftHeight : rightHeight) - 0.8, 0.22]}
              />
            ))}
            <Plate
              at={[0, 0.82, 0.11]}
              size={[edge.length - 0.2, 0.025, 0.025]}
              color="#e8ad70"
              glow
            />
          </group>
        )
      })}
      {[-1, 1].map((side) => (
        <group key={side}>
          <CuboidCollider
            args={[0.1, 1.65, 2.35]}
            position={[side * 4.8, 1.65, 2.75]}
          />
          <Plate
            at={[side * 4.8, 2.05, 2.75]}
            size={[0.2, 2.5, 4.7]}
            color="#b1b0a6"
          />
          {[1.2, 4.45].map((z) => (
            <Plate key={z} at={[side * 4.66, 2.2, z]} size={[0.08, 2.3, 0.1]} />
          ))}
          <Plate
            at={[side * 4.66, 3.28, 2.65]}
            size={[0.07, 0.045, 4.1]}
            color="#ffd09a"
            glow
          />
        </group>
      ))}
      {/* Rear facade and recessed niches are in BridgeInterior; Greybox retains collisions. */}
      {/* Reserved technical service panel; no interaction until separately implemented. */}
      <group position={[4.58, 1.55, 3.65]} rotation={[0, -Math.PI / 2, 0]}>
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
      <BridgeDesignation />
      <BridgeRoof />
      <ExteriorHull />
    </group>
  )
}
