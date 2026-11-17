import {
  Float32BufferAttribute,
  Vector3,
  type BufferGeometry,
  type Matrix4,
} from 'three'
import {
  ARRIVAL_DEPTH,
  ARRIVAL_FLOOR_HULLS,
  ARRIVAL_FURNITURE,
} from './arrivalRoomLayout'
import { EVA_EQUIPMENT_LAYOUT } from './evaEquipmentLayout'

const floorOccluders = [
  ...ARRIVAL_FURNITURE,
  {
    position: [
      EVA_EQUIPMENT_LAYOUT.colliderPosition[0],
      EVA_EQUIPMENT_LAYOUT.colliderPosition[1],
      ARRIVAL_DEPTH - 0.04 + EVA_EQUIPMENT_LAYOUT.colliderPosition[2],
    ],
    halfSize: EVA_EQUIPMENT_LAYOUT.colliderHalfSize,
  },
]

const floorX: number[] = [],
  floorZ: number[] = []
for (const vertices of ARRIVAL_FLOOR_HULLS) {
  for (let i = 0; i < vertices.length; i += 3) {
    floorX.push(vertices[i])
    floorZ.push(vertices[i + 2])
  }
}
export const ARRIVAL_FLOOR_MAP_BOUNDS = {
  minX: Math.min(...floorX),
  maxX: Math.max(...floorX),
  minZ: Math.min(...floorZ),
  maxZ: Math.max(...floorZ),
} as const

/** Artist approximation of indirect contact occlusion, never a live shadow.
 * Shared furniture footprints keep it aligned when the layout changes. */
export function arrivalFloorOcclusion(x: number, z: number) {
  let value = 1
  for (const { position, halfSize } of floorOccluders) {
    if (position[1] - halfSize[1] > 0.05) continue
    const dx = Math.max(0, Math.abs(x - position[0]) - halfSize[0])
    const dz = Math.max(0, Math.abs(z - position[2]) - halfSize[2])
    const distance = Math.hypot(dx, dz)
    const t = Math.min(1, distance / 0.24)
    value = Math.min(value, 0.2 + 0.8 * t * t * (3 - 2 * t))
  }
  return value
}

/** Pack AO into R of the existing linear roughness map; G stays roughness. */
export function packArrivalFloorOcclusion(
  pixels: Uint8ClampedArray,
  size: number,
) {
  const { minX, maxX, minZ, maxZ } = ARRIVAL_FLOOR_MAP_BOUNDS
  for (let y = 0; y < size; y++) {
    const z = minZ + ((y + 0.5) / size) * (maxZ - minZ)
    for (let x = 0; x < size; x++) {
      const roomX = minX + ((x + 0.5) / size) * (maxX - minX)
      pixels[(y * size + x) * 4] = Math.round(
        arrivalFloorOcclusion(roomX, z) * 255,
      )
    }
  }
}

/** Own only the floor batch copy. Original UV0 remains for the imported normal
 * map; color, roughness and packed AO share this room-space UV1 atlas. */
export function createArrivalFloorGeometry(
  source: BufferGeometry,
  toRoom: Matrix4,
) {
  const geometry = source.clone()
  const positions = source.getAttribute('position')
  const uv = new Float32Array(positions.count * 2)
  const point = new Vector3()
  const { minX, maxX, minZ, maxZ } = ARRIVAL_FLOOR_MAP_BOUNDS
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i).applyMatrix4(toRoom)
    uv[i * 2] = (point.x - minX) / (maxX - minX)
    uv[i * 2 + 1] = (point.z - minZ) / (maxZ - minZ)
  }
  geometry.setAttribute('uv1', new Float32BufferAttribute(uv, 2))
  return geometry
}
