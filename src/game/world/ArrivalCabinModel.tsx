import { useContext, useEffect, useLayoutEffect, useMemo } from 'react'
import { Bvh, useGLTF } from '@react-three/drei'
import { ArrivalEnvironmentContext } from './arrivalEnvironment'
import { CABIN_MASTER_ASSET, prepareCabinMaster } from './cabinMaster'
import type { BulkheadPhase } from './bulkhead'

/** Static master is already in world metres, including docking and the vestibule. */
export function ArrivalCabinModel({
  phase,
  powered,
}: {
  phase: BulkheadPhase
  powered: boolean
}) {
  const { scene } = useGLTF(CABIN_MASTER_ASSET)
  const environment = useContext(ArrivalEnvironmentContext)
  const model = useMemo(() => prepareCabinMaster(scene), [scene])
  useEffect(() => () => model.dispose(), [model])
  useLayoutEffect(
    () =>
      environment?.channel.subscribe((resources) =>
        model.setReflection(resources?.reflection ?? null),
      ),
    [environment?.channel, model],
  )
  useLayoutEffect(
    () => model.setPower(environment?.power ?? 1),
    [environment?.power, model],
  )
  useLayoutEffect(
    () => model.setAccess(powered, phase),
    [model, powered, phase],
  )
  return (
    <Bvh indirect>
      <primitive object={model.root} dispose={null} />
    </Bvh>
  )
}
