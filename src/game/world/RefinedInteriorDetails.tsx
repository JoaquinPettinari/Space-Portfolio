import { useContext, useEffect, useLayoutEffect, useMemo } from 'react'
import { Bvh, useGLTF } from '@react-three/drei'
import { REFINED_DETAILS_ASSET } from './refinedArtAssets'
import { prepareArrivalMaterials } from './arrivalReflections'
import { ArrivalEnvironmentContext } from './arrivalEnvironment'

/** Material/room batches in world metres; visual detail never becomes physics. */
export function RefinedInteriorDetails() {
  const { scene } = useGLTF(REFINED_DETAILS_ASSET)
  const environment = useContext(ArrivalEnvironmentContext)
  const model = useMemo(() => prepareArrivalMaterials(scene, 'world'), [scene])
  useEffect(() => () => model.dispose(), [model])
  useLayoutEffect(
    () =>
      environment?.channel.subscribe((resources) => {
        model.setReflection(resources?.reflection ?? null)
        model.setFloorTextures(resources?.floor ?? null)
      }),
    [environment?.channel, model],
  )
  useLayoutEffect(
    () => model.setPower(environment?.power ?? 1),
    [environment?.power, model],
  )
  return (
    <Bvh indirect>
      <primitive object={model.root} dispose={null} />
    </Bvh>
  )
}
