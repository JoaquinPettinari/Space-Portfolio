import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { SRGBColorSpace } from 'three'
import {
  CONSOLE_ATLAS,
  createConsoleScreenGeometry,
  type ConsoleKind,
} from './refinedArtAssets'

/** Static instruments behind the live terminal UI; anchors and hit targets stay intact. */
export function ConsoleDisplay({
  kind,
  highlighted,
  width,
  height,
  position,
}: {
  kind: ConsoleKind
  highlighted: boolean
  width: number
  height: number
  position: [number, number, number]
}) {
  const texture = useTexture(CONSOLE_ATLAS, (loaded) => {
    if (!Array.isArray(loaded)) loaded.colorSpace = SRGBColorSpace
  })
  const geometry = useMemo(
    () => createConsoleScreenGeometry(kind, width, height),
    [kind, width, height],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh
      position={position}
      geometry={geometry}
      userData={{ interaction: kind }}
    >
      <meshBasicMaterial
        map={texture}
        color={highlighted ? '#ffffff' : '#d5e4e8'}
        toneMapped={false}
      />
    </mesh>
  )
}
