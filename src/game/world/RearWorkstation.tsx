import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { PERSONAL_POSITION, type StationTarget } from '../interaction/station'
import { WallTerminal } from './WallTerminal'

export function RearWorkstation({ target }: { target: StationTarget }) {
  return (
    <group>
      <RigidBody type="fixed" colliders={false} position={[4.4, 0.45, 2.1]}>
        <CuboidCollider args={[0.4, 0.45, 0.9]} />
        <mesh>
          <boxGeometry args={[0.8, 0.9, 1.8]} />
          <meshStandardMaterial
            color="#b8b7ab"
            metalness={0.25}
            roughness={0.6}
          />
        </mesh>
        <mesh position={[-0.405, 0.38, 0]}>
          <boxGeometry args={[0.015, 0.025, 1.65]} />
          <meshBasicMaterial color="#e9ad70" />
        </mesh>
        <mesh position={[0.15, 0.55, 0]}>
          <boxGeometry args={[0.12, 0.3, 0.18]} />
          <meshStandardMaterial
            color="#45494b"
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      </RigidBody>
      <WallTerminal
        kind="personal"
        position={[...PERSONAL_POSITION]}
        rotation={-Math.PI / 2}
        target={target}
      />
    </group>
  )
}
