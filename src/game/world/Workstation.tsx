import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { StationTarget } from '../interaction/station'

function MonitorLabel({ kind }: { kind: 'computer' | 'communications' }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 768
    canvas.height = 432
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = '#09232d'
      context.fillRect(0, 0, 768, 432)
      context.strokeStyle = '#56838c'
      context.lineWidth = 3
      context.strokeRect(24, 24, 720, 384)
      context.fillStyle = '#b9edf0'
      context.textAlign = 'center'
      context.font = 'bold 45px sans-serif'
      const lines =
        kind === 'computer'
          ? ['CENTRAL', 'ARCHIVE']
          : ['EARTH', 'COMMUNICATIONS']
      lines.forEach((line, index) =>
        context.fillText(line, 384, 196 + index * 58),
      )
      context.font = '20px sans-serif'
      context.fillStyle = '#b9b5a5'
      context.fillText('CRUZ DEL SUR · CDS-01', 384, 353)
    }
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    return result
  }, [kind])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={[0, 1.65, -3.718]} userData={{ interaction: kind }}>
      <planeGeometry args={[1.6, 0.9]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

function Part({
  at,
  size,
  color = '#292d30',
  light = false,
  interaction,
}: {
  at: [number, number, number]
  size: [number, number, number]
  color?: string
  light?: boolean
  interaction?: Exclude<StationTarget, null>
}) {
  return (
    <mesh position={at} userData={{ interaction }}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={0.45}
        roughness={0.48}
        emissive={light ? color : '#000000'}
        emissiveIntensity={light ? 0.8 : 0}
      />
    </mesh>
  )
}

function CommandMonitor({
  x,
  kind,
  target,
}: {
  x: number
  kind: 'computer' | 'communications'
  target: StationTarget
}) {
  return (
    <group position={[x, 0, 0]} userData={{ interaction: kind }}>
      <CuboidCollider args={[0.9, 0.55, 0.09]} position={[0, 1.65, -3.82]} />
      <Part at={[0, 1.1, -3.9]} size={[0.2, 0.3, 0.2]} />
      <Part
        at={[0, 1.65, -3.82]}
        size={[1.8, 1.1, 0.18]}
        color={target === kind ? '#52777b' : '#45494b'}
        interaction={kind}
      />
      <Part
        at={[0, 1.65, -3.725]}
        size={[1.6, 0.9, 0.01]}
        color="#09232d"
        interaction={kind}
      />
      <MonitorLabel kind={kind} />
      <Part
        at={[-0.55, 1.15, -3.72]}
        size={[0.16, 0.02, 0.015]}
        color="#83d1cd"
        light
        interaction={kind}
      />
      <Part
        at={[0, 1.025, -3.6]}
        size={[0.85, 0.05, 0.25]}
        color="#747974"
        interaction={kind}
      />
    </group>
  )
}

function CommandChair({ x }: { x: number }) {
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      friction={0}
      position={[x, 0, -2.85]}
    >
      <CuboidCollider args={[0.42, 0.65, 0.42]} position={[0, 0.65, 0]} />
      <Part at={[0, 0.1, 0]} size={[0.8, 0.12, 0.8]} />
      <Part at={[0, 0.38, 0]} size={[0.15, 0.5, 0.15]} color="#727675" />
      <Part at={[0, 0.66, 0]} size={[0.76, 0.18, 0.72]} color="#49413b" />
      {/* Low back keeps the E ray and focused monitor view clear at eye height. */}
      <Part at={[0, 1.02, 0.34]} size={[0.76, 0.56, 0.14]} color="#49413b" />
      {[-0.36, 0.36].map((side) => (
        <Part key={side} at={[side, 0.88, 0]} size={[0.12, 0.1, 0.62]} />
      ))}
    </RigidBody>
  )
}

/** Low continuous console leaves the panoramic centerline unobstructed. */
export function Workstation({ target }: { target: StationTarget }) {
  return (
    <group name="forward-command-console">
      <RigidBody type="fixed" colliders={false} friction={0}>
        {[-2.4, 0, 2.4].map((x) => {
          const width = x === 0 ? 2 : 2.8
          return (
            <group key={x}>
              <CuboidCollider
                args={[width / 2, 0.5, 0.6]}
                position={[x, 0.5, -4]}
              />
              <Part at={[x, 0.5, -4]} size={[width, 1, 1.2]} />
              <Part
                at={[x, 0.56, -3.39]}
                size={[width - 0.16, 0.65, 0.02]}
                color="#a5a69b"
              />
              <Part
                at={[x, 0.98, -4]}
                size={[width, 0.04, 1.2]}
                color="#585e60"
              />
              <Part
                at={[x, 0.9, -3.375]}
                size={[width - 0.2, 0.025, 0.025]}
                color="#e6ad6a"
                light
              />
              <Part
                at={[x, 0.18, -3.375]}
                size={[width - 0.3, 0.12, 0.025]}
                color="#171d21"
              />
            </group>
          )
        })}
        <CommandMonitor x={-2.4} kind="computer" target={target} />
        <CommandMonitor x={2.4} kind="communications" target={target} />
        <Part at={[0, 1.05, -4.1]} size={[1.8, 0.1, 0.65]} color="#151e22" />
        {[-0.56, 0, 0.56].map((x, index) => (
          <group key={x}>
            <Part
              at={[x, 1.11, -4.2]}
              size={[0.43, 0.02, 0.32]}
              color="#22505b"
              light
            />
            <Part
              at={[x, 1.12, -3.94]}
              size={[0.09, 0.045, 0.09]}
              color={index === 1 ? '#d69b5c' : '#7eb8bc'}
            />
          </group>
        ))}
      </RigidBody>
      <CommandChair x={-2.4} />
      <CommandChair x={2.4} />
    </group>
  )
}
