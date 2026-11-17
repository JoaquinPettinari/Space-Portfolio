import {
  ConvexHullCollider,
  CuboidCollider,
  RigidBody,
} from '@react-three/rapier'
import { ConsoleDisplay } from './ConsoleDisplay'
import { BridgeInterior } from './BridgeInterior'
import { BRIDGE_OFFSET_Z, bridgePoint } from './bridgePlacement'
import { TERMINAL_SCREENS, type StationTarget } from '../interaction/station'
import { COMMAND_SEGMENTS, COMMAND_POSES, SIDE_CHAIRS } from './commandLayout'

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
      <ConsoleDisplay
        kind={kind}
        highlighted={target === kind}
        width={1.6}
        height={0.9}
        position={[0, 0, -0.003]}
      />
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
        {/* Transparent picking surface over the existing navigation artwork. */}
        <mesh
          name="navigation-screen-target"
          position={[...TERMINAL_SCREENS.navigation.position]}
          userData={{ interaction: 'navigation' }}
        >
          <planeGeometry args={[...TERMINAL_SCREENS.navigation.display]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} />
        </mesh>
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
