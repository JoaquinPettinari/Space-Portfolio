import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { useContext, useEffect, useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { ArrivalEnvironmentContext } from './arrivalEnvironment'
import { prepareTransitionModel } from './transitionModel'

RectAreaLightUniformsLib.init()

/** Owns materials and subscribes to the shared cabin reflection/power. */
export function useInteriorFixture(asset: string) {
  const { scene } = useGLTF(asset)
  const environment = useContext(ArrivalEnvironmentContext)
  const model = useMemo(() => {
    const prepared = prepareTransitionModel(scene)
    prepared.root.traverse((node) => {
      if (node.userData.runtime_zone === 'coffee')
        node.userData.interaction = 'coffee'
    })
    return prepared
  }, [scene])
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
  return { model, power }
}
