import { CanvasTexture, SRGBColorSpace } from 'three'
import { packArrivalFloorOcclusion } from './arrivalFloorMapping'

/** Small, deterministic surface variation. The existing GLB supplies normal/UV
 * detail; these two maps add quiet wear instead of more meshes or render passes. */
export function createArrivalFloorTextures() {
  const size = 256
  const colorCanvas = document.createElement('canvas')
  const roughnessCanvas = document.createElement('canvas')
  colorCanvas.width = colorCanvas.height = size
  roughnessCanvas.width = roughnessCanvas.height = size
  const color = colorCanvas.getContext('2d')!
  const roughness = roughnessCanvas.getContext('2d')!
  const colorPixels = color.createImageData(size, size)
  const roughnessPixels = roughness.createImageData(size, size)
  let seed = 17391
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2
      const v = (y / size) * Math.PI * 2
      const broad = Math.sin(u + Math.sin(v)) * Math.sin(v * 2 - u)
      const grain = (random() - 0.5) * 13
      const shade = Math.round(211 + broad * 24 + grain)
      const gloss = Math.round(193 + broad * 37 + grain)
      const i = (y * size + x) * 4
      colorPixels.data.set([shade, shade, shade - 3, 255], i)
      roughnessPixels.data.set([gloss, gloss, gloss, 255], i)
    }
  }
  color.putImageData(colorPixels, 0, 0)
  roughness.putImageData(roughnessPixels, 0, 0)
  for (let i = 0; i < 90; i++) {
    const x = random() * size,
      y = random() * size
    const length = 3 + random() * 24
    for (const [context, stroke] of [
      [color, 'rgba(250, 245, 233, .3)'],
      [roughness, 'rgba(90, 90, 90, .4)'],
    ] as const) {
      context.strokeStyle = stroke
      context.lineWidth = 0.7
      context.beginPath()
      context.moveTo(x, y)
      context.lineTo(x + length, y + length * 0.16)
      context.stroke()
    }
  }
  const packed = roughness.getImageData(0, 0, size, size)
  packArrivalFloorOcclusion(packed.data, size)
  roughness.putImageData(packed, 0, 0)
  const albedo = new CanvasTexture(colorCanvas)
  const roughnessMap = new CanvasTexture(roughnessCanvas)
  albedo.colorSpace = SRGBColorSpace
  for (const texture of [albedo, roughnessMap]) {
    texture.channel = 1
    // Atlas rows grow with room-local Z, matching the planar secondary UVs.
    texture.flipY = false
  }
  return {
    albedo,
    roughness: roughnessMap,
    dispose() {
      albedo.dispose()
      roughnessMap.dispose()
    },
  }
}
