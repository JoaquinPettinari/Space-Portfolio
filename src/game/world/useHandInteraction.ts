import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import {
  createHandInteraction,
  HAND_INTERACTION_ASSET,
  type HandInteractionKind,
} from './handInteractionModel'

export function useHandInteraction(kind: HandInteractionKind) {
  const { scene, animations } = useGLTF(HAND_INTERACTION_ASSET)
  const instance = useMemo(() => {
    const model = createHandInteraction(scene, animations, kind)
    model.sample(
      kind === 'tablet'
        ? 'tablet_raise'
        : kind === 'card'
          ? 'card_present'
          : 'radio_press',
      0,
    )
    return model
  }, [scene, animations, kind])
  useEffect(() => () => instance.dispose(), [instance])
  return instance
}
