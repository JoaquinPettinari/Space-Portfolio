import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { SpaceExterior } from './SpaceExterior'
import { ShipHull } from './ShipHull'
import { CabinLighting } from './CabinLighting'
import { EntryAirlock } from './EntryAirlock'
import { TABLE_POSITION } from '../interaction/station'

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
    <group name="future-tactical-table">
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
  bulkheadOpen = false,
}: {
  emergency?: boolean
  bulkheadOpen?: boolean
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
      {/* Once opened, neither the leaf nor its collider obstructs the passage. */}
      {!bulkheadOpen && (
        <group userData={{ interaction: 'bulkhead' }}>
          <RigidBody
            type="fixed"
            colliders={false}
            position={[0, 0, 4.86]}
            friction={0}
          >
            <CuboidCollider args={[1.25, 1.65, 0.14]} position={[0, 1.65, 0]} />
            {/* Readable from the dim entry chamber without another dynamic light. */}
            <mesh position={[0, 1.65, 0.151]}>
              <planeGeometry args={[2.3, 3.08]} />
              <meshStandardMaterial
                color="#35556c"
                emissive="#173b50"
                emissiveIntensity={0.7}
                roughness={0.65}
              />
            </mesh>
            {[-0.94, 0.94].map((x) => (
              <mesh key={`entry-trim-${x}`} position={[x, 1.65, 0.16]}>
                <boxGeometry args={[0.025, 2.8, 0.015]} />
                <meshBasicMaterial color={emergency ? '#c5a27d' : '#8ed7ec'} />
              </mesh>
            ))}
            <Panel
              position={[0, 1.65, 0]}
              size={[2.5, 3.3, 0.28]}
              color="#101f30"
            />
            {[-0.54, 0.54].map((x) => (
              <group key={x}>
                <Panel
                  position={[x, 1.5, -0.17]}
                  size={[1.04, 2.85, 0.12]}
                  color="#385268"
                />
                <Panel
                  position={[x, 2.18, -0.24]}
                  size={[0.72, 0.43, 0.025]}
                  color="#0c2032"
                />
                <Panel
                  position={[Math.sign(x) * 1.13, 1.5, -0.23]}
                  size={[0.035, 2.9, 0.03]}
                  color="#69d7ec"
                  light
                />
              </group>
            ))}
            <Panel
              position={[0, 3.08, -0.18]}
              size={[1.5, 0.08, 0.05]}
              color="#69d7ec"
              light
            />
            <Panel
              position={[0, 0.035, -0.23]}
              size={[2.5, 0.07, 0.5]}
              color="#658094"
            />
            <Panel position={[1.44, 1.35, -0.05]} size={[0.23, 0.38, 0.15]} />
            <Panel
              position={[1.44, 1.4, -0.14]}
              size={[0.1, 0.1, 0.02]}
              color="#e8ac64"
              light
            />
          </RigidBody>
        </group>
      )}
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
