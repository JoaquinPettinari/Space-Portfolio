import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { profile } from '../../data/portfolio'

/** Physical standby display; focused accessible identity UI remains unchanged. */
export function CrewStandbyScreen({
  verified,
  scanning,
}: {
  verified: boolean
  scanning: boolean
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 704
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const accent = verified ? '#83e5b4' : '#77d9e7'
      ctx.fillStyle = '#07151d'
      ctx.fillRect(0, 0, 704, 512)
      ctx.strokeStyle = '#315461'
      ctx.lineWidth = 2
      ctx.strokeRect(18, 18, 668, 476)
      ctx.textAlign = 'center'
      ctx.fillStyle = accent
      ctx.font = 'bold 32px sans-serif'
      ctx.fillText('CREW ACCESS', 352, 70)
      ctx.fillStyle = '#9bb5be'
      ctx.font = '16px monospace'
      ctx.fillText('CRUZ DEL SUR / CDS-01', 352, 100)
      // ID card symbol, matching the focused identification display.
      ctx.strokeStyle = accent
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(237, 137, 230, 128, 12)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(294, 179, 17, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(294, 226, 28, Math.PI, 0)
      ctx.stroke()
      for (const y of [174, 199, 224]) {
        ctx.beginPath()
        ctx.moveTo(350, y)
        ctx.lineTo(435, y)
        ctx.stroke()
      }
      ctx.fillStyle = accent
      ctx.font = 'bold 30px sans-serif'
      ctx.fillText(
        verified
          ? 'ACCESS GRANTED'
          : scanning
            ? 'READING CREW CARD'
            : 'SCAN CREW CARD',
        352,
        323,
      )
      ctx.fillStyle = '#e5edf0'
      ctx.font = '24px sans-serif'
      ctx.fillText(
        verified ? profile.name : 'Crew identification terminal',
        352,
        367,
      )
      ctx.fillStyle = '#a8bec6'
      ctx.font = '19px sans-serif'
      ctx.fillText(
        verified
          ? 'Welcome aboard · Identity verified'
          : scanning
            ? 'Verification in progress…'
            : 'Press E to verify your credentials',
        352,
        405,
      )
      ctx.fillStyle = accent
      ctx.fillRect(48, 447, 608, 2)
      ctx.font = '15px monospace'
      ctx.fillText(
        verified ? 'E · VIEW CREW RECORD' : 'READER ONLINE',
        352,
        477,
      )
    }
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    return result
  }, [verified, scanning])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={[0, 0.03, 0.132]} name="crew-standby-display">
      <planeGeometry args={[1.1, 0.8]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}
