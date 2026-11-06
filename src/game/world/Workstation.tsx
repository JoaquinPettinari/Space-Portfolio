import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { StationTarget } from '../interaction/station'

function Part({
  at,
  size,
  color = '#182d40',
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
        roughness={0.4}
        emissive={light ? color : '#000000'}
        emissiveIntensity={light ? 1.2 : 0}
      />
    </mesh>
  )
}

export function Workstation({ target }: { target: StationTarget }) {
  return (
    <group>
      <RigidBody type="fixed" colliders={false} friction={0}>
        <CuboidCollider args={[1.5, 0.48, 0.6]} position={[0, 0.48, -3.7]} />
        <Part at={[0, 0.9, -3.7]} size={[3, 0.12, 1.2]} />
        <Part at={[-1.22, 0.43, -3.7]} size={[0.35, 0.86, 0.85]} />
        <Part at={[1.22, 0.43, -3.7]} size={[0.35, 0.86, 0.85]} />
        <Part
          at={[0, 0.91, -3.09]}
          size={[2.7, 0.025, 0.025]}
          color="#55d8ff"
          light
        />
        <Part at={[0, 1.12, -3.75]} size={[0.12, 0.4, 0.12]} />
        <Part
          at={[0, 1.55, -3.65]}
          size={[1.65, 0.98, 0.16]}
          color={target === 'computer' ? '#4bc9e8' : '#304e65'}
          interaction="computer"
        />
        <Part
          at={[0, 1.55, -3.56]}
          size={[1.5, 0.83, 0.02]}
          color="#071d32"
          light
          interaction="computer"
        />
        <Part
          at={[-0.45, 1.78, -3.54]}
          size={[0.38, 0.035, 0.01]}
          color="#72e7ff"
          light
          interaction="computer"
        />
        {[0, 1, 2].map((i) => (
          <Part
            key={i}
            at={[-0.25, 1.59 - i * 0.1, -3.54]}
            size={[0.78 - i * 0.13, 0.016, 0.01]}
            color="#3b839f"
            light
            interaction="computer"
          />
        ))}
        <Part
          at={[0.48, 1.48, -3.54]}
          size={[0.23, 0.3, 0.01]}
          color="#145175"
          light
          interaction="computer"
        />
        <Part
          at={[0, 0.99, -3.32]}
          size={[0.85, 0.04, 0.26]}
          color="#344e62"
          interaction="computer"
        />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} friction={0}>
        <CuboidCollider args={[0.42, 0.65, 0.42]} position={[0, 0.65, -2.3]} />
        <Part at={[0, 0.12, -2.3]} size={[0.75, 0.12, 0.75]} />
        <Part at={[0, 0.4, -2.3]} size={[0.14, 0.55, 0.14]} color="#658094" />
        <Part at={[0, 0.67, -2.3]} size={[0.8, 0.18, 0.78]} color="#25445e" />
        <Part at={[0, 1.03, -1.96]} size={[0.8, 0.65, 0.13]} color="#25445e" />
        <Part
          at={[0, 1.24, -1.88]}
          size={[0.43, 0.025, 0.015]}
          color="#65dfff"
          light
        />
        {[-0.43, 0.43].map((x) => (
          <Part key={x} at={[x, 0.88, -2.3]} size={[0.09, 0.1, 0.65]} />
        ))}
      </RigidBody>
    </group>
  )
}
