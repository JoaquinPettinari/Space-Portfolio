import { useEffect, useMemo } from 'react'
import { Bvh, useGLTF } from '@react-three/drei'
import {
  ConvexHullCollider,
  CuboidCollider,
  RigidBody,
} from '@react-three/rapier'
import { Shape } from 'three'
import { batchPanoramicPassage } from './batchPanoramicPassage'
import {
  BAY_CENTERS,
  COLLAR_CENTERS,
  COLLAR_DEPTH,
  COLLAR_POLYGONS,
  PASSAGE_CENTER,
  PASSAGE_DEPTH,
  PASSAGE_WALLS,
  PANORAMIC_BAY_ASSET,
} from './passageLayout'
import { TRANSITION_END } from './bridgePlacement'

const collars = COLLAR_POLYGONS.map((points) => {
  const shape = new Shape()
  points.forEach(([x, y], i) =>
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y),
  )
  shape.closePath()
  return {
    shape,
    hull: new Float32Array(
      [-COLLAR_DEPTH / 2, COLLAR_DEPTH / 2].flatMap((z) =>
        points.flatMap(([x, y]) => [x, y, z]),
      ),
    ),
  }
})

/** Native-scale bays merge static surfaces; colliders retain their original layout. */
export function PanoramicPassage() {
  const { scene } = useGLTF(PANORAMIC_BAY_ASSET)
  const model = useMemo(
    () => batchPanoramicPassage(scene, BAY_CENTERS),
    [scene],
  )
  useEffect(() => () => model.dispose(), [model])

  return (
    <RigidBody type="fixed" colliders={false} name="panoramic-passage">
      <Bvh indirect>
        <primitive object={model.root} dispose={null} />
      </Bvh>
      <CuboidCollider
        args={[1.7, 0.115, PASSAGE_DEPTH / 2]}
        position={[0, -0.115, PASSAGE_CENTER]}
      />
      <CuboidCollider
        args={[1.7, 0.07, PASSAGE_DEPTH / 2]}
        position={[0, 3.27, PASSAGE_CENTER]}
      />
      {PASSAGE_WALLS.map((wall, i) => (
        <CuboidCollider
          key={i}
          args={[0.07, wall.halfLength, PASSAGE_DEPTH / 2]}
          position={wall.position}
          rotation={wall.rotation}
        />
      ))}
      {COLLAR_CENTERS.map((z) => (
        <group key={z} position={[0, 0, z]} name="passage-end-adapter">
          {collars.map(({ shape, hull }, i) => (
            <group key={i}>
              <ConvexHullCollider args={[hull]} />
              {z > TRANSITION_END + COLLAR_DEPTH && (
                <mesh position={[0, 0, -COLLAR_DEPTH / 2]}>
                  <extrudeGeometry
                    args={[shape, { depth: COLLAR_DEPTH, bevelEnabled: false }]}
                  />
                  <meshStandardMaterial
                    color="#292f34"
                    roughness={0.65}
                    metalness={0.25}
                  />
                </mesh>
              )}
            </group>
          ))}
        </group>
      ))}
    </RigidBody>
  )
}
