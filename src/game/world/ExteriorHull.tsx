import { useEffect, useMemo } from 'react'
import { buildExteriorDeck } from './exteriorDeck'
import { BOW_EDGES, segmentPose } from './bridgeLayout'

/** Lightweight visible hull only. The interior envelope owns all collisions. */
export function ExteriorHull() {
  const deck = useMemo(() => buildExteriorDeck(), [])
  useEffect(() => () => deck.dispose(), [deck])
  return (
    <group name="exploration-exterior-hull">
      <mesh name="exploration-bow-deck" geometry={deck}>
        <meshStandardMaterial
          attach="material-0"
          color="#303c46"
          metalness={0.55}
          roughness={0.55}
        />
        <meshStandardMaterial
          attach="material-1"
          color="#7a858b"
          metalness={0.55}
          roughness={0.48}
        />
        <meshStandardMaterial
          attach="material-2"
          color="#111c24"
          metalness={0.25}
          roughness={0.78}
        />
        <meshStandardMaterial
          attach="material-3"
          color="#ffc887"
          emissive="#ffb65e"
          emissiveIntensity={1.3}
          roughness={0.45}
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
          <mesh position={[side * 0.7, 0.66, -7.8]}>
            <boxGeometry args={[0.06, 0.04, 0.3]} />
            <meshBasicMaterial color={side < 0 ? '#ef8b69' : '#78c6c4'} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
