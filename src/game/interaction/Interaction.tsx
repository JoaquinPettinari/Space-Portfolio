import { useEffect, useEffectEvent, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Raycaster, Vector2, type Intersection } from 'three'
import {
  INTERACTION_DISTANCE,
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
  onDocking,
}: {
  active: boolean
  mode: StationMode
  onTarget: (target: StationTarget) => void
  onMode: (mode: StationMode) => void
  onDossier: () => void
  onLighting?: () => void
  onCoffee: () => void
  onDocking?: () => void
  onBulkhead: () => void
}) {
  const { camera, scene } = useThree()
  const target = useRef<StationTarget>(null)
  const ray = useRef(new Raycaster())
  const center = useRef(new Vector2())
  const intersections = useRef<Intersection[]>([])

  useFrame(() => {
    let next: StationTarget = null
    if (active && mode === 'walking') {
      ray.current.far = INTERACTION_DISTANCE
      camera.updateMatrixWorld()
      ray.current.setFromCamera(center.current, camera)
      // The nearest surface wins, so furniture blocks interaction through it.
      intersections.current.length = 0
      ray.current.intersectObjects(scene.children, true, intersections.current)
      const hit = intersections.current[0]
      let object = hit?.object
      while (object && !object.userData.interaction && object.parent)
        object = object.parent
      const kind: unknown = object?.userData.interaction
      if (
        hit &&
        hit.distance <= INTERACTION_DISTANCE &&
        (kind === 'docking' ||
          kind === 'tactical' ||
          kind === 'computer' ||
          kind === 'dossier' ||
          kind === 'lighting' ||
          kind === 'communications' ||
          kind === 'personal' ||
          kind === 'arcade' ||
          kind === 'photo' ||
          kind === 'coffee' ||
          kind === 'bulkhead' ||
          kind === 'crew')
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
      if (target.current === 'docking') {
        event.preventDefault()
        onDocking?.()
        return
      }
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
        onLighting?.()
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
