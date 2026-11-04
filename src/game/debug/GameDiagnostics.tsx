import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

export type GameSnapshot = {
  cameraPosition: { x: number; y: number; z: number }
  cameraRotation: { x: number; y: number; z: number; w: number }
  pointerLocked: boolean
  drawCalls: number
  triangles: number
  frameMs: number
  mouseDelta: { x: number; y: number }
}

declare global {
  interface Window {
    __GAME_DEBUG__?: Readonly<{ snapshot: () => GameSnapshot }>
  }
}

export function GameDiagnostics() {
  const { camera, gl } = useThree()
  const frameMs = useRef(0)
  const mouse = useRef({ x: 0, y: 0 })
  useFrame((_, delta) => {
    frameMs.current = delta * 1000
  })
  useEffect(() => {
    const onMouse = (event: MouseEvent) => {
      if (document.pointerLockElement)
        mouse.current = { x: event.movementX, y: event.movementY }
    }
    const api = Object.freeze({
      snapshot: (): GameSnapshot => ({
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
        mouseDelta: { ...mouse.current },
      }),
    })
    window.__GAME_DEBUG__ = api
    document.addEventListener('mousemove', onMouse)
    return () => {
      if (window.__GAME_DEBUG__ === api) delete window.__GAME_DEBUG__
      document.removeEventListener('mousemove', onMouse)
    }
  }, [camera, gl])
  return null
}
