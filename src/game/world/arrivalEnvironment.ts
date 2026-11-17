import { createContext } from 'react'
import type { Texture } from 'three'

export type ArrivalSurfaceResources = {
  reflection: Texture
  floor: { albedo: Texture; roughness: Texture }
}
type Consumer = (resources: ArrivalSurfaceResources | null) => void

/** One local GPU reflection shared by the room and its structural shell. */
export function createArrivalEnvironmentChannel() {
  let current: ArrivalSurfaceResources | null = null
  const consumers = new Set<Consumer>()
  return {
    subscribe(consumer: Consumer) {
      consumers.add(consumer)
      consumer(current)
      return () => {
        consumers.delete(consumer)
      }
    },
    publish(resources: ArrivalSurfaceResources | null) {
      current = resources
      consumers.forEach((consumer) => consumer(resources))
    },
  }
}

export const ArrivalEnvironmentContext = createContext<{
  channel: ReturnType<typeof createArrivalEnvironmentChannel>
  power: number
} | null>(null)
