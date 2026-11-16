import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { RADIO_TRACKS } from '../radioMusic'
import {
  RADIO_POSITION,
  TERMINAL_SCREENS,
  terminalHtmlScale,
} from '../interaction/station'
import { useShipRadio } from '../useShipRadio'
import { RadioPanel } from '../ui/RadioPanel'
import { PhysicalScreen } from './PhysicalScreen'
import { StaticPanels, type StaticPanel } from './StaticPanels'

const details: StaticPanel[] = [
  { at: [0, 0, 0], size: [0.78, 0.4, 0.28], color: '#544a3c', metalness: 0.65 },
  { at: [0, 0, 0.146], size: [0.72, 0.34, 0.022], color: '#18232b' },
  { at: [0.065, 0.02, 0.162], size: [0.46, 0.27, 0.012], color: '#031520' },
  {
    at: [0.065, -0.127, 0.17],
    size: [0.4, 0.007, 0.009],
    color: '#55e6f0',
    glow: true,
  },
  ...[-1, 1].flatMap((side): StaticPanel[] => [
    {
      at: [side * 0.365, 0.165, 0.16],
      size: [0.04, 0.035, 0.02],
      color: '#ba7a3d',
    },
    {
      at: [side * 0.365, -0.165, 0.16],
      size: [0.04, 0.035, 0.02],
      color: '#ba7a3d',
    },
    { at: [side * 0.27, -0.22, 0], size: [0.1, 0.04, 0.17], color: '#172127' },
  ]),
  ...Array.from({ length: 13 }, (_, i): StaticPanel => ({
    at: [-0.255, -0.12 + i * 0.02, 0.168],
    size: [0.11, 0.008, 0.014],
    color: '#4a5358',
  })),
  { at: [0, 0.25, -0.025], size: [0.42, 0.04, 0.055], color: '#1b2326' },
  ...[-1, 1].map((side): StaticPanel => ({
    at: [side * 0.19, 0.21, -0.025],
    size: [0.04, 0.07, 0.055],
    color: '#1b2326',
  })),
]

/** One compact desk prop. No lights, shadows, physics or frame callbacks. */
export function ShipRadio({
  active,
  paused,
  onClose,
}: {
  active: boolean
  paused: boolean
  onClose: () => void
}) {
  const radio = useShipRadio(paused)
  const display = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#061b28'
      ctx.fillRect(0, 0, 512, 256)
      ctx.fillStyle = '#73f4f8'
      ctx.font = 'bold 36px monospace'
      ctx.fillText('CDS RADIO', 28, 52)
      ctx.font = '24px monospace'
      ctx.fillText(RADIO_TRACKS[radio.track].title, 28, 97)
      ctx.fillStyle = '#7aaebd'
      ctx.font = '19px monospace'
      ctx.fillText('ORIGINAL / LO-FI SPACE', 28, 134)
      for (let i = 0; i < 25; i++) {
        const height = radio.playing ? 10 + ((i * 23) % 38) : 4
        ctx.fillStyle = radio.playing ? '#4df2ed' : '#21505e'
        ctx.fillRect(28 + i * 18, 205 - height, 10, height)
      }
      ctx.font = '18px monospace'
      ctx.fillStyle = '#b4ebf1'
      ctx.fillText(
        radio.playing ? 'ON AIR      E · CONTROLS' : 'STANDBY     E · TUNE IN',
        28,
        237,
      )
    }
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [radio.playing, radio.track])
  useEffect(() => () => display.dispose(), [display])
  const screen = TERMINAL_SCREENS.radio
  return (
    <>
      <group
        name="cds-desk-radio"
        position={RADIO_POSITION}
        rotation={[0, Math.PI / 2, 0]}
        userData={{ interaction: 'radio' }}
      >
        <StaticPanels panels={details} />
        <mesh position={[0.328, 0.08, 0.175]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.034, 0.034, 0.025, 16]} />
          <meshStandardMaterial
            color="#b28d59"
            metalness={0.65}
            roughness={0.35}
          />
        </mesh>
        <mesh position={[-0.22, 0.39, -0.07]} rotation={[0, 0, 0.55]}>
          <cylinderGeometry args={[0.005, 0.007, 0.45, 8]} />
          <meshStandardMaterial
            color="#b3bdba"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0.06, 0.02, 0.171]}>
          <planeGeometry args={[0.4, 0.22]} />
          <meshBasicMaterial map={display} toneMapped={false} />
        </mesh>
      </group>
      {active && (
        <PhysicalScreen
          position={screen.position}
          rotation={screen.rotation}
          distanceFactor={terminalHtmlScale('radio')}
        >
          <RadioPanel radio={radio} onClose={onClose} />
        </PhysicalScreen>
      )}
    </>
  )
}
