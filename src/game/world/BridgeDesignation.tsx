import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

/** Small physical enamel plate above the rear opening; no gameplay/UI role. */
export function BridgeDesignation() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 64
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = '#252b31'
      context.fillRect(0, 0, 512, 64)
      context.fillStyle = '#e6ad6a'
      context.fillRect(8, 8, 4, 48)
      context.fillRect(500, 8, 4, 48)
      context.textAlign = 'center'
      context.fillStyle = '#a5b7bc'
      context.font = '12px monospace'
      context.fillText('CRUZ DEL SUR / CDS-01', 256, 22)
      context.fillStyle = '#dddcd0'
      context.font = 'bold 22px monospace'
      context.fillText('OBSERVATION DECK', 256, 48)
    }
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    return result
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh
      name="bridge-entry-designation"
      position={[0, 2.91, 4.94]}
      rotation={[0, Math.PI, 0]}
    >
      <planeGeometry args={[2, 0.25]} />
      <meshStandardMaterial map={texture} roughness={0.7} metalness={0.15} />
    </mesh>
  )
}
