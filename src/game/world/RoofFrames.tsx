import { useLayoutEffect, useRef } from 'react'
import { InstancedMesh, type Matrix4 } from 'three'
import { ROOF_FRAME_MATRICES, ROOF_LIGHT_MATRICES } from './roofFrameLayout'

function Boxes({
  matrices,
  light = false,
}: {
  matrices: readonly Matrix4[]
  light?: boolean
}) {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const current = mesh.current
    if (!current) return
    matrices.forEach((matrix, index) => current.setMatrixAt(index, matrix))
    current.instanceMatrix.needsUpdate = true
    current.computeBoundingBox()
    current.computeBoundingSphere()
  }, [matrices])
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, matrices.length]}
      name={light ? 'roof-practical-strips' : 'roof-structural-frames'}
    >
      <boxGeometry args={[1, 1, 1]} />
      {light ? (
        <meshBasicMaterial color="#ffd09a" />
      ) : (
        <meshStandardMaterial
          color="#252b31"
          metalness={0.3}
          roughness={0.55}
        />
      )}
    </instancedMesh>
  )
}

/** Static instance buffers, shared geometry/material per batch, no per-frame work. */
export function RoofFrames() {
  return (
    <>
      <Boxes matrices={ROOF_FRAME_MATRICES} />
      <Boxes matrices={ROOF_LIGHT_MATRICES} light />
    </>
  )
}
