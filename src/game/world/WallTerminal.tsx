import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { StationTarget } from '../interaction/station'

/** Lightweight functional shell, ready to be replaced by an approved asset. */
export function WallTerminal({
  kind,
  position,
  rotation = 0,
  target,
}: {
  kind: 'communications' | 'personal'
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
        <mesh>
          <boxGeometry args={[1.3, 1.1, 0.24]} />
          <meshStandardMaterial
            color="#183449"
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, 0.03, 0.13]}>
          <planeGeometry args={[1.1, 0.8]} />
          <meshBasicMaterial color={target === kind ? '#74ddec' : '#13586c'} />
        </mesh>
        {[-0.25, 0, 0.25].map((y, i) => (
          <mesh key={y} position={[0, y, 0.14]}>
            <planeGeometry args={[0.8 - i * 0.16, 0.025]} />
            <meshBasicMaterial color="#b4f7ff" />
          </mesh>
        ))}
      </group>
    </RigidBody>
  )
}
