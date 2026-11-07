import { PHOTO_POSITION } from '../interaction/station'
import { useTexture } from '@react-three/drei'
import { SRGBColorSpace } from 'three'
import { projectImages } from '../../data/projectImages'

const inspectionImage = projectImages.routewise[0]
export function ProjectPhoto() {
  const texture = useTexture(inspectionImage.src, (loaded) => {
    if (!Array.isArray(loaded)) loaded.colorSpace = SRGBColorSpace
  })
  return (
    <group
      position={[...PHOTO_POSITION]}
      rotation={[0, Math.PI / 2, 0]}
      userData={{ interaction: 'photo' }}
    >
      <mesh>
        <boxGeometry args={[1.5, 1, 0.06]} />
        <meshStandardMaterial color="#304e62" />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[1.4, 0.85]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  )
}
