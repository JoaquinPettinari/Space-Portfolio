import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { StationTarget } from '../interaction/station'
import { ConsoleDisplay } from './ConsoleDisplay'
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
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      rotation={[0, rotation, 0]}
    >
      <CuboidCollider args={[0.65, 0.55, 0.12]} />
      <group userData={{ interaction: kind }}>
        <ConsoleDisplay
          kind={kind}
          highlighted={target === kind}
          width={1.1}
          height={0.8}
          position={[0, 0.03, 0.13]}
        />
      </group>
    </RigidBody>
  )
}
