import { WARM_PRACTICAL_COLOR } from './warmPracticals'
import { Bvh } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useInteriorFixture } from './useInteriorFixture'
import { GALLEY_ASSET, GALLEY_COLLIDERS } from './galleyLayout'

/** Static galley only; radio keys and their contact animation remain live. */
export function Galley() {
  const { model, power } = useInteriorFixture(GALLEY_ASSET)
  return (
    <group name="bridge-galley">
      <Bvh indirect>
        <primitive object={model.root} dispose={null} />
      </Bvh>
      <RigidBody type="fixed" colliders={false}>
        {GALLEY_COLLIDERS.map(({ position, half }, index) => (
          <CuboidCollider
            key={index}
            position={[...position]}
            args={[...half]}
          />
        ))}
      </RigidBody>
      <rectAreaLight
        name="galley-shelf-spill"
        position={[3.4, 1.97, 1.52]}
        rotation={[-1.35, 0, 0]}
        width={2.6}
        height={0.18}
        color={WARM_PRACTICAL_COLOR}
        intensity={6.5 * power}
      />
      <rectAreaLight
        name="galley-upper-shelf-wash"
        position={[3.4, 2.61, 1.54]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={2.3}
        height={0.12}
        color={WARM_PRACTICAL_COLOR}
        intensity={2.5 * power}
      />
    </group>
  )
}
