import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

/** Two shared 256px opaque maps, generated once rather than shaded per frame. */
export function createInteriorFinishTextures() {
  const canvas = () => {
    const result = document.createElement('canvas')
    result.width = result.height = 256
    const context = result.getContext('2d')
    if (!context) throw new Error('Interior finishes require Canvas 2D')
    return { result, context }
  }
  let seed = 40717
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const leather = canvas()
  const pixels = leather.context.createImageData(256, 256)
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grain = 222 + Math.floor(random() * 15)
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = grain
    pixels.data[i + 3] = 255
  }
  leather.context.putImageData(pixels, 0, 0)
  leather.context.strokeStyle = 'rgba(255,255,255,0.075)'
  leather.context.lineWidth = 0.7
  for (let i = 0; i < 32; i++) {
    const x = random() * 256,
      y = random() * 256
    leather.context.beginPath()
    leather.context.moveTo(x, y)
    leather.context.lineTo(x + 3 + random() * 14, y + random() * 2)
    leather.context.stroke()
  }
  const leaf = canvas()
  const gradient = leaf.context.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, '#93a976')
  gradient.addColorStop(0.47, '#c5d3a7')
  gradient.addColorStop(0.53, '#b8ca96')
  gradient.addColorStop(1, '#8fa671')
  leaf.context.fillStyle = gradient
  leaf.context.fillRect(0, 0, 256, 256)
  leaf.context.strokeStyle = 'rgba(238,239,191,0.4)'
  leaf.context.lineWidth = 1.4
  for (let x = 28; x < 240; x += 27)
    for (const side of [-1, 1]) {
      leaf.context.beginPath()
      leaf.context.moveTo(x, 128)
      leaf.context.quadraticCurveTo(
        x + 13,
        128 + side * 36,
        x + 43,
        128 + side * 110,
      )
      leaf.context.stroke()
    }
  leaf.context.strokeStyle = 'rgba(242,239,185,0.65)'
  leaf.context.lineWidth = 2
  leaf.context.beginPath()
  leaf.context.moveTo(0, 128)
  leaf.context.lineTo(256, 128)
  leaf.context.stroke()
  const leatherMap = new CanvasTexture(leather.result),
    leafMap = new CanvasTexture(leaf.result)
  for (const texture of [leatherMap, leafMap]) {
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 2
  }
  leatherMap.wrapS = leatherMap.wrapT = RepeatWrapping
  leatherMap.repeat.set(2, 2)
  return { leather: leatherMap, leaf: leafMap }
}
