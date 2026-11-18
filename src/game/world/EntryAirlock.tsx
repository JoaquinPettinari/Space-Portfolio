import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { BULKHEAD_POCKET_PANELS, type BulkheadPhase } from './bulkhead'
import { ENTRY_OFFSET } from './bridgeLayout'
import shellLayout from './arrivalShellLayout.json'
import { ArrivalCabinModel } from './ArrivalCabinModel'
import {
  CABIN_MASTER_COLLIDERS,
  CABIN_MASTER_FLOOR,
  CABIN_TECHNICAL_END_PANELS,
} from './cabinMasterLayout'

/** The editable master owns visuals; conservative boxes own navigation. */
export function EntryAirlock({
  emergency,
  phase,
}: {
  emergency: boolean
  phase: BulkheadPhase
}) {
  return (
    <group name="entry-airlock">
      <ArrivalCabinModel phase={phase} powered={!emergency} />
      {CABIN_TECHNICAL_END_PANELS.map(({ position, size }) => (
        <mesh
          key={position[2]}
          name="technical-wall-end-panel"
          position={[...position]}
        >
          <boxGeometry args={[...size]} />
          <meshStandardMaterial
            color="#34312b"
            metalness={0.5}
            roughness={0.65}
          />
        </mesh>
      ))}
      <RigidBody type="fixed" colliders={false} friction={0}>
        <CuboidCollider
          position={[...CABIN_MASTER_FLOOR.position]}
          args={[...CABIN_MASTER_FLOOR.halfSize]}
        />
        {CABIN_MASTER_COLLIDERS.map(({ id, position, halfSize }) => (
          <CuboidCollider
            key={id}
            name={id}
            position={[...position]}
            args={[...halfSize]}
          />
        ))}
      </RigidBody>
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0}
        position={[0, 0, ENTRY_OFFSET]}
      >
        {([-1, 1] as const).flatMap((side) =>
          BULKHEAD_POCKET_PANELS.map(({ at, size }, index) => (
            <group
              key={`${side}:${index}`}
              position={[side * at[0], at[1], at[2]]}
            >
              <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
            </group>
          )),
        )}
      </RigidBody>
      {/* Only exposed thresholds; never a second floor beneath GLB plates. */}
      {[[11.2, shellLayout.startZ, 2.8]].map(([start, end, halfWidth]) => (
        <RigidBody
          key={start}
          type="fixed"
          colliders={false}
          friction={0}
          position={[0, -0.1, (start + end) / 2]}
        >
          <CuboidCollider args={[halfWidth, 0.1, (end - start) / 2]} />
          <mesh>
            <boxGeometry args={[halfWidth * 2, 0.2, end - start]} />
            <meshStandardMaterial
              color="#30383e"
              roughness={0.65}
              metalness={0.25}
            />
          </mesh>
        </RigidBody>
      ))}
      {/* Restrained practicals shape the furniture zones. Rectangular
          reflections share the one static map; no shadow render passes. */}
      <pointLight
        name="arrival-observation-wash"
        position={[-2.7, 2.5, 16.65]}
        color="#ffc184"
        intensity={emergency ? 2.16 : 18}
        distance={5.2}
        decay={2}
      />
      <pointLight
        name="arrival-service-wash"
        position={[-3.7, 1.4, 14.4]}
        color="#ffc184"
        intensity={emergency ? 1.2 : 10}
        distance={4.2}
        decay={2}
      />
      <pointLight
        name="arrival-technical-wall-wash"
        position={[2.75, 2.4, 15.5]}
        color="#ffc184"
        intensity={emergency ? 1.44 : 12}
        distance={4.5}
        decay={2}
      />
      <pointLight
        name="vestibule-aft-wash"
        position={[0, 2.35, 20.1]}
        color="#ffd3a1"
        intensity={emergency ? 1 : 8}
        distance={2.5}
        decay={2}
      />
    </group>
  )
}
