import { CuboidCollider } from '@react-three/rapier'
import { FrontSide } from 'three'
import { BOW_EDGES, segmentPose, roofHeight } from './bridgeLayout'
import { BridgeDesignation } from './BridgeDesignation'
import { BridgeRoof } from './BridgeRoof'
import { ExteriorHull } from './ExteriorHull'
import { HullPanel } from './HullPanel'
import { StaticPanels } from './StaticPanels'
import { BRIDGE_WALL_PANELS } from './bridgeWallPanels'

/** Shared plating; the original window boundaries and physics stay independent. */
export function ShipHull() {
  return (
    <group name="panoramic-industrial-bridge">
      <StaticPanels panels={BRIDGE_WALL_PANELS} />
      {BOW_EDGES.map(([a, b], index) => {
        const edge = segmentPose(a, b),
          leftHeight = roofHeight(a[1]),
          rightHeight = roofHeight(b[1]),
          height = Math.max(leftHeight, rightHeight)
        return (
          <group
            key={index}
            position={[edge.x, 0, edge.z]}
            rotation={[0, edge.yaw, 0]}
          >
            <CuboidCollider
              args={[edge.length / 2, height / 2, 0.1]}
              position={[0, height / 2, 0]}
            />
            <HullPanel
              glass
              side={FrontSide}
              points={[
                [-edge.length / 2, 0.8, 0],
                [edge.length / 2, 0.8, 0],
                [edge.length / 2, rightHeight, 0],
                [-edge.length / 2, leftHeight, 0],
              ]}
            />
          </group>
        )
      })}
      {[-1, 1].map((side) => (
        <CuboidCollider
          key={side}
          args={[0.1, 1.65, 2.35]}
          position={[side * 4.8, 1.65, 2.75]}
        />
      ))}
      <BridgeDesignation />
      <BridgeRoof />
      <ExteriorHull />
    </group>
  )
}
