import { useGLTF } from '@react-three/drei'

/** Fitted host hull: the playable upper-deck architecture occupies its opening. */
export function PlayerShipHull() {
  const { scene } = useGLTF('/models/cruz-del-sur-player-hull.glb')
  return (
    <group name="cruz-del-sur-player-hull">
      <primitive object={scene} dispose={null} />
    </group>
  )
}
