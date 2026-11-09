import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { SpaceExterior } from './SpaceExterior'
import { ShipHull } from './ShipHull'
import { CabinLighting } from './CabinLighting'
import { EntryAirlock } from './EntryAirlock'
import { TABLE_POSITION } from '../interaction/station'
import { Bulkhead } from './SlidingBulkhead'
import type { BulkheadPhase } from './bulkhead'

type PanelProps = {
  position: [number, number, number]
  size: [number, number, number]
  color?: string
  light?: boolean
}

function Panel({
  position,
  size,
  color = '#182d42',
  light = false,
}: PanelProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={light ? 0 : 0.55}
        roughness={0.48}
        emissive={light ? color : '#000000'}
        emissiveIntensity={light ? 1.6 : 0}
      />
    </mesh>
  )
}

function CentralTable() {
  return (
    <group name="tactical-table" userData={{ interaction: 'tactical' }}>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[...TABLE_POSITION]}
        friction={0}
      >
        <CuboidCollider args={[1.05, 0.52, 1.35]} position={[0, 0.52, 0]} />
        <Panel
          position={[0, 0.45, 0]}
          size={[1.25, 0.9, 1.7]}
          color="#252a2e"
        />
        <Panel
          position={[0, 0.96, 0]}
          size={[2.1, 0.16, 2.7]}
          color="#42484b"
        />
        <Panel
          position={[0, 1.045, 0]}
          size={[1.8, 0.015, 2.4]}
          color="#102638"
        />
        <Panel
          position={[0, 1.055, 0]}
          size={[1.35, 0.012, 1.8]}
          color="#12465c"
        />
        {[-0.88, 0.88].map((x) => (
          <Panel
            key={x}
            position={[x, 1.055, 0]}
            size={[0.025, 0.018, 2.35]}
            color="#54cce7"
            light
          />
        ))}
        <mesh position={[0, 1.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.435, 48]} />
          <meshBasicMaterial color="#69d7ec" />
        </mesh>
      </RigidBody>
    </group>
  )
}

export function Greybox({
  emergency = true,
  bulkheadPhase,
  onBulkheadPhaseChange,
}: {
  emergency?: boolean
  bulkheadPhase: BulkheadPhase
  onBulkheadPhaseChange: (phase: BulkheadPhase) => void
}) {
  return (
    <group>
      <SpaceExterior />
      <CabinLighting emergency={emergency} />
      {/* Colisiones sencillas e independientes del vidrio y sus marcos. */}
      <RigidBody type="fixed" colliders={false} friction={0}>
        <CuboidCollider args={[5.2, 0.1, 5.2]} position={[0, -0.1, 0]} />
        <CuboidCollider args={[5.2, 2.25, 0.1]} position={[0, 2.25, -5.1]} />
        {[-3.225, 3.225].map((x) => (
          <CuboidCollider
            key={x}
            args={[1.975, 2.25, 0.15]}
            position={[x, 2.25, 5.1]}
          />
        ))}
        <CuboidCollider args={[1.25, 0.6, 0.15]} position={[0, 3.9, 5.1]} />
        <CuboidCollider args={[0.1, 2.25, 5]} position={[-5.1, 2.25, 0]} />
        <CuboidCollider args={[0.1, 2.25, 5]} position={[5.1, 2.25, 0]} />
        <CuboidCollider args={[5.2, 0.1, 5.2]} position={[0, 4.6, 0]} />
        <mesh position={[0, -0.1, 0]} name="continuous-cabin-floor">
          <boxGeometry args={[10.4, 0.2, 10.4]} />
          <meshStandardMaterial
            color="#303538"
            metalness={0.35}
            roughness={0.32}
          />
        </mesh>
        <ShipHull />
      </RigidBody>
      <EntryAirlock emergency={emergency} />
      <Bulkhead phase={bulkheadPhase} onPhaseChange={onBulkheadPhaseChange} />
      {/* Stationary frame sits outside the clear opening; no raised threshold. */}
      <group position={[0, 0, 4.86]}>
        {[-1.3, 1.3].map((x) => (
          <Panel
            key={x}
            position={[x, 1.65, 0]}
            size={[0.1, 3.3, 0.32]}
            color="#385268"
          />
        ))}
        <Panel
          position={[0, 3.35, 0]}
          size={[2.7, 0.1, 0.32]}
          color="#385268"
        />
      </group>
      <CentralTable />
    </group>
  )
}
