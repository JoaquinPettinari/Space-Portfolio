import { useGLTF } from '@react-three/drei'

/** Only the cropped nose; the fixed docking hatch keeps this space inaccessible.
 * Shares GameWorld's Suspense boundary so readiness includes the model/textures.
 * Coordinates and materials are authored in Blender; no per-frame work or lights.
 */
export function ParkedPampa() {
  const { scene } = useGLTF('/models/pampa-interior-nose.glb')
  return <primitive object={scene} dispose={null} />
}
