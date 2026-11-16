import { useEffect, useMemo } from 'react'
import { TRANSITION_START } from './bridgePlacement'
import { createBridgeThroatGeometry } from './bridgeThroatGeometry'

/** Static trim only: the existing portal, player and glass colliders keep ownership. */
export function BridgeThroatFrame() {
  const geometry = useMemo(() => createBridgeThroatGeometry(), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group
      name="rounded-bridge-throat"
      position={[0, 0, TRANSITION_START + 0.09]}
    >
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#46545b"
          metalness={0.58}
          roughness={0.42}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 1.27, 2.45, 0.155]}
          rotation={[0, 0, (side * Math.PI) / 4]}
        >
          <boxGeometry args={[0.036, 0.34, 0.018]} />
          <meshStandardMaterial
            color="#f6c37b"
            emissive="#f6c37b"
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}
