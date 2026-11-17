import {
  BackSide,
  BoxGeometry,
  Color,
  FrontSide,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  Scene,
  type Material,
  type BufferGeometry,
  type Object3D,
  type Texture,
  type WebGLRenderer,
} from 'three'
import { createArrivalFloorGeometry } from './arrivalFloorMapping'
import { ARRIVAL_ORIGIN_Z } from './arrivalRoomLayout'

/** One static, roughness-filtered impression of the cabin light strips. It is
 * deliberately local to the arrival materials: no global environment mutation
 * and no cube-camera capture of the live room on subsequent frames. */
export function createArrivalReflection(renderer: WebGLRenderer) {
  const scene = new Scene()
  scene.background = new Color().setRGB(0.035, 0.029, 0.024)
  const geometry = new BoxGeometry()
  const materials: MeshBasicMaterial[] = []
  const panel = (
    at: [number, number, number],
    size: [number, number, number],
    color: [number, number, number],
  ) => {
    const material = new MeshBasicMaterial({ side: BackSide })
    material.color.setRGB(...color)
    materials.push(material)
    const mesh = new Mesh(geometry, material)
    mesh.position.set(...at)
    mesh.scale.set(...size)
    scene.add(mesh)
  }
  panel([0, 0, 0], [9, 5, 8], [0.08, 0.065, 0.048])
  // Thin luminous rectangular boxes are viewed from outside, unlike the shell.
  for (const x of [-2.1, 0, 2.1]) {
    panel([x, 2.25, 0], [0.16, 0.025, 5.6], [9, 4.9, 2.25])
    materials[materials.length - 1].side = FrontSide
  }
  // Low-angle reflections from the lounge and hatch practicals are visible on
  // the deck from standing height; ceiling-only emitters missed that direction.
  panel([-3.8, 1.1, 0], [0.025, 0.18, 5.8], [12, 5.4, 1.6])
  materials[materials.length - 1].side = FrontSide
  panel([3.8, 0.65, 0], [0.025, 0.12, 3.8], [7, 3.2, 1])
  materials[materials.length - 1].side = FrontSide
  panel([-3.8, 1.9, 0], [0.025, 0.04, 4], [0.4, 1.3, 1.8])
  materials[materials.length - 1].side = FrontSide
  const generator = new PMREMGenerator(renderer)
  try {
    return generator.fromScene(scene, 0.025, 0.1, 30, { size: 128 })
  } finally {
    generator.dispose()
    geometry.dispose()
    materials.forEach((material) => material.dispose())
  }
}

/** Clone materials once; only floor batches need owned UV1 geometry copies.
 * All original textures, UV0 and cached geometry remain untouched. */
export function prepareArrivalMaterials(
  source: Object3D,
  space: 'room' | 'world' = 'room',
) {
  const root = source.clone(true)
  const owned = new Map<Material, Material>()
  const geometries: BufferGeometry[] = []
  const reflective = new Map<MeshStandardMaterial, number>()
  const floors = new Map<
    MeshStandardMaterial,
    {
      map: Texture | null
      roughnessMap: Texture | null
      aoMap: Texture | null
      aoMapIntensity: number
    }
  >()
  const prepare = (material: Material) => {
    if (!(material instanceof MeshStandardMaterial)) return material
    let local = owned.get(material)
    if (!local) {
      const copy = material.clone()
      if (copy.transparent) copy.depthWrite = false
      if (/Graphite deck/.test(copy.name)) {
        copy.roughness = 0.28
        copy.metalness = 0.72
        floors.set(copy, {
          map: copy.map,
          roughnessMap: copy.roughnessMap,
          aoMap: copy.aoMap,
          aoMapIntensity: copy.aoMapIntensity,
        })
      }
      // The floor substrate shares this finish with pressure-panel trims. Keep
      // its baked roughness map, scaling it to satin instead of replacing it.
      if (/Warm grey panels|Graphite frame/.test(copy.name))
        copy.roughness *= 0.72
      if (/upholstery/i.test(copy.name)) copy.roughness = 0.5
      copy.envMapIntensity = /Graphite deck/.test(copy.name) ? 0.9 : 0.45
      if (
        /Graphite|Ivory cabinets|Warm grey panels|Aged brass|Brushed titanium|Glass|Glazing/i.test(
          copy.name,
        )
      )
        reflective.set(copy, copy.envMapIntensity)
      local = copy
      owned.set(material, local)
    }
    return local
  }
  root.updateMatrixWorld(true)
  const toRoot = new Matrix4().copy(root.matrixWorld).invert()
  if (space === 'world')
    toRoot.premultiply(new Matrix4().makeTranslation(0, 0, -ARRIVAL_ORIGIN_Z))
  root.traverse((object) => {
    if (object instanceof Mesh) {
      if (space === 'world' && !object.name.startsWith('REFINED_arrival_'))
        return
      object.material = Array.isArray(object.material)
        ? object.material.map(prepare)
        : prepare(object.material)
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      if (materials.some((material) => floors.has(material))) {
        const geometry = createArrivalFloorGeometry(
          object.geometry,
          new Matrix4().multiplyMatrices(toRoot, object.matrixWorld),
        )
        object.geometry = geometry
        geometries.push(geometry)
      }
    }
  })
  return {
    root,
    setFloorTextures(textures: { albedo: Texture; roughness: Texture } | null) {
      floors.forEach((original, material) => {
        material.map = textures?.albedo ?? original.map
        material.roughnessMap = textures?.roughness ?? original.roughnessMap
        material.aoMap = textures?.roughness ?? original.aoMap
        material.aoMapIntensity = textures ? 0.85 : original.aoMapIntensity
        material.needsUpdate = true
      })
    },
    setReflection(texture: Texture | null) {
      for (const material of reflective.keys()) {
        material.envMap = texture
        material.needsUpdate = true
      }
    },
    setPower(power: number) {
      reflective.forEach((intensity, material) => {
        material.envMapIntensity = intensity * power
      })
    },
    dispose() {
      owned.forEach((material) => material.dispose())
      geometries.forEach((geometry) => geometry.dispose())
    },
  }
}
