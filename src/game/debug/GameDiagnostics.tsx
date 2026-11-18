import { developmentCaptureMode } from '../../config/development'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Frustum,
  InstancedMesh,
  Light,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  Points,
  ShaderMaterial,
  Raycaster,
  Vector3,
} from 'three'
import { bridgePoint } from '../world/bridgePlacement'
import type { ProtocolState } from '../protocol'
import type { CoffeeState } from '../coffee'
import type { BulkheadPhase } from '../world/bulkhead'
import type { IdentityPhase } from '../world/identification'

export type SessionSnapshot = {
  protocol: ProtocolState
  coffee: CoffeeState
  bulkheadOpen: boolean
  bulkheadPhase: BulkheadPhase
  identity: IdentityPhase
}

export type GameSnapshot = {
  radio: {
    track: number
    playing: boolean
    elapsed: number
    duration: number
    volume: number
    pressing: string | null
  } | null
  developmentCapture: boolean
  tacticalModelHeading: number | null
  tacticalModelPosition: { x: number; y: number; z: number } | null
  crewGesture: {
    elapsedSeconds: number | null
    reach: number | null
    visible: boolean
    localPosition: { x: number; y: number; z: number }
    worldPosition: { x: number; y: number; z: number }
    projectedPosition: { x: number; y: number; z: number }
  } | null
  explorationHull: { noseMounted: boolean; noseInSight: boolean }
  bulkheadLeaves: {
    left: { x: number; y: number; z: number } | null
    right: { x: number; y: number; z: number } | null
  }
  powerSwitchCount: number
  session: SessionSnapshot
  cameraPosition: { x: number; y: number; z: number }
  cameraRotation: { x: number; y: number; z: number; w: number }
  pointerLocked: boolean
  resources: { geometries: number; textures: number; programs: number }
  drawCalls: number
  triangles: number
  frameMs: number
  renderDpr: number
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
    __GAME_DEBUG__?: Readonly<{
      snapshot: () => GameSnapshot
      performance: () => Pick<
        GameSnapshot,
        'frameMs' | 'drawCalls' | 'triangles' | 'cameraPosition' | 'renderDpr'
      >
      renderInventory: () => {
        name: string
        draws: number
        triangles: number
      }[]
      materialInventory: () => {
        name: string
        type: string
        fastPath: boolean
        normalMap: boolean
        clearcoat: number
      }[]
    }>
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
    const sightRay = new Raycaster()
    const sightTarget = new Vector3(...bridgePoint([0, 0.67, -6.85]))
    const sightDirection = new Vector3()
    const projectedTarget = new Vector3()
    const noseSight = () => {
      const nose = scene.getObjectByName('exploration-bow-deck')
      if (!nose) return { noseMounted: false, noseInSight: false }
      projectedTarget.copy(sightTarget).project(camera)
      if (
        Math.abs(projectedTarget.x) > 1 ||
        Math.abs(projectedTarget.y) > 1 ||
        Math.abs(projectedTarget.z) > 1
      )
        return { noseMounted: true, noseInSight: false }
      sightDirection.copy(sightTarget).sub(camera.position)
      sightRay.far = sightDirection.length() + 0.5
      sightRay.set(camera.position, sightDirection.normalize())
      const hit = sightRay
        .intersectObjects(scene.children, true)
        .find(({ object }) => {
          if (!(object instanceof Mesh)) return false
          let visible = object.visible
          object.traverseAncestors((ancestor) => {
            visible = visible && ancestor.visible
          })
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          return (
            visible &&
            materials.some(
              (material) => material.visible && material.opacity > 0.2,
            )
          )
        })
      return { noseMounted: true, noseInSight: hit?.object === nose }
    }
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
    const gestureWorld = new Vector3()
    const gestureProjected = new Vector3()
    const crewGesture = (): GameSnapshot['crewGesture'] => {
      const gesture = scene.getObjectByName('crew-reader-gesture')
      if (!gesture) return null
      gesture.getWorldPosition(gestureWorld)
      gestureProjected.copy(gestureWorld).project(camera)
      let visible = gesture.visible
      gesture.traverseAncestors((ancestor) => {
        visible = visible && ancestor.visible
      })
      const { identificationElapsed, identificationReach } = gesture.userData
      return {
        elapsedSeconds:
          typeof identificationElapsed === 'number'
            ? identificationElapsed
            : null,
        reach:
          typeof identificationReach === 'number' ? identificationReach : null,
        visible,
        localPosition: {
          x: gesture.position.x,
          y: gesture.position.y,
          z: gesture.position.z,
        },
        worldPosition: {
          x: gestureWorld.x,
          y: gestureWorld.y,
          z: gestureWorld.z,
        },
        projectedPosition: {
          x: gestureProjected.x,
          y: gestureProjected.y,
          z: gestureProjected.z,
        },
      }
    }
    const onMouse = (event: MouseEvent) => {
      if (document.pointerLockElement)
        mouse.current = { x: event.movementX, y: event.movementY }
    }
    const api = Object.freeze({
      materialInventory: () => {
        const seen = new Set<MeshStandardMaterial>()
        scene.traverseVisible((object) => {
          if (!(object instanceof Mesh)) return
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material]) {
            if (material instanceof MeshStandardMaterial) seen.add(material)
          }
        })
        return [...seen].map((material) => ({
          name: material.name,
          type: material.type,
          fastPath: material
            .customProgramCacheKey()
            .includes('zero-contribution-lights-v1'),
          normalMap: material.normalMap !== null,
          clearcoat:
            material instanceof MeshPhysicalMaterial ? material.clearcoat : 0,
        }))
      },
      renderInventory: () => {
        const frustum = new Frustum().setFromProjectionMatrix(
          new Matrix4().multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse,
          ),
        )
        const entries: { name: string; draws: number; triangles: number }[] = []
        scene.traverseVisible((object) => {
          if (!(object instanceof Mesh) || !frustum.intersectsObject(object))
            return
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          const draws = Array.isArray(object.material)
            ? object.geometry.groups.length
            : 1
          const lineage = []
          let parent = object.parent
          while (parent) {
            if (parent.name) lineage.push(parent.name)
            parent = parent.parent
          }
          entries.push({
            name: [...lineage.reverse(), object.name || object.type].join('/'),
            draws:
              draws *
              (materials.some(
                (m) => m.transparent && m.side === 2 && !m.forceSinglePass,
              )
                ? 2
                : 1),
            triangles:
              (object.geometry.index?.count ??
                object.geometry.attributes.position.count) / 3,
          })
        })
        return entries.sort((a, b) => b.draws - a.draws)
      },
      // No scene traversal or raycasts while measuring frame timing.
      performance: () => ({
        frameMs: frameMs.current,
        renderDpr: gl.getPixelRatio(),
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        cameraPosition: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        },
      }),
      snapshot: (): GameSnapshot => ({
        radio: (() => {
          const object = scene.getObjectByName('cds-desk-radio')
          const data: unknown = object?.userData.radioPlayback
          if (
            !data ||
            typeof data !== 'object' ||
            !('track' in data) ||
            !('playing' in data) ||
            !('elapsed' in data) ||
            !('duration' in data) ||
            !('volume' in data)
          )
            return null
          if (
            typeof data.track !== 'number' ||
            typeof data.playing !== 'boolean' ||
            typeof data.elapsed !== 'number' ||
            typeof data.duration !== 'number' ||
            typeof data.volume !== 'number'
          )
            return null
          return {
            track: data.track,
            playing: data.playing,
            elapsed: data.elapsed,
            duration: data.duration,
            volume: data.volume,
            pressing:
              typeof object?.userData.radioPress === 'string'
                ? object.userData.radioPress
                : null,
          }
        })(),
        developmentCapture: developmentCaptureMode(),
        crewGesture: crewGesture(),
        tacticalModelHeading:
          scene.getObjectByName('tactical-ship-model')?.rotation.y ?? null,
        tacticalModelPosition: leaf('tactical-ship-model'),
        explorationHull: noseSight(),
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
        resources: {
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
          programs: gl.info.programs?.length ?? 0,
        },
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        frameMs: frameMs.current,
        renderDpr: gl.getPixelRatio(),
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
          stars: (() => {
            const stars = scene.getObjectByName('orbital-stars')
            return stars instanceof Points &&
              stars.material instanceof ShaderMaterial
              ? Number(stars.material.uniforms.time.value)
              : null
          })(),
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
