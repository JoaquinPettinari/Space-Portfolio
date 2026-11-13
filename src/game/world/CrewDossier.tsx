import { useTexture } from '@react-three/drei'
import { SRGBColorSpace } from 'three'
import { bridgePoint } from './bridgePlacement'
import type { StationTarget } from '../interaction/station'

/** A wall-mounted copy of the supplied CV, facing into the rear of the cabin. */
export function CrewDossier({ target }: { target: StationTarget }) {
  const texture = useTexture('/images/crew-dossier.webp', (loaded) => {
    if (!Array.isArray(loaded)) loaded.colorSpace = SRGBColorSpace
  })
  return (
    <group
      position={bridgePoint([-3.25, 1.65, 4.83])}
      rotation={[0, Math.PI, 0]}
    >
      <mesh userData={{ interaction: 'dossier' }}>
        <boxGeometry args={[1.8, 2.5, 0.1]} />
        <meshStandardMaterial
          color="#1c3444"
          metalness={0.4}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[0, 0, 0.056]} userData={{ interaction: 'dossier' }}>
        <planeGeometry args={[1.55, 2.18]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.25, 0.01]} userData={{ interaction: 'dossier' }}>
        <boxGeometry args={[1.8, 0.035, 0.1]} />
        <meshBasicMaterial
          color={target === 'dossier' ? '#ffffff' : '#66d7ef'}
        />
      </mesh>
    </group>
  )
}
