import { useEffect, useMemo } from 'react'
import { buildExteriorDeck } from './exteriorDeck'
import { EXTERIOR_PANELS } from './exteriorPanels'
import { StaticPanels } from './StaticPanels'

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
      <StaticPanels panels={EXTERIOR_PANELS} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.7, 0.66, -7.8]}>
            <boxGeometry args={[0.06, 0.04, 0.3]} />
            <meshBasicMaterial color={side < 0 ? '#ef8b69' : '#78c6c4'} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
