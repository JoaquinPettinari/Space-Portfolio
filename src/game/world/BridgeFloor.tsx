import { ConvexHullCollider } from '@react-three/rapier'
import { BRIDGE_FLOOR_VERTICES } from './bridgeLayout'

/** Continuous walking surface; visible panels and grilles live in BridgeInterior. */
export function BridgeFloor() {
  return <ConvexHullCollider args={[BRIDGE_FLOOR_VERTICES]} />
}
