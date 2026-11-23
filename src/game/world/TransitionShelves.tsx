import { useContext, useEffect, useLayoutEffect, useMemo } from 'react'
import { Bvh, useGLTF } from '@react-three/drei'
import { ArrivalEnvironmentContext } from './arrivalEnvironment'
import { TRANSITION_CENTER } from './bridgePlacement'
import { prepareTransitionModel, TRANSITION_ASSET } from './transitionModel'

/** World-space master: preview lights stay in Blender; collision stays structural. */
export function TransitionShelves() {
  const { scene } = useGLTF(TRANSITION_ASSET)
  const environment = useContext(ArrivalEnvironmentContext)
  const model = useMemo(() => prepareTransitionModel(scene), [scene])
  const power = environment?.power ?? 1
  useEffect(() => () => model.dispose(), [model])
  useLayoutEffect(
    () =>
      environment?.channel.subscribe((resources) =>
        model.setReflection(resources?.reflection ?? null),
      ),
    [environment?.channel, model],
  )
  useLayoutEffect(() => model.setPower(power), [model, power])
  return (
    <group name="transition-shelves-master">
      <Bvh indirect>
        <primitive object={model.root} dispose={null} />
      </Bvh>
      <pointLight
        name="transition-ceiling-fill"
        position={[0, 2.7, TRANSITION_CENTER]}
        color="#ffdbac"
        intensity={14 * power}
        distance={4}
        decay={2}
      />
    </group>
  )
}
