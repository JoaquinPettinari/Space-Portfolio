import { useEffect, useMemo } from 'react'
import { Bvh, useGLTF } from '@react-three/drei'
import { RigidBody, TrimeshCollider } from '@react-three/rapier'
import { prepareShipModel } from './prepareShipModel'
import { removeLegacyArrival } from './cabinMaster'
import {
  UNIFIED_ENVELOPE_ASSET,
  UNIFIED_COLLISION_ASSET,
  readUnifiedCollision,
} from './unifiedShipAssets'

/** Unified exterior/interior skin; only structural geometry participates in physics. */
export function PlayerShipHull() {
  const envelope = useGLTF(UNIFIED_ENVELOPE_ASSET)
  const collision = useGLTF(UNIFIED_COLLISION_ASSET)
  const shape = useMemo(
    () => readUnifiedCollision(collision.scene),
    [collision.scene],
  )
  const model = useMemo(() => {
    const prepared = prepareShipModel(envelope.scene, true)
    removeLegacyArrival(prepared.root)
    return prepared
  }, [envelope.scene])
  useEffect(() => () => model.dispose(), [model])

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
