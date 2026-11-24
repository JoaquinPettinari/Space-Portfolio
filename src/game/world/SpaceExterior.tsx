import { AsterionSky, AsterionWorlds } from './AsterionExterior'
import { DistantShip } from './DistantShip'
import { skipExteriorRaycast } from './spaceScenery'
import { MeteorTrails } from './MeteorTrails'

export function SpaceExterior({ paused }: { paused: boolean }) {
  return (
    <group name="orbital-drift" raycast={skipExteriorRaycast}>
      <AsterionSky />
      <AsterionWorlds paused={paused} />
      <DistantShip paused={paused} />
      <MeteorTrails paused={paused} />
    </group>
  )
}
