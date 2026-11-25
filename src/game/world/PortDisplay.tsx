import { WARM_PRACTICAL_COLOR } from './warmPracticals'
import { Bvh } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useInteriorFixture } from './useInteriorFixture'

/** Replaces the old loose books/crate with the authored expedition display. */
export function PortDisplay() {
  const { model, power } = useInteriorFixture(
    '/models/cruz-del-sur-port-display.glb',
  )
  return (
    <group name="port-expedition-display">
      <Bvh indirect>
        <primitive object={model.root} dispose={null} />
      </Bvh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          position={[-3.98, 1.4, 1.56]}
          args={[0.62, 1.4, 0.27]}
        />
      </RigidBody>
      {[1.85, 2.66].map((y) => (
        <rectAreaLight
          key={y}
          position={[-3.98, y, 1.4]}
          rotation={[-1.82, 0, 0]}
          width={0.88}
          height={0.14}
          intensity={6 * power}
          color={WARM_PRACTICAL_COLOR}
        />
      ))}
    </group>
  )
}
