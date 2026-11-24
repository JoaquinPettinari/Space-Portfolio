import { Color, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { createCourierModel } from '../../src/game/world/courierModel'

/** Isolated visual review of the production model; no game state or lighting. */
export function renderCourierReview() {
  const renderer = new WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  })
  renderer.setPixelRatio(1)
  renderer.setSize(900, 600)
  const scene = new Scene()
  scene.background = new Color('#07111b')
  const camera = new PerspectiveCamera(35, 900 / 600, 0.1, 50)
  camera.position.set(7, 4, 7)
  camera.lookAt(0, 0, 0)
  const model = createCourierModel()
  scene.add(model.root)
  try {
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL('image/png')
  } finally {
    model.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
}
