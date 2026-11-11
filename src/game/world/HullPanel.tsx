import { useMemo } from 'react'
import { ConvexHullCollider } from '@react-three/rapier'
import { DoubleSide, type Side } from 'three'
import { ROOF_COLLIDER_MARGIN, type RoofPoint } from './bridgeLayout'

/** Planar convex panel, shared by the sloping canopy and its window openings. */
export function HullPanel({
  points,
  glass,
  collision = false,
  side = DoubleSide,
}: {
  points: readonly RoofPoint[]
  glass: boolean
  collision?: boolean
  side?: Side
}) {
  const data = useMemo(
    () => ({
      vertices: new Float32Array(points.flat()),
      indices: new Uint16Array(
        Array.from({ length: points.length - 2 }, (_, i) => [
          0,
          i + 1,
          i + 2,
        ]).flat(),
      ),
      // Conservative underside encloses the rotated 12 cm frames.
      hull: new Float32Array(
        [-ROOF_COLLIDER_MARGIN, 0.1].flatMap((dy) =>
          points.flatMap(([x, y, z]) => [x, y + dy, z]),
        ),
      ),
    }),
    [points],
  )
  return (
    <>
      {collision && <ConvexHullCollider args={[data.hull]} />}
      <mesh>
        <bufferGeometry onUpdate={(g) => g.computeVertexNormals()}>
          <bufferAttribute
            attach="attributes-position"
            args={[data.vertices, 3]}
          />
          <bufferAttribute attach="index" args={[data.indices, 1]} />
        </bufferGeometry>
        {glass ? (
          <meshBasicMaterial
            color="#809eae"
            transparent
            opacity={0.045}
            depthWrite={false}
            side={side}
          />
        ) : (
          <meshStandardMaterial
            color="#292f34"
            roughness={0.65}
            metalness={0.25}
            side={side}
          />
        )}
      </mesh>
    </>
  )
}
