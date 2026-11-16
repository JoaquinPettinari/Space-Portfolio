import { useEffect, useMemo } from 'react'
import { createAstronautGloveGeometry } from './astronautGloveGeometry'

/** Both gestures use the same silhouette, fabric, cuff and finger construction. */
export function AstronautGlove({ overlay = false }: { overlay?: boolean }) {
  const geometry = useMemo(() => createAstronautGloveGeometry(), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh
      geometry={geometry}
      raycast={() => {}}
      name="astronaut-pressure-glove"
      renderOrder={overlay ? 1004 : 0}
    >
      {overlay ? (
        <meshBasicMaterial vertexColors depthTest={false} depthWrite={false} />
      ) : (
        <meshStandardMaterial vertexColors roughness={0.76} metalness={0.12} />
      )}
    </mesh>
  )
}
