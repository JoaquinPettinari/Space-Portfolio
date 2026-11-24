import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Euler,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
} from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

type Point = readonly [number, number, number]
type Finish = 'ceramic' | 'alloy' | 'graphite' | 'glass' | 'amber' | 'exhaust'

const finishes: Record<Finish, string> = {
  ceramic: '#b7c4ce',
  alloy: '#556977',
  graphite: '#18232e',
  glass: '#195b75',
  amber: '#e5a14d',
  exhaust: '#8ae8ff',
}

/** Small prelit escort, nose +X. Six opaque batches; no texture, light or shadow.
 * Facet shading is baked into vertex colours so the distant ship does not pay
 * for all cabin lights. Its hierarchy survives React's development replay.
 */
export function createCourierModel() {
  const root = new Group()
  root.name = 'asterion-courier'
  const parts = new Map<Finish, BufferGeometry[]>()
  const geometries: BufferGeometry[] = []
  const materials: MeshBasicMaterial[] = []
  const sun = new Vector3(0.4, 0.85, 0.35).normalize()
  const normal = new Vector3()
  const colour = new Color()
  const transform = new Matrix4()
  const orientation = new Quaternion()

  const add = (
    source: BufferGeometry,
    finish: Finish,
    position: Point = [0, 0, 0],
    rotation: Point = [0, 0, 0],
  ) => {
    const geometry = source.index ? source.toNonIndexed() : source
    if (geometry !== source) source.dispose()
    orientation.setFromEuler(new Euler(...rotation))
    transform.compose(
      new Vector3(...position),
      orientation,
      new Vector3(1, 1, 1),
    )
    geometry.applyMatrix4(transform)
    // Every primitive has the same attribute signature before merging.
    geometry.deleteAttribute('uv')
    const normals = geometry.getAttribute('normal')
    const colours = new Float32Array(normals.count * 3)
    const base = new Color(finishes[finish])
    for (let i = 0; i < normals.count; i++) {
      normal.fromBufferAttribute(normals, i)
      const light =
        finish === 'exhaust' ? 1 : 0.35 + Math.max(0, normal.dot(sun)) * 0.65
      colour.copy(base).multiplyScalar(light)
      colour.toArray(colours, i * 3)
    }
    geometry.setAttribute('color', new Float32BufferAttribute(colours, 3))
    const bucket = parts.get(finish) ?? []
    bucket.push(geometry)
    parts.set(finish, bucket)
  }
  const box = (
    size: Point,
    at: Point,
    finish: Finish,
    rotation: Point = [0, 0, 0],
  ) => add(new BoxGeometry(...size), finish, at, rotation)
  const hull = (vertices: Point[], finish: Finish, at: Point = [0, 0, 0]) =>
    add(
      new ConvexGeometry(vertices.map((point) => new Vector3(...point))),
      finish,
      at,
    )
  const tube = (radius: number, length: number, at: Point, finish: Finish) =>
    add(new CylinderGeometry(radius, radius, length, 12), finish, at, [
      0,
      0,
      Math.PI / 2,
    ])

  // Tapered lifting body with an inset dark keel and a separate armoured nose.
  hull(
    [
      [-2, -0.28, -0.55],
      [-2, -0.28, 0.55],
      [-1.75, 0.28, -0.58],
      [-1.75, 0.28, 0.58],
      [0.8, -0.22, -0.62],
      [0.8, -0.22, 0.62],
      [0.65, 0.32, -0.56],
      [0.65, 0.32, 0.56],
      [2.35, -0.08, -0.18],
      [2.35, -0.08, 0.18],
      [1.85, 0.16, -0.28],
      [1.85, 0.16, 0.28],
    ],
    'graphite',
  )
  hull(
    [
      [-1.65, 0.1, -0.58],
      [-1.65, 0.1, 0.58],
      [-1.45, 0.35, -0.46],
      [-1.45, 0.35, 0.46],
      [0.55, 0.12, -0.58],
      [0.55, 0.12, 0.58],
      [0.55, 0.4, -0.4],
      [0.55, 0.4, 0.4],
    ],
    'ceramic',
  )
  hull(
    [
      [0.55, -0.15, -0.59],
      [0.55, -0.15, 0.59],
      [0.65, 0.1, -0.55],
      [0.65, 0.1, 0.55],
      [2.4, -0.05, -0.16],
      [2.4, -0.05, 0.16],
      [2.05, 0.15, -0.2],
      [2.05, 0.15, 0.2],
    ],
    'ceramic',
  )
  // Canopy is recessed between two raised roof rails, not a glowing cube.
  hull(
    [
      [0.1, 0.39, -0.3],
      [0.1, 0.39, 0.3],
      [0.35, 0.69, -0.25],
      [0.35, 0.69, 0.25],
      [1.25, 0.18, -0.32],
      [1.25, 0.18, 0.32],
      [0.95, 0.5, -0.24],
      [0.95, 0.5, 0.24],
    ],
    'glass',
  )
  box([0.06, 0.3, 0.52], [0.4, 0.53, 0], 'graphite', [0, 0, -0.48])
  box([0.85, 0.045, 0.055], [0.62, 0.56, 0], 'alloy', [0, 0, -0.27])
  box([0.11, 0.07, 0.8], [1.45, 0.14, 0], 'amber')
  box([0.08, 0.075, 0.7], [1.66, 0.12, 0], 'amber')

  for (const side of [-1, 1]) {
    const z = side * 1.08
    // Swept outriggers, with distinct black radiator surfaces and panel seams.
    hull(
      [
        [-1.65, -0.05, side * 0.4],
        [0.2, -0.05, side * 0.45],
        [-0.55, -0.12, side * 1.62],
        [-1.95, -0.12, side * 1.62],
        [-1.65, 0.08, side * 0.4],
        [0.2, 0.08, side * 0.45],
        [-0.55, 0.01, side * 1.62],
        [-1.95, 0.01, side * 1.62],
      ],
      'alloy',
    )
    box([1.15, 0.04, 0.35], [-1.1, 0.025, side * 1.41], 'graphite')
    for (let fin = 0; fin < 7; fin++)
      box(
        [0.035, 0.055, 0.34],
        [-1.59 + fin * 0.16, 0.065, side * 1.41],
        'alloy',
      )
    // Long armoured engine pod, collars, dark nozzle mouth and concentric core.
    tube(0.28, 1.95, [-1.18, -0.13, z], 'alloy')
    box([1.35, 0.16, 0.38], [-0.95, 0.12, z], 'ceramic')
    for (const x of [-1.8, -0.65]) tube(0.3, 0.1, [x, -0.13, z], 'graphite')
    tube(0.3, 0.3, [-2.25, -0.13, z], 'alloy')
    tube(0.24, 0.035, [-2.41, -0.13, z], 'graphite')
    add(
      new TorusGeometry(0.17, 0.035, 6, 16),
      'exhaust',
      [-2.435, -0.13, z],
      [0, Math.PI / 2, 0],
    )
    tube(0.08, 0.06, [-2.44, -0.13, z], 'exhaust')
    // Narrow exhaust filaments read at distance without translucent overdraw.
    for (const dy of [-0.075, 0.075])
      box([0.48, 0.025, 0.025], [-2.67, -0.13 + dy, z], 'exhaust')
    box([0.23, 0.045, 0.3], [-0.6, 0.22, z], 'amber')
    box([0.14, 0.055, 0.09], [-0.7, 0.07, side * 1.64], 'exhaust')
    // Service hatches and tie-down ribs along the flanks.
    for (let panel = 0; panel < 3; panel++) {
      box([0.4, 0.22, 0.055], [-1.32 + panel * 0.48, 0.01, side * 0.6], 'alloy')
      box(
        [0.18, 0.035, 0.07],
        [-1.32 + panel * 0.48, 0.04, side * 0.64],
        'graphite',
      )
    }
    box([0.45, 0.035, 0.055], [0.03, 0.41, side * 0.4], 'amber')
  }
  // A stepped dorsal avionics spine, four cooling vents and a tiny antenna mast.
  box([0.8, 0.14, 0.45], [-1.02, 0.44, 0], 'graphite')
  for (let vent = 0; vent < 4; vent++)
    box([0.07, 0.045, 0.4], [-1.31 + vent * 0.18, 0.535, 0], 'alloy')
  box([0.45, 0.09, 0.28], [-0.32, 0.46, 0], 'ceramic')
  box([0.035, 0.4, 0.035], [-1.52, 0.53, 0], 'alloy', [0, 0, 0.2])
  box([0.24, 0.035, 0.035], [-1.56, 0.73, 0], 'exhaust')
  box([0.7, 0.16, 0.48], [-0.15, -0.29, 0], 'alloy')
  box([0.12, 0.06, 0.3], [1.95, -0.1, 0], 'glass')

  for (const [finish, pieces] of parts) {
    const geometry = mergeGeometries(pieces)
    pieces.forEach((piece) => piece.dispose())
    if (!geometry) throw new Error('Incompatible courier geometry')
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    geometries.push(geometry)
    const material = new MeshBasicMaterial({
      vertexColors: true,
      toneMapped: false,
    })
    material.name = `courier-${finish}`
    materials.push(material)
    const mesh = new Mesh(geometry, material)
    mesh.name = `courier-${finish}`
    root.add(mesh)
  }
  return {
    root,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
    },
  }
}
