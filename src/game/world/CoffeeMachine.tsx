import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { CoffeeState } from '../coffee'
import type { StationTarget } from '../interaction/station'

export function CoffeeMachine({
  state,
  target,
}: {
  state: CoffeeState
  target: StationTarget
}) {
  return (
    <RigidBody type="fixed" colliders={false} position={[-4.3, 0, 3.1]}>
      <CuboidCollider args={[0.4, 0.75, 0.36]} position={[0, 0.75, 0]} />
      <group userData={{ interaction: 'coffee' }}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.8, 0.9, 0.72]} />
          <meshStandardMaterial color="#233c50" roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.2, -0.15]}>
          <boxGeometry args={[0.8, 0.6, 0.38]} />
          <meshStandardMaterial
            color="#26374c"
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, 1.35, 0.05]}>
          <planeGeometry args={[0.55, 0.12]} />
          <meshBasicMaterial
            color={
              target === 'coffee'
                ? '#ffffff'
                : state.phase === 'brewing'
                  ? '#f2bc76'
                  : '#72e2df'
            }
          />
        </mesh>
        <mesh position={[0, 1.05, 0.08]}>
          <cylinderGeometry args={[0.04, 0.04, 0.15, 8]} />
          <meshStandardMaterial color="#b4cedb" />
        </mesh>
        {(state.phase === 'ready' || state.phase === 'brewing') && (
          <group position={[0, 0.98, 0.18]}>
            <mesh>
              <cylinderGeometry args={[0.1, 0.085, 0.16, 12]} />
              <meshStandardMaterial color="#deedf1" />
            </mesh>
            <mesh position={[0, 0.081, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.085, 12]} />
              <meshBasicMaterial color="#492d21" />
            </mesh>
          </group>
        )}
      </group>
    </RigidBody>
  )
}
