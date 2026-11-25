import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { StationTarget } from '../interaction/station'
import type { CoffeeState } from '../coffee'

export function CoffeeMachine({
  state,
  target,
}: {
  state: CoffeeState
  target: StationTarget
}) {
  const display = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 96
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#061c21'
      ctx.fillRect(0, 0, 256, 96)
      ctx.fillStyle = '#b3c5c6'
      ctx.font = '16px monospace'
      ctx.fillText('CAFE / CRUZ DEL SUR', 14, 23)
      ctx.fillStyle = state.phase === 'brewing' ? '#edbd79' : '#75d6cb'
      ctx.font = 'bold 24px monospace'
      ctx.fillText(
        state.phase === 'brewing'
          ? 'EXTRACTING...'
          : state.phase === 'ready'
            ? 'CUP READY'
            : 'ESPRESSO',
        14,
        59,
      )
      ctx.font = '12px monospace'
      ctx.fillText(
        state.phase === 'idle' ? 'PRESS E TO BREW' : 'PRESSURE 9 BAR',
        14,
        82,
      )
    }
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [state.phase])
  useEffect(() => () => display.dispose(), [display])

  return (
    <group name="galley-coffee-status" userData={{ interaction: 'coffee' }}>
      <mesh position={[2.804, 1.621, 1.0568]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.132, 0.0408]} />
        <meshBasicMaterial
          map={display}
          color={target === 'coffee' ? '#ffffff' : '#c5dddd'}
          toneMapped={false}
        />
      </mesh>
      {state.phase === 'brewing' && (
        <mesh position={[2.75, 1.369, 1.22]}>
          <cylinderGeometry args={[0.002, 0.002, 0.132, 8]} />
          <meshBasicMaterial color="#754227" />
        </mesh>
      )}
    </group>
  )
}
