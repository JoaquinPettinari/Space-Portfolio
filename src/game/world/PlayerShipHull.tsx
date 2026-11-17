import { useContext, useEffect, useLayoutEffect, useMemo } from 'react'
import { Bvh, useGLTF } from '@react-three/drei'
import { RigidBody, TrimeshCollider } from '@react-three/rapier'
import { prepareShipModel } from './prepareShipModel'
import { prepareArrivalShellMaterials } from './arrivalShellMaterials'
import { ArrivalEnvironmentContext } from './arrivalEnvironment'
import {
  UNIFIED_ENVELOPE_ASSET,
  UNIFIED_COLLISION_ASSET,
  readUnifiedCollision,
} from './unifiedShipAssets'

/** Unified exterior/interior skin; only structural geometry participates in physics. */
export function PlayerShipHull() {
  const environment = useContext(ArrivalEnvironmentContext)
  const [envelope, collision] = useGLTF([
    UNIFIED_ENVELOPE_ASSET,
    UNIFIED_COLLISION_ASSET,
  ])
  const shape = useMemo(
    () => readUnifiedCollision(collision.scene),
    [collision.scene],
  )
  const model = useMemo(
    () => prepareShipModel(envelope.scene, true),
    [envelope.scene],
  )
  useEffect(() => () => model.dispose(), [model])
  const finishes = useMemo(
    () => prepareArrivalShellMaterials(model.root),
    [model],
  )
  useEffect(() => () => finishes.dispose(), [finishes])
  useLayoutEffect(
    () =>
      environment?.channel.subscribe((resources) =>
        finishes.setReflection(resources?.reflection ?? null),
      ),
    [environment?.channel, finishes],
  )
  useLayoutEffect(
    () => finishes.setPower(environment?.power ?? 1),
    [environment?.power, finishes],
  )

  return (
    <group name="cruz-del-sur-player-hull">
      <Bvh indirect>
        <primitive object={model.root} dispose={null} />
      </Bvh>
      <RigidBody type="fixed" colliders={false} friction={0}>
        <TrimeshCollider args={[shape.vertices, shape.indices]} />
      </RigidBody>
    </group>
  )
}
