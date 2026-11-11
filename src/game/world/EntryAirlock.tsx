import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import {
  ConvexHullCollider,
  CuboidCollider,
  RigidBody,
} from '@react-three/rapier'
import { Mesh, type Material } from 'three'
import { BULKHEAD_POCKET_PANELS } from './bulkhead'
import { ENTRY_OFFSET } from './bridgeLayout'
import { ENTRY_PANELS } from './entryLayout'
import {
  ARRIVAL_BOXES,
  ARRIVAL_FURNITURE,
  ARRIVAL_ORIGIN_Z,
  ARRIVAL_SHELL_HULLS,
} from './arrivalRoomLayout'

const dockingPanels = ENTRY_PANELS.filter(
  ({ name }) =>
    name === 'docking-floor' ||
    name === 'docking-roof' ||
    name === 'docking-rear' ||
    name.startsWith('docking-side-'),
)

/** Native-scale shell. Door, credential terminal and their state remain independent. */
export function EntryAirlock({ emergency }: { emergency: boolean }) {
  const { scene } = useGLTF('/models/cruz-del-sur-arrival-room.glb')
  const model = useMemo(() => {
    const root = scene.clone(true)
    const materials = new Map<Material, Material>()
    const prepare = (material: Material) => {
      if (!material.transparent) return material
      let local = materials.get(material)
      if (!local) {
        local = material.clone()
        local.depthWrite = false
        materials.set(material, local)
      }
      return local
    }
    root.traverse((object) => {
      if (object instanceof Mesh)
        object.material = Array.isArray(object.material)
          ? object.material.map(prepare)
          : prepare(object.material)
    })
    return { root, materials }
  }, [scene])
  useEffect(
    () => () => model.materials.forEach((material) => material.dispose()),
    [model],
  )

  return (
    <group name="entry-airlock">
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0}
        position={[0, 0, ARRIVAL_ORIGIN_Z]}
      >
        <primitive object={model.root} dispose={null} />
        {ARRIVAL_SHELL_HULLS.map((vertices, i) => (
          <ConvexHullCollider key={i} args={[vertices]} />
        ))}
        {[...ARRIVAL_BOXES, ...ARRIVAL_FURNITURE].map(
          ({ position, halfSize }, i) => (
            <CuboidCollider key={i} position={position} args={halfSize} />
          ),
        )}
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
        {dockingPanels.map(({ name, at, size }) => (
          <group key={name} name={name} position={at}>
            <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
            <mesh>
              <boxGeometry args={size} />
              <meshStandardMaterial
                color="#30383e"
                roughness={0.65}
                metalness={0.25}
              />
            </mesh>
          </group>
        ))}
      </RigidBody>
      {/* Only exposed thresholds; never a second floor beneath GLB plates. */}
      {[
        [11.2, ARRIVAL_ORIGIN_Z, 2.8],
        [16.2, 16.3, 1.6],
      ].map(([start, end, halfWidth]) => (
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
      {/* Practical fills illuminate PBR surfaces without shadow maps. */}
      {[-1.5, 1.5].map((x) => (
        <pointLight
          key={x}
          position={[x, 2.75, 14.1]}
          color="#ffd4a4"
          intensity={emergency ? 1 : 7}
          distance={5}
          decay={2}
        />
      ))}
    </group>
  )
}
