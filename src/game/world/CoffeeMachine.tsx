import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { COFFEE_POSITION, type StationTarget } from '../interaction/station'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { CoffeeState } from '../coffee'
import { COFFEE_FINISHES, createCoffeeGeometry } from './coffeeGeometry'

const finishes = {
  body: { color: '#26323a', metalness: 0.45, roughness: 0.42 },
  steel: { color: '#9ba2a3', metalness: 0.8, roughness: 0.29 },
  rubber: { color: '#10191e', metalness: 0, roughness: 0.72 },
  trim: { color: '#b99b64', metalness: 0.45, roughness: 0.5 },
}
export function CoffeeMachine({
  state,
  target,
}: {
  state: CoffeeState
  target: StationTarget
}) {
  const model = useMemo(() => createCoffeeGeometry(), [])
  useEffect(() => () => model.dispose(), [model])
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
    <RigidBody
      type="fixed"
      colliders={false}
      position={[...COFFEE_POSITION]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <CuboidCollider args={[0.4, 0.75, 0.36]} position={[0, 0.75, 0]} />
      <group userData={{ interaction: 'coffee' }}>
        {COFFEE_FINISHES.map((finish) => (
          <mesh key={finish} geometry={model.geometries[finish]}>
            <meshStandardMaterial {...finishes[finish]} />
          </mesh>
        ))}
        <mesh position={[-0.035, 1.41, 0.175]}>
          <planeGeometry args={[0.3, 0.11]} />
          <meshBasicMaterial
            map={display}
            color={target === 'coffee' ? '#ffffff' : '#c5dddd'}
            toneMapped={false}
          />
        </mesh>
        {(state.phase === 'ready' || state.phase === 'brewing') && (
          <group position={[0, 1.018, 0.18]}>
            <mesh geometry={model.cup}>
              <meshStandardMaterial color="#e5e7dd" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.071, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.072, 24]} />
              <meshStandardMaterial color="#382019" roughness={0.24} />
            </mesh>
          </group>
        )}
        {state.phase === 'brewing' && (
          <mesh position={[0, 1.1, 0.17]}>
            <cylinderGeometry args={[0.004, 0.004, 0.025, 8]} />
            <meshBasicMaterial color="#754227" />
          </mesh>
        )}
      </group>
    </RigidBody>
  )
}
