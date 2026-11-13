import {
  ConvexHullCollider,
  CuboidCollider,
  RigidBody,
} from '@react-three/rapier'
import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { BridgeInterior } from './BridgeInterior'
import { BRIDGE_OFFSET_Z, bridgePoint } from './bridgePlacement'
import { TERMINAL_SCREENS, type StationTarget } from '../interaction/station'
import { COMMAND_SEGMENTS, COMMAND_POSES, SIDE_CHAIRS } from './commandLayout'

function MonitorLabel({
  kind,
  highlighted,
}: {
  kind: 'computer' | 'communications'
  highlighted: boolean
}) {
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
      <meshBasicMaterial
        map={texture}
        color={highlighted ? '#ffffff' : '#d5e4e8'}
      />
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
      {/* Shell, stand and keys are interactive Blender geometry. */}
      <MonitorLabel kind={kind} highlighted={target === kind} />
    </group>
  )
}

function CommandChair({
  kind,
}: {
  kind: keyof typeof COMMAND_POSES | keyof typeof SIDE_CHAIRS
}) {
  const pose = { ...COMMAND_POSES, ...SIDE_CHAIRS }[kind]
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      friction={0}
      position={bridgePoint(pose.chair)}
      rotation={[0, pose.rotation, 0]}
    >
      <CuboidCollider args={[0.42, 0.65, 0.42]} position={[0, 0.65, 0]} />
      {/* Seat visuals are batched in BridgeInterior; retain independent physics. */}
    </RigidBody>
  )
}

/** Low continuous console leaves the panoramic centerline unobstructed. */
export function Workstation({ target }: { target: StationTarget }) {
  return (
    <group name="forward-command-console">
      <RigidBody type="fixed" colliders={false} friction={0}>
        <BridgeInterior />
        <group position={[0, 0, BRIDGE_OFFSET_Z]}>
          {COMMAND_SEGMENTS.map((segment, index) => (
            <group key={index}>
              <ConvexHullCollider args={[segment.collider]} />
              {segment.supportColliders.map((vertices, i) => (
                <ConvexHullCollider key={i} args={[vertices]} />
              ))}
            </group>
          ))}
        </group>
        <CommandMonitor kind="computer" target={target} />
        <CommandMonitor kind="communications" target={target} />
        <group position={[0, 0, BRIDGE_OFFSET_Z]}>
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
        </group>
      </RigidBody>
      <CommandChair kind="computer" />
      <CommandChair kind="communications" />
      <CommandChair kind="personal" />
      <CommandChair kind="arcade" />
    </group>
  )
}
