import { BackSide } from 'three'
import { ROOF_PANELS } from './bridgeLayout'
import { HullPanel } from './HullPanel'

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
    </group>
  )
}
