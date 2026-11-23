import {
  AnimationMixer,
  Group,
  LoopOnce,
  Mesh,
  SkinnedMesh,
  type AnimationAction,
  type AnimationClip,
  type Object3D,
} from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

export const HAND_INTERACTION_ASSET =
  '/models/cruz-del-sur-hand-interactions.glb'
export type HandInteractionKind = 'tablet' | 'card' | 'radio'
export type HandInteractionClip =
  'tablet_raise' | 'tablet_lower' | 'card_present' | 'radio_press'

const roots: Record<HandInteractionKind, string> = {
  tablet: 'TABLET_ASSEMBLY',
  card: 'CARD_GESTURE',
  radio: 'RADIO_GESTURE',
}
const ignoreRaycast = () => {}

/** Skeletons are private; meshes, baked textures and materials remain cached. */
export function createHandInteraction(
  source: Object3D,
  clips: readonly AnimationClip[],
  kind: HandInteractionKind,
) {
  const original = source.getObjectByName(roots[kind])
  if (!original) throw new Error(`Missing interaction root: ${roots[kind]}`)
  const scene = new Group()
  scene.add(clone(original))
  scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.raycast = ignoreRaycast
      // These small, near-camera meshes deform outside their rest-pose bounds.
      object.frustumCulled = false
    }
  })
  const mixer = new AnimationMixer(scene)
  const actions = new Map<string, AnimationAction>()
  let active: AnimationAction | undefined
  const anchors = {
    contact: scene.getObjectByName(
      kind === 'card' ? 'CARD_CONTACT' : 'RADIO_FINGERTIP',
    ),
    button: scene.getObjectByName('RADIO_BUTTON_CONTACT'),
    screen: scene.getObjectByName('SCREEN_UI'),
  }
  if (kind === 'tablet' ? !anchors.screen : !anchors.contact)
    throw new Error(`Missing contact/screen anchor for ${kind}`)
  if (kind === 'radio' && !anchors.button)
    throw new Error('Missing radio button animation anchor')
  return {
    scene,
    anchors,
    sample(name: HandInteractionClip, seconds: number) {
      let action = actions.get(name)
      if (!action) {
        const clip = clips.find((candidate) => candidate.name === name)
        if (!clip) throw new Error(`Missing interaction animation: ${name}`)
        action = mixer.clipAction(clip)
        action.setLoop(LoopOnce, 1)
        action.clampWhenFinished = true
        actions.set(name, action)
      }
      if (action !== active) {
        active?.stop()
        action.reset().play()
        action.paused = true
        active = action
      }
      action.time = Math.max(0, Math.min(seconds, action.getClip().duration))
      mixer.update(0)
      scene.updateMatrixWorld(true)
    },
    dispose() {
      mixer.stopAllAction()
      mixer.uncacheRoot(scene)
      actions.clear()
      active = undefined
      scene.traverse((object) => {
        if (object instanceof SkinnedMesh) object.skeleton.dispose()
      })
    },
  }
}
