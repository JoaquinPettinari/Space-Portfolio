import { useEffect, useEffectEvent, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Raycaster, Vector2 } from 'three'
import {
  INTERACTION_DISTANCE,
  HOLOGRAM_DISTANCE,
  interactionMode,
  type StationMode,
  type StationTarget,
} from './station'

export function Interaction({
  active,
  mode,
  onTarget,
  onMode,
  onDossier,
  onLighting,
  onCoffee,
  onBulkhead,
}: {
  active: boolean
  mode: StationMode
  onTarget: (target: StationTarget) => void
  onMode: (mode: StationMode) => void
  onDossier: () => void
  onLighting: () => void
  onCoffee: () => void
  onBulkhead: () => void
}) {
  const { camera, scene } = useThree()
  const target = useRef<StationTarget>(null)
  const ray = useRef(new Raycaster())
  const center = useRef(new Vector2())

  useFrame(() => {
    let next: StationTarget = null
    if (active && mode === 'walking') {
      ray.current.far = HOLOGRAM_DISTANCE
      camera.updateMatrixWorld()
      ray.current.setFromCamera(center.current, camera)
      // The nearest surface wins, so furniture blocks interaction through it.
      const hit = ray.current.intersectObjects(scene.children, true)[0]
      let object = hit?.object
      while (object && !object.userData.interaction && object.parent)
        object = object.parent
      const kind: unknown = object?.userData.interaction
      if (kind === 'hologram') next = kind
      else if (
        hit &&
        hit.distance <= INTERACTION_DISTANCE &&
        (kind === 'computer' ||
          kind === 'dossier' ||
          kind === 'lighting' ||
          kind === 'communications' ||
          kind === 'personal' ||
          kind === 'photo' ||
          kind === 'coffee' ||
          kind === 'bulkhead')
      ) {
        next = kind
      }
    }
    if (next !== target.current) {
      target.current = next
      onTarget(next)
    }
  })

  const key = useEffectEvent((event: KeyboardEvent) => {
    if (!active || event.repeat) return
    if (event.code === 'KeyE') {
      if (target.current === 'bulkhead') {
        event.preventDefault()
        onBulkhead()
        return
      }
      if (target.current === 'coffee') {
        event.preventDefault()
        onCoffee()
        return
      }
      if (target.current === 'lighting') {
        event.preventDefault()
        onLighting()
        return
      }
      if (target.current === 'dossier') {
        event.preventDefault()
        onDossier()
        return
      }
      const next = interactionMode(mode, target.current)
      if (next !== mode) {
        event.preventDefault()
        onMode(next)
      }
    }
  })
  useEffect(() => {
    const listener = (event: KeyboardEvent) => key(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])
  return null
}
