import { CuboidCollider, RigidBody } from '@react-three/rapier'

/** Small static extension; the existing observation room remains unchanged. */
export function EntryAirlock({ emergency }: { emergency: boolean }) {
  const trim = emergency ? '#c5a27d' : '#8ed7ec'
  return (
    <RigidBody type="fixed" colliders={false} friction={0} name="entry-airlock">
      {/* Floor meets the main floor at z=5.2 without a step or coplanar overlap. */}
      <CuboidCollider args={[1.6, 0.1, 1.55]} position={[0, -0.1, 6.75]} />
      <CuboidCollider args={[1.6, 0.1, 1.65]} position={[0, 3.7, 6.55]} />
      <CuboidCollider args={[1.6, 1.8, 0.1]} position={[0, 1.8, 8.2]} />
      <mesh position={[0, -0.1, 6.75]}>
        <boxGeometry args={[3.2, 0.2, 3.1]} />
        <meshStandardMaterial
          color="#273a4a"
          metalness={0.35}
          roughness={0.32}
        />
      </mesh>
      <mesh position={[0, 3.7, 6.55]}>
        <boxGeometry args={[3.2, 0.2, 3.3]} />
        <meshStandardMaterial color="#24394c" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.8, 8.2]}>
        <boxGeometry args={[3.2, 3.6, 0.2]} />
        <meshStandardMaterial color="#24394c" roughness={0.7} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <CuboidCollider
            args={[0.1, 1.8, 1.65]}
            position={[side * 1.5, 1.8, 6.55]}
          />
          <mesh position={[side * 1.5, 1.8, 6.55]}>
            <boxGeometry args={[0.2, 3.6, 3.3]} />
            <meshStandardMaterial color="#2b4052" roughness={0.7} />
          </mesh>
          <mesh position={[side * 1.38, 0.12, 6.6]}>
            <boxGeometry args={[0.025, 0.035, 2.8]} />
            <meshBasicMaterial color={trim} />
          </mesh>
          <mesh position={[side * 0.8, 3.58, 6.55]}>
            <boxGeometry args={[0.07, 0.025, 2.8]} />
            <meshBasicMaterial color={trim} />
          </mesh>
        </group>
      ))}
      {/* Geometric docking marks, no remote font or texture dependency. */}
      {[-0.55, 0, 0.55].map((x) => (
        <mesh
          key={x}
          position={[x, 1.6, 8.085]}
          rotation={[0, 0, -Math.PI / 4]}
        >
          <boxGeometry args={[0.08, 0.5, 0.02]} />
          <meshBasicMaterial color={trim} />
        </mesh>
      ))}
    </RigidBody>
  )
}
