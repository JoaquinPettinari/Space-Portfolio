import { useMemo } from 'react'
import { ConvexHullCollider } from '@react-three/rapier'
import { Shape } from 'three'
import { BRIDGE_FLOOR_VERTICES, BRIDGE_OUTLINE } from './bridgeLayout'

export function BridgeFloor() {
  const shape = useMemo(() => {
    const result = new Shape()
    BRIDGE_OUTLINE.forEach(([x, z], index) =>
      index ? result.lineTo(x, -z) : result.moveTo(x, -z),
    )
    result.closePath()
    return result
  }, [])
  return (
    <>
      <ConvexHullCollider args={[BRIDGE_FLOOR_VERTICES]} />
      <mesh
        name="continuous-cabin-floor"
        position={[0, -0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <extrudeGeometry args={[shape, { depth: 0.2, bevelEnabled: false }]} />
        <meshStandardMaterial
          color="#303538"
          metalness={0.35}
          roughness={0.32}
        />
      </mesh>
    </>
  )
}
