import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { EVA_EQUIPMENT_LAYOUT } from './evaEquipmentLayout'

/** Static, reduced NASA EMU equipment. The niche owns its collision, and cached
 * GLTF resources remain owned by the loader. See docs/assets/nasa-emu/README.md. */
export function EVAEquipment() {
  const { scene } = useGLTF('/models/cruz-del-sur-eva-suit.glb')
  const root = useMemo(() => scene.clone(true), [scene])
  return (
    <group
      position={EVA_EQUIPMENT_LAYOUT.position}
      rotation={[0, Math.PI, 0]}
      name="arrival-eva-equipment"
      raycast={() => false}
    >
      <primitive object={root} dispose={null} />
    </group>
  )
}
