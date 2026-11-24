import { useEffect, useMemo } from 'react'
import enclosure from './bridgeEnclosure.json'
import { createBridgeEnclosureGeometry } from './bridgeEnclosureGeometry'

/** World coordinates: joins the bridge roof to the transition's chamfered arch. */
export function BridgeEnclosure() {
  const geometry = useMemo(() => createBridgeEnclosureGeometry(), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh name="bridge-portal-pressure-closure" geometry={geometry}>
      <meshStandardMaterial
        color={enclosure.color}
        metalness={enclosure.metalness}
        roughness={enclosure.roughness}
      />
    </mesh>
  )
}
