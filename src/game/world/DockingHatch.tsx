import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { ENTRY_DOCKING_DEPTH } from './entryLayout'

export const DOCKING_HATCH_Z = ENTRY_DOCKING_DEPTH

/** The master owns the visible hatch and glass; docking remains physically closed. */
export function DockingHatch() {
  return (
    <RigidBody
      name="docking-hatch"
      type="fixed"
      colliders={false}
      position={[0, 0, DOCKING_HATCH_Z]}
    >
      <CuboidCollider args={[1.425, 1.4, 0.17]} position={[0, 1.4, 0]} />
    </RigidBody>
  )
}
