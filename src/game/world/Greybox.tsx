import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { SpaceExterior } from './SpaceExterior'
import { ShipHull } from './ShipHull'
import { CabinLighting } from './CabinLighting'

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
    <group userData={{ interaction: 'hologram' }}>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[2.15, 0, 0]}
        friction={0}
      >
        <CuboidCollider args={[1.05, 0.52, 1.35]} position={[0, 0.52, 0]} />
        <Panel
          position={[0, 0.45, 0]}
          size={[1.25, 0.9, 1.7]}
          color="#15283a"
        />
        <Panel
          position={[0, 0.96, 0]}
          size={[2.1, 0.16, 2.7]}
          color="#273f53"
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

export function Greybox({ emergency = true }: { emergency?: boolean }) {
  return (
    <group>
      <SpaceExterior />
      <CabinLighting emergency={emergency} />
      {/* Colisiones sencillas e independientes del vidrio y sus marcos. */}
      <RigidBody type="fixed" colliders={false} friction={0}>
        <CuboidCollider args={[5.2, 0.1, 5.2]} position={[0, -0.1, 0]} />
        <CuboidCollider args={[5.2, 2.25, 0.1]} position={[0, 2.25, -5.1]} />
        <CuboidCollider args={[5.2, 2.25, 0.1]} position={[0, 2.25, 5.1]} />
        <CuboidCollider args={[0.1, 2.25, 5]} position={[-5.1, 2.25, 0]} />
        <CuboidCollider args={[0.1, 2.25, 5]} position={[5.1, 2.25, 0]} />
        <CuboidCollider args={[5.2, 0.1, 5.2]} position={[0, 4.6, 0]} />
        <mesh position={[0, -0.1, 0]} name="continuous-cabin-floor">
          <boxGeometry args={[10.4, 0.2, 10.4]} />
          <meshStandardMaterial
            color="#273a4a"
            metalness={0.35}
            roughness={0.32}
          />
        </mesh>
        <ShipHull />
      </RigidBody>
      {/* Entrada cerrada detrás del punto de aparición; apertura pendiente. */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0, 0, 4.86]}
        friction={0}
      >
        <CuboidCollider args={[1.25, 1.65, 0.14]} position={[0, 1.65, 0]} />
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
      <CentralTable />
    </group>
  )
}
