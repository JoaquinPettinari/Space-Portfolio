import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  DoubleSide,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { advanceExteriorTime } from './asterionMotion'
import { useReducedMotionRef } from '../useReducedMotionRef'
import manifest from './asterionManifest.json'

/** Broken artificial orbital arcs distinguish Ithaca from the natural ringed planet. */
export function OrbitalRelay({ paused }: { paused: boolean }) {
  const model = useMemo(() => {
    const root = new Group()
    const body = manifest.bodies.find((body) => body.name.startsWith('ITHACA'))!
    root.position.fromArray(body.position)
    root.rotation.set(1.05, 0.22, 0.1)
    const arcs = [0, 2.1, 4.2].map(
      (angle) => new RingGeometry(34.7, 34.86, 48, 1, angle, 1.65),
    )
    const pods = [0.3, 2.4, 4.5].map((angle) =>
      new BoxGeometry(0.65, 1.5, 0.5)
        .rotateZ(angle)
        .translate(34.78 * Math.cos(angle), 34.78 * Math.sin(angle), 0),
    )
    const ring = mergeGeometries(arcs)!
    const beacons = mergeGeometries(pods)!
    ;[...arcs, ...pods].forEach((geometry) => geometry.dispose())
    const alloy = new MeshBasicMaterial({
      color: '#627f98',
      side: DoubleSide,
      toneMapped: false,
    })
    const light = new MeshBasicMaterial({ color: '#7fc9db', toneMapped: false })
    root.add(new Mesh(ring, alloy), new Mesh(beacons, light))
    root.name = 'ithaca-orbital-relay'
    return {
      root,
      dispose: () => {
        ring.dispose()
        beacons.dispose()
        alloy.dispose()
        light.dispose()
      },
    }
  }, [])
  const elapsed = useRef(0)
  const group = useRef<Group>(null)
  const reduced = useReducedMotionRef()
  useEffect(() => () => model.dispose(), [model])
  useFrame((_, delta) => {
    elapsed.current = advanceExteriorTime(
      elapsed.current,
      delta,
      paused || reduced.current || document.hidden,
    )
    if (group.current) group.current.rotation.z = 0.1 + elapsed.current * 0.006
  })
  return <primitive ref={group} object={model.root} dispose={null} />
}
