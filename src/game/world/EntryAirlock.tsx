import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { BULKHEAD_POCKET_PANELS } from './bulkhead'
import { ENTRY_OFFSET } from './bridgeLayout'
import { ENTRY_PANELS } from './entryLayout'

/** Receiving room with a framed viewport and chamfered ceiling shoulders. */
export function EntryAirlock({ emergency }: { emergency: boolean }) {
  const trim = emergency ? '#c5a27d' : '#8ed7ec'
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      friction={0}
      name="entry-airlock"
      position={[0, 0, ENTRY_OFFSET]}
    >
      {([-1, 1] as const).flatMap((side) =>
        BULKHEAD_POCKET_PANELS.map(({ at, size }, index) => (
          <group
            key={side + ':' + index}
            position={[side * at[0], at[1], at[2]]}
          >
            <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
            <mesh>
              <boxGeometry args={[...size]} />
              <meshStandardMaterial color="#2b4052" roughness={0.7} />
            </mesh>
          </group>
        )),
      )}
      {ENTRY_PANELS.map(({ name, at, size, rotation, glass }) => (
        <group key={name} name={name} position={at} rotation={rotation}>
          <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
          <mesh>
            <boxGeometry args={size} />
            {glass ? (
              <meshBasicMaterial
                color="#91c1d0"
                transparent
                opacity={0.16}
                depthWrite={false}
              />
            ) : (
              <meshStandardMaterial
                color={
                  name.includes('floor')
                    ? '#273035'
                    : name.includes('shoulder')
                      ? '#b5b4a8'
                      : '#303b42'
                }
                roughness={0.6}
                metalness={0.25}
              />
            )}
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 2.68, 0.12, 8.1]}>
            <boxGeometry args={[0.025, 0.035, 4.1]} />
            <meshBasicMaterial color={trim} />
          </mesh>
          <mesh position={[side * 1.8, 2.98, 8.1]}>
            <boxGeometry args={[0.07, 0.025, 3.8]} />
            <meshBasicMaterial color={trim} />
          </mesh>
        </group>
      ))}
      {/* Recessed seals visibly locate the side glass without blocking its view. */}
      {[1, 2.1].map((y) => (
        <mesh key={y} position={[-2.67, y, 8.2]}>
          <boxGeometry args={[0.16, 0.1, 2.16]} />
          <meshStandardMaterial color="#121d23" roughness={0.8} />
        </mesh>
      ))}
      {[7.2, 9.2].map((z) => (
        <mesh key={z} position={[-2.67, 1.55, z]}>
          <boxGeometry args={[0.16, 1.2, 0.1]} />
          <meshStandardMaterial color="#121d23" roughness={0.8} />
        </mesh>
      ))}
      {/* Exterior sill makes the viewport part of a layered ship hull. */}
      <mesh position={[-3.15, 0.8, 8.2]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.75, 0.18, 2.5]} />
        <meshStandardMaterial
          color="#3f4b52"
          metalness={0.45}
          roughness={0.5}
        />
      </mesh>
      {/* Shallow storage faces stay outside the player circulation envelope. */}
      {[7.3, 8.8].map((z) => (
        <group key={z} position={[2.66, 1.25, z]}>
          <mesh>
            <boxGeometry args={[0.08, 1.5, 1.15]} />
            <meshStandardMaterial color="#b5b4a8" roughness={0.7} />
          </mesh>
          <mesh position={[-0.05, 0, 0.35]}>
            <boxGeometry args={[0.03, 0.25, 0.045]} />
            <meshStandardMaterial color="#182127" />
          </mesh>
        </group>
      ))}
      {[6.8, 7.8, 8.8, 9.8].map((z) => (
        <mesh key={z} position={[0, 0.003, z]}>
          <boxGeometry args={[5.3, 0.006, 0.025]} />
          <meshStandardMaterial color="#121d23" />
        </mesh>
      ))}
    </RigidBody>
  )
}
