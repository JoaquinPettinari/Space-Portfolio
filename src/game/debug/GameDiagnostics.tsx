import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { InstancedMesh, Light, Vector3 } from 'three'
import type { ProtocolState } from '../protocol'
import type { CoffeeState } from '../coffee'
import type { BulkheadPhase } from '../world/bulkhead'

export type SessionSnapshot = {
  protocol: ProtocolState
  coffee: CoffeeState
  bulkheadOpen: boolean
  bulkheadPhase: BulkheadPhase
  identity: 'idle' | 'scanning' | 'verified'
}

export type GameSnapshot = {
  bulkheadLeaves: {
    left: { x: number; y: number; z: number } | null
    right: { x: number; y: number; z: number } | null
  }
  powerSwitchCount: number
  session: SessionSnapshot
  cameraPosition: { x: number; y: number; z: number }
  cameraRotation: { x: number; y: number; z: number; w: number }
  pointerLocked: boolean
  drawCalls: number
  triangles: number
  frameMs: number
  maxEyeHeight: number
  mouseDelta: { x: number; y: number }
  cabinLighting: {
    ambientIntensity: number | null
    auxiliaryIntensity: number | null
    alarmIntensity: number | null
  }
  spaceMotion: {
    orbit: number | null
    stars: number | null
    planet: number | null
    asteroid: number | null
    shuttle: number | null
  }
}

declare global {
  interface Window {
    __GAME_DEBUG__?: Readonly<{ snapshot: () => GameSnapshot }>
  }
}

export function GameDiagnostics({ session }: { session: SessionSnapshot }) {
  const { camera, gl, scene } = useThree()
  const frameMs = useRef(0)
  const maxEyeHeight = useRef(0)
  const mouse = useRef({ x: 0, y: 0 })
  useFrame((_, delta) => {
    frameMs.current = delta * 1000
    maxEyeHeight.current = Math.max(maxEyeHeight.current, camera.position.y)
  })
  useEffect(() => {
    const leafPosition = new Vector3()
    const leaf = (name: string) => {
      const object = scene.getObjectByName(name)
      if (!object) return null
      object.getWorldPosition(leafPosition)
      return { x: leafPosition.x, y: leafPosition.y, z: leafPosition.z }
    }
    const intensity = (name: string) => {
      const object = scene.getObjectByName(name)
      return object instanceof Light ? object.intensity : null
    }
    const onMouse = (event: MouseEvent) => {
      if (document.pointerLockElement)
        mouse.current = { x: event.movementX, y: event.movementY }
    }
    const api = Object.freeze({
      snapshot: (): GameSnapshot => ({
        bulkheadLeaves: {
          left: leaf('bulkhead-left-leaf'),
          right: leaf('bulkhead-right-leaf'),
        },
        powerSwitchCount: (() => {
          let count = 0
          scene.traverse((object) => {
            if (object.name === 'auxiliary-light-switch') count++
          })
          return count
        })(),
        session: {
          ...session,
          protocol: {
            ...session.protocol,
            completed: [...session.protocol.completed],
          },
          coffee: { ...session.coffee },
        },
        cameraPosition: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        },
        cameraRotation: {
          x: camera.quaternion.x,
          y: camera.quaternion.y,
          z: camera.quaternion.z,
          w: camera.quaternion.w,
        },
        pointerLocked: !!document.pointerLockElement?.contains(gl.domElement),
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        frameMs: frameMs.current,
        maxEyeHeight: maxEyeHeight.current,
        mouseDelta: { ...mouse.current },
        cabinLighting: {
          ambientIntensity: intensity('cabin-ambient'),
          auxiliaryIntensity: intensity('cabin-window-spill'),
          alarmIntensity: intensity('cabin-alarm'),
        },
        spaceMotion: {
          orbit: scene.getObjectByName('orbital-drift')?.rotation.y ?? null,
          asteroid: (() => {
            const rocks = scene.getObjectByName('orbital-asteroids')
            return rocks instanceof InstancedMesh
              ? rocks.instanceMatrix.array[0]
              : null
          })(),
          shuttle: scene.getObjectByName('orbital-shuttle')?.position.x ?? null,
          stars: scene.getObjectByName('orbital-stars')?.rotation.y ?? null,
          planet: scene.getObjectByName('orbital-planet')?.rotation.y ?? null,
        },
      }),
    })
    window.__GAME_DEBUG__ = api
    document.addEventListener('mousemove', onMouse)
    return () => {
      if (window.__GAME_DEBUG__ === api) delete window.__GAME_DEBUG__
      document.removeEventListener('mousemove', onMouse)
    }
  }, [camera, gl, scene, session])
  return null
}
