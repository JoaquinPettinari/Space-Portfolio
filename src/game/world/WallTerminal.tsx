import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { StationTarget } from '../interaction/station'
import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

/** Live label and collider; Blender supplies the manufactured monitor shell. */
export function WallTerminal({
  kind,
  position,
  rotation = 0,
  target,
}: {
  kind: 'communications' | 'personal' | 'arcade'
  position: [number, number, number]
  rotation?: number
  target: StationTarget
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 660
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#09232d'
      ctx.fillRect(0, 0, 660, 480)
      ctx.strokeStyle = '#56838c'
      ctx.strokeRect(20, 20, 620, 440)
      ctx.fillStyle = '#b9edf0'
      ctx.textAlign = 'center'
      ctx.font = 'bold 34px sans-serif'
      const lines =
        kind === 'arcade'
          ? ['RECREATION', 'TERMINAL']
          : kind === 'personal'
            ? ['PERSONAL', 'WORKSTATION']
            : ['EARTH', 'COMMUNICATIONS']
      lines.forEach((line, i) => ctx.fillText(line, 330, 215 + i * 52))
      ctx.font = '20px sans-serif'
      ctx.fillText(
        kind === 'arcade' ? 'COMMANDS · MINIGAMES' : 'CRUZ DEL SUR · CDS-01',
        330,
        390,
      )
    }
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    return result
  }, [kind])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      rotation={[0, rotation, 0]}
    >
      <CuboidCollider args={[0.65, 0.55, 0.12]} />
      <group userData={{ interaction: kind }}>
        {/* Shell and mounting foot are supplied by BridgeInterior. */}
        <mesh position={[0, 0.03, 0.13]}>
          <planeGeometry args={[1.1, 0.8]} />
          <meshBasicMaterial
            map={texture}
            color={target === kind ? '#ffffff' : '#d5e4e8'}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}
