import {
  ConvexHullCollider,
  CuboidCollider,
  RigidBody,
} from '@react-three/rapier'
import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace, Shape } from 'three'
import { TERMINAL_SCREENS, type StationTarget } from '../interaction/station'
import { COMMAND_SEGMENTS, COMMAND_POSES } from './commandLayout'

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
    <mesh position={[0, 0, -0.003]} userData={{ interaction: kind }}>
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
  kind,
  target,
}: {
  kind: 'computer' | 'communications'
  target: StationTarget
}) {
  const screen = TERMINAL_SCREENS[kind]
  return (
    <group
      position={screen.position}
      rotation={[0, screen.rotation, 0]}
      userData={{ interaction: kind }}
    >
      <CuboidCollider args={[0.9, 0.55, 0.09]} position={[0, 0, -0.105]} />
      <Part at={[0, -0.55, -0.185]} size={[0.2, 0.3, 0.2]} />
      <Part
        at={[0, 0, -0.105]}
        size={[1.8, 1.1, 0.18]}
        color={target === kind ? '#52777b' : '#45494b'}
        interaction={kind}
      />
      <Part
        at={[0, 0, -0.01]}
        size={[1.6, 0.9, 0.01]}
        color="#09232d"
        interaction={kind}
      />
      <MonitorLabel kind={kind} />
      <Part
        at={[-0.55, -0.5, -0.005]}
        size={[0.16, 0.02, 0.015]}
        color="#83d1cd"
        light
        interaction={kind}
      />
      <Part
        at={[0, -0.585, 0.18]}
        size={[0.85, 0.05, 0.25]}
        color="#747974"
        interaction={kind}
      />
    </group>
  )
}

function CommandChair({ kind }: { kind: keyof typeof COMMAND_POSES }) {
  const pose = COMMAND_POSES[kind]
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      friction={0}
      position={pose.chair}
      rotation={[0, pose.rotation, 0]}
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

function ConsoleBody({
  footprint,
}: {
  footprint: readonly (readonly [number, number])[]
}) {
  const shape = useMemo(() => {
    const result = new Shape()
    footprint.forEach(([x, z], i) =>
      i ? result.lineTo(x, -z) : result.moveTo(x, -z),
    )
    result.closePath()
    return result
  }, [footprint])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[shape, { depth: 0.94, bevelEnabled: false }]} />
        <meshStandardMaterial
          color="#292d30"
          metalness={0.45}
          roughness={0.48}
        />
      </mesh>
      <mesh position={[0, 0.94, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[shape, { depth: 0.1, bevelEnabled: false }]} />
        <meshStandardMaterial
          color="#585e60"
          metalness={0.45}
          roughness={0.48}
        />
      </mesh>
    </group>
  )
}

/** Low continuous console leaves the panoramic centerline unobstructed. */
export function Workstation({ target }: { target: StationTarget }) {
  return (
    <group name="forward-command-console">
      <RigidBody type="fixed" colliders={false} friction={0}>
        {COMMAND_SEGMENTS.map((segment, index) => (
          <group key={index}>
            <ConvexHullCollider args={[segment.collider]} />
            <ConsoleBody footprint={segment.footprint} />
            <group
              position={[segment.x, 0, segment.z]}
              rotation={[0, segment.yaw, 0]}
            >
              <Part
                at={[0, 0.55, 0.526]}
                size={[segment.length - 0.4, 0.6, 0.02]}
                color="#a5a69b"
              />
              <Part
                at={[0, 0.93, 0.54]}
                size={[segment.length - 0.4, 0.025, 0.025]}
                color="#e6ad6a"
                light
              />
            </group>
          </group>
        ))}
        <CommandMonitor kind="computer" target={target} />
        <CommandMonitor kind="communications" target={target} />
        <Part at={[0, 1.05, -4.5]} size={[1.8, 0.1, 0.65]} color="#151e22" />
        {[-0.56, 0, 0.56].map((x, index) => (
          <group key={x}>
            <Part
              at={[x, 1.11, -4.6]}
              size={[0.43, 0.02, 0.32]}
              color="#22505b"
              light
            />
            <Part
              at={[x, 1.12, -4.34]}
              size={[0.09, 0.045, 0.09]}
              color={index === 1 ? '#d69b5c' : '#7eb8bc'}
            />
          </group>
        ))}
      </RigidBody>
      <CommandChair kind="computer" />
      <CommandChair kind="communications" />
    </group>
  )
}
