import { useEffect, useMemo } from 'react'
import { ConvexHullCollider } from '@react-three/rapier'
import { BackSide, DoubleSide } from 'three'
import { createRoofVisuals } from './roofVisuals'

export function BridgeRoof() {
  const roof = useMemo(() => createRoofVisuals(), [])
  useEffect(() => () => roof.dispose(), [roof])
  return (
    <group name="sloped-panoramic-roof">
      {roof.colliders.map((hull, i) => (
        <ConvexHullCollider key={i} args={[hull]} />
      ))}
      <mesh geometry={roof.opaque}>
        <meshStandardMaterial
          color="#292f34"
          roughness={0.65}
          metalness={0.25}
          side={DoubleSide}
        />
      </mesh>
      <mesh geometry={roof.glass}>
        <meshBasicMaterial
          color="#809eae"
          transparent
          opacity={0.045}
          depthWrite={false}
          side={BackSide}
        />
      </mesh>
    </group>
  )
}
