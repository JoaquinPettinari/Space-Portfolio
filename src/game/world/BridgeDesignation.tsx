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
      context.fillText('CDS-01 / CUBIERTA 01 / PROA', 256, 22)
      context.fillStyle = '#dddcd0'
      context.font = 'bold 22px monospace'
      context.fillText('PUENTE DE EXPLORACIÓN', 256, 48)
      context.strokeStyle = '#e6ad6a'
      context.lineWidth = 2
      for (let i = 0; i < 3; i++) {
        context.beginPath()
        context.moveTo(21 + i * 8, 27)
        context.lineTo(29 + i * 8, 32)
        context.lineTo(21 + i * 8, 37)
        context.stroke()
      }
      context.fillStyle = 'rgba(220,222,204,0.12)'
      for (let i = 0; i < 10; i++)
        context.fillRect(46 + i * 43, 57 + (i % 2), 9, 1)
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
