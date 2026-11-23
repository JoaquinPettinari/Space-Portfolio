import { AsterionSky, AsterionWorlds } from './AsterionExterior'
import { DistantShip } from './DistantShip'
import { skipExteriorRaycast } from './spaceScenery'

export function SpaceExterior({ paused }: { paused: boolean }) {
  return (
    <group name="orbital-drift" raycast={skipExteriorRaycast}>
      <AsterionSky />
      <AsterionWorlds paused={paused} />
      <DistantShip paused={paused} />
    </group>
  )
}
