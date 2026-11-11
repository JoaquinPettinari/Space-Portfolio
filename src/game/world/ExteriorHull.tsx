import { useMemo } from 'react'
import { BOW_EDGES, NOSE_DECK, segmentPose } from './bridgeLayout'

/** Lightweight visible hull only. The interior envelope owns all collisions. */
export function ExteriorHull() {
  const deck = useMemo(() => {
    const top = NOSE_DECK.flatMap((p) => [...p])
    const bottom = NOSE_DECK.flatMap(([x, y, z]) => [x, y - 0.25, z])
    return {
      vertices: new Float32Array([...top, ...bottom]),
      indices: new Uint16Array([
        0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2,
        2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0,
      ]),
    }
  }, [])
  return (
    <group name="exploration-exterior-hull">
      <mesh name="exploration-bow-deck">
        <bufferGeometry
          onUpdate={(geometry) => geometry.computeVertexNormals()}
        >
          <bufferAttribute
            attach="attributes-position"
            args={[deck.vertices, 3]}
          />
          <bufferAttribute attach="index" args={[deck.indices, 1]} />
        </bufferGeometry>
        <meshStandardMaterial
          color="#535b60"
          metalness={0.4}
          roughness={0.65}
        />
      </mesh>
      {/* Edge axes use +Z inward; negative local Z places plating outside. */}
      {BOW_EDGES.map(([a, b], index) => {
        const edge = segmentPose(a, b)
        return (
          <group
            key={index}
            position={[edge.x, 0, edge.z]}
            rotation={[0, edge.yaw, 0]}
          >
            <mesh name={`exterior-facet-${index}`} position={[0, 0.45, -0.35]}>
              <boxGeometry args={[edge.length + 0.12, 0.3, 0.7]} />
              <meshStandardMaterial
                color="#394249"
                metalness={0.35}
                roughness={0.65}
              />
            </mesh>
            {[-0.32, 0.32].map((fraction) => (
              <mesh
                key={fraction}
                position={[edge.length * fraction, 0.62, -0.35]}
              >
                <boxGeometry args={[0.055, 0.04, 0.7]} />
                <meshStandardMaterial color="#778087" roughness={0.75} />
              </mesh>
            ))}
          </group>
        )
      })}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 5.05, 0.45, 3.2]}>
            <boxGeometry args={[0.7, 0.3, 5.6]} />
            <meshStandardMaterial
              color="#394249"
              metalness={0.35}
              roughness={0.65}
            />
          </mesh>
          <mesh position={[side * 0.7, 0.59, -7.8]}>
            <boxGeometry args={[0.06, 0.04, 0.3]} />
            <meshBasicMaterial color={side < 0 ? '#ef8b69' : '#78c6c4'} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
