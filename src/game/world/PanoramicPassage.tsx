import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import {
  ConvexHullCollider,
  CuboidCollider,
  RigidBody,
} from '@react-three/rapier'
import { Mesh, Shape, type Material } from 'three'
import {
  BAY_CENTERS,
  COLLAR_CENTERS,
  COLLAR_DEPTH,
  COLLAR_POLYGONS,
  PASSAGE_CENTER,
  PASSAGE_DEPTH,
  PASSAGE_WALLS,
} from './passageLayout'

const ASSET = '/models/cruz-del-sur-panoramic-bay.glb'
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

/** Native-scale bays share cached geometry; only transparent materials are locally owned. */
export function PanoramicPassage() {
  const { scene } = useGLTF(ASSET)
  const { bays, materials } = useMemo(() => {
    const materials = new Map<Material, Material>()
    const materialFor = (material: Material) => {
      if (!material.transparent) return material
      let local = materials.get(material)
      if (!local) {
        local = material.clone()
        local.depthWrite = false
        materials.set(material, local)
      }
      return local
    }
    const bays = BAY_CENTERS.map(() => {
      const bay = scene.clone(true)
      bay.traverse((object) => {
        if (object instanceof Mesh) {
          object.material = Array.isArray(object.material)
            ? object.material.map(materialFor)
            : materialFor(object.material)
        }
      })
      return bay
    })
    return { bays, materials }
  }, [scene])
  useEffect(
    () => () => materials.forEach((material) => material.dispose()),
    [materials],
  )

  return (
    <RigidBody type="fixed" colliders={false} name="panoramic-passage">
      {bays.map((bay, i) => (
        <primitive
          key={i}
          object={bay}
          position={[0, 0, BAY_CENTERS[i]]}
          dispose={null}
        />
      ))}
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
            </group>
          ))}
        </group>
      ))}
    </RigidBody>
  )
}
