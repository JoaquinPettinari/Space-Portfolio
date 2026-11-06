import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color,
  DynamicDrawUsage,
  IcosahedronGeometry,
  Object3D,
  type InstancedMesh,
} from 'three'

const COUNT = 95

export function AsteroidField() {
  const instances = useRef<InstancedMesh>(null)
  const elapsed = useRef(0)
  const rocks = useRef<
    { transform: Object3D; x: number; y: number; phase: number; spin: number }[]
  >([])
  const reducedMotion = useRef(false)
  const geometry = useMemo(() => {
    const rock = new IcosahedronGeometry(1, 1)
    const positions = rock.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i),
        z = positions.getZ(i)
      const variation =
        0.85 + 0.18 * Math.sin(x * 9 + y * 6) * Math.cos(z * 8 - y * 3)
      positions.setXYZ(i, x * variation, y * variation, z * variation)
    }
    rock.computeVertexNormals()
    return rock
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reducedMotion.current = query.matches
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useLayoutEffect(() => {
    if (!instances.current) return
    let seed = 84013
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    const color = new Color()
    rocks.current = []
    elapsed.current = 0
    instances.current.instanceMatrix.setUsage(DynamicDrawUsage)
    for (let i = 0; i < COUNT; i++) {
      const transform = new Object3D()
      // Distant debris: even the nearest rock remains over 40 m from the origin.
      // Rotations around the cabin preserve that separation throughout the orbit.
      transform.position.set(
        -44 - random() * 23,
        -8 + random() * 26,
        -18 - random() * 37,
      )
      const size = 0.18 + Math.pow(random(), 2) * 1.9
      transform.scale.set(
        size * (0.6 + random()),
        size * (0.6 + random()),
        size * (0.6 + random()),
      )
      transform.rotation.set(
        random() * Math.PI,
        random() * Math.PI,
        random() * Math.PI,
      )
      rocks.current.push({
        transform,
        x: transform.position.x,
        y: transform.position.y,
        phase: random() * Math.PI * 2,
        spin: (0.12 + random() * 0.24) * (random() > 0.5 ? 1 : -1),
      })
      transform.updateMatrix()
      instances.current.setMatrixAt(i, transform.matrix)
      color.setHSL(
        0.08 + random() * 0.08,
        0.08 + random() * 0.12,
        0.2 + random() * 0.2,
      )
      instances.current.setColorAt(i, color)
    }
    instances.current.instanceMatrix.needsUpdate = true
    if (instances.current.instanceColor)
      instances.current.instanceColor.needsUpdate = true
    instances.current.computeBoundingSphere()
    // Reserve room for bounded drift and the rotating irregular silhouettes.
    if (instances.current.boundingSphere)
      instances.current.boundingSphere.radius += 3
  }, [])
  useFrame((_, delta) => {
    if (reducedMotion.current || document.hidden || !instances.current) return
    const mesh = instances.current
    const step = Math.min(delta, 0.05)
    elapsed.current += step
    for (let index = 0; index < rocks.current.length; index++) {
      const rock = rocks.current[index]
      rock.transform.rotation.x += step * rock.spin * 0.6
      rock.transform.rotation.y += step * rock.spin
      rock.transform.position.x =
        rock.x + Math.sin(elapsed.current * 0.12 + rock.phase) * 0.6
      rock.transform.position.y =
        rock.y + Math.cos(elapsed.current * 0.16 + rock.phase) * 0.4
      rock.transform.updateMatrix()
      mesh.setMatrixAt(index, rock.transform.matrix)
    }
    instances.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group name="orbital-debris">
      <instancedMesh
        name="orbital-asteroids"
        ref={instances}
        args={[geometry, undefined, COUNT]}
      >
        <meshStandardMaterial roughness={0.96} metalness={0.08} flatShading />
      </instancedMesh>
    </group>
  )
}
