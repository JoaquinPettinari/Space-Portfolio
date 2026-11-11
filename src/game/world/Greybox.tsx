import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { SpaceExterior } from './SpaceExterior'
import { ShipHull } from './ShipHull'
import { BridgeFloor } from './BridgeFloor'
import { CabinLighting } from './CabinLighting'
import { EntryAirlock } from './EntryAirlock'
import { PanoramicPassage } from './PanoramicPassage'
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
        <BridgeFloor />
        {[-3.07, 3.07].map((x) => (
          <CuboidCollider
            key={x}
            args={[1.73, 1.65, 0.15]}
            position={[x, 1.65, 5.1]}
          />
        ))}
        <CuboidCollider args={[1.34, 0.39, 0.15]} position={[0, 2.91, 5.1]} />
        <ShipHull />
      </RigidBody>
      <EntryAirlock emergency={emergency} />
      <PanoramicPassage />
      <Bulkhead
        phase={bulkheadPhase}
        powered={!emergency}
        onPhaseChange={onBulkheadPhaseChange}
      />
      <CentralTable />
    </group>
  )
}
