import { useTexture } from '@react-three/drei'
import { SRGBColorSpace } from 'three'
import { TACTICAL_SURFACE } from './refinedArtAssets'
import { TACTICAL_TABLE_SURFACE } from './tacticalDisplayLayout'

/** Blender's instrument chart under the existing live tactical projector. */
export function TacticalSurface() {
  const texture = useTexture(TACTICAL_SURFACE, (loaded) => {
    if (!Array.isArray(loaded)) loaded.colorSpace = SRGBColorSpace
  })
  return (
    <mesh
      position={[0, TACTICAL_TABLE_SURFACE.position[1], 0]}
      rotation={[TACTICAL_TABLE_SURFACE.pitch, 0, 0]}
    >
      <planeGeometry args={[...TACTICAL_TABLE_SURFACE.size]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}
