import type { Bone, Camera, Vector3 } from 'three'

// Behind the near plane and below the eye: the sleeve continues into the body.
const BODY_OFFSET = [0.18, -0.5, 0.08] as const

/** Move only the sleeve's end bone; the authored wrist/finger chain stays fixed. */
export function positionRadioSleeveEnd(
  end: Bone,
  camera: Camera,
  scratch: Vector3,
) {
  if (!end.parent) throw new Error('Radio sleeve end needs its forearm parent')
  camera.localToWorld(scratch.set(...BODY_OFFSET))
  end.parent.worldToLocal(scratch)
  end.position.copy(scratch)
  end.updateWorldMatrix(false, true)
}
