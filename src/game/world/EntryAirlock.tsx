import { useContext, useEffect, useLayoutEffect, useMemo } from 'react'
import { Bvh, useGLTF } from '@react-three/drei'
import {
  ConvexHullCollider,
  CuboidCollider,
  RigidBody,
} from '@react-three/rapier'
import { prepareArrivalMaterials } from './arrivalReflections'
import { ArrivalEnvironmentContext } from './arrivalEnvironment'
import { BULKHEAD_POCKET_PANELS } from './bulkhead'
import { ENTRY_OFFSET } from './bridgeLayout'
import {
  ARRIVAL_FURNITURE,
  ARRIVAL_ORIGIN_Z,
  ARRIVAL_FLOOR_HULLS,
} from './arrivalRoomLayout'
import { REFINED_ARRIVAL_ASSET } from './refinedArtAssets'
import { ArrivalServiceDetails } from './ArrivalServiceDetails'
import { ArrivalOutfitting } from './ArrivalOutfitting'

/** Native-scale shell. Door, credential terminal and their state remain independent. */
export function EntryAirlock({ emergency }: { emergency: boolean }) {
  const { scene } = useGLTF(REFINED_ARRIVAL_ASSET)
  const environment = useContext(ArrivalEnvironmentContext)
  const model = useMemo(() => prepareArrivalMaterials(scene), [scene])
  useEffect(() => () => model.dispose(), [model])
  useLayoutEffect(() => {
    model.setPower(emergency ? 0.12 : 1)
  }, [emergency, model])
  useLayoutEffect(
    () =>
      environment?.channel.subscribe((resources) => {
        model.setReflection(resources?.reflection ?? null)
        model.setFloorTextures(resources?.floor ?? null)
      }),
    [environment?.channel, model],
  )

  return (
    <group name="entry-airlock">
      <ArrivalServiceDetails />
      <ArrivalOutfitting />
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0}
        position={[0, 0, ARRIVAL_ORIGIN_Z]}
      >
        <Bvh indirect>
          <primitive object={model.root} dispose={null} />
        </Bvh>
        {ARRIVAL_FLOOR_HULLS.map((vertices, i) => (
          <ConvexHullCollider key={i} args={[vertices]} />
        ))}
        {ARRIVAL_FURNITURE.map(({ position, halfSize }, i) => (
          <CuboidCollider key={i} position={position} args={halfSize} />
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
              {/* Room-side face is already covered by the GLB facade. */}
              {index !== 1 && (
                <mesh>
                  <boxGeometry args={[...size]} />
                  <meshStandardMaterial color="#30383e" roughness={0.7} />
                </mesh>
              )}
            </group>
          )),
        )}
      </RigidBody>
      {/* Only exposed thresholds; never a second floor beneath GLB plates. */}
      {[[11.2, ARRIVAL_ORIGIN_Z, 2.8]].map(([start, end, halfWidth]) => (
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
        name="arrival-lounge-wash"
        position={[-2.7, 2.5, 16.65]}
        color="#ffc184"
        intensity={emergency ? 2.16 : 18}
        distance={5.2}
        decay={2}
      />
      <pointLight
        name="arrival-service-wash"
        position={[-2.9, 2.25, 12.7]}
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
    </group>
  )
}
