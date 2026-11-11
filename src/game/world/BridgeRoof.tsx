import { BackSide } from 'three'
import { ROOF_PANELS } from './bridgeLayout'
import { HullPanel } from './HullPanel'
import { RoofFrames } from './RoofFrames'

export function BridgeRoof() {
  return (
    <group name="sloped-panoramic-roof">
      {ROOF_PANELS.map((panel, index) => (
        <HullPanel
          key={index}
          {...panel}
          collision
          side={panel.glass ? BackSide : undefined}
        />
      ))}
      <RoofFrames />
    </group>
  )
}
