import { useTexture } from '@react-three/drei'
import { SRGBColorSpace } from 'three'
import { TACTICAL_SURFACE } from './refinedArtAssets'

/** Blender's instrument chart under the existing live tactical projector. */
export function TacticalSurface() {
  const texture = useTexture(TACTICAL_SURFACE, (loaded) => {
    if (!Array.isArray(loaded)) loaded.colorSpace = SRGBColorSpace
  })
  return (
    <mesh position={[0, 1.074, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.78, 2.38]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}
