import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { AsteroidField } from './AsteroidField'
import { DistantShip } from './DistantShip'

// Evaluate smooth analytic surface patterns per pixel. Interpolating finished
// terrain colours per vertex made the large planet reveal its triangle grid.
const planetVertex = `
  varying vec3 vSurface;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vSurface = normalize(position);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`
const planetFragment = `
  varying vec3 vSurface;
  varying vec3 vNormal;
  varying vec3 vView;
  float terrain(vec3 p) {
    return sin(p.x * 3.7 + sin(p.y * 4.6)) * sin(p.z * 4.1 + p.y * 2.2)
      + 0.35 * sin(p.x * 11.0 + p.z * 7.0) * sin(p.y * 9.0);
  }
  void main() {
    vec3 p = normalize(vSurface);
    float landMask = smoothstep(0.14, 0.26, terrain(p));
    vec3 ocean = vec3(0.025, 0.13, 0.36);
    vec3 land = vec3(0.13, 0.35, 0.43);
    vec3 color = mix(ocean, land, landMask);
    float clouds = smoothstep(0.63, 0.94, terrain(p * 2.4 + vec3(0.6)));
    color = mix(color, vec3(0.7, 0.84, 0.94), clouds * 0.85);
    float daylight = smoothstep(-0.25, 0.7, dot(p, normalize(vec3(-1.0, 0.8, 1.0))));
    color *= mix(0.09, 1.3, daylight);
    float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 4.0);
    color += vec3(0.06, 0.36, 0.75) * rim;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const distantPlanetFragment = `
  varying vec3 vSurface;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 p = normalize(vSurface);
    float bands = 0.5 + 0.5 * sin(p.y * 35.0 + sin(p.x * 5.0) * 0.7);
    vec3 color = mix(vec3(0.34, 0.14, 0.08), vec3(0.68, 0.42, 0.23), bands);
    float daylight = smoothstep(-0.3, 0.65, dot(p, normalize(vec3(-1.0, 0.8, 1.0))));
    color *= mix(0.05, 1.05, daylight);
    float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 5.0);
    color += vec3(0.15, 0.08, 0.04) * rim;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function SpaceExterior() {
  const orbit = useRef<Group>(null)
  const starField = useRef<Group>(null)
  const planet = useRef<Mesh>(null)
  const reducedMotion = useRef(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reducedMotion.current = query.matches
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useFrame((_, delta) => {
    if (reducedMotion.current || document.hidden) return
    const step = Math.min(delta, 0.05)
    // Cinematic orbital drift: rotate the distant scenery, never the FPS camera.
    // Fixed radial distances keep celestial bodies safely outside the cabin.
    if (orbit.current)
      orbit.current.rotation.y =
        (orbit.current.rotation.y + step * 0.006) % (Math.PI * 2)
    if (starField.current) starField.current.rotation.y += step * 0.012
    if (planet.current) planet.current.rotation.y += step * 0.035
  })
  const layers = useMemo(() => {
    // Seeded randomness: irregular skies, stable across renders and captures.
    let seed = 73129
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    return [1100, 550, 170].map((count, layer) => {
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const y = random() * 2 - 1
        const angle = random() * Math.PI * 2
        const distance = 55 + random() * 48
        const radial = Math.sqrt(1 - y * y)
        positions.set(
          [
            Math.cos(angle) * radial * distance,
            y * distance,
            Math.sin(angle) * radial * distance,
          ],
          i * 3,
        )
      }
      return {
        positions,
        size: [0.075, 0.14, 0.24][layer],
        color: ['#7192ba', '#bed7ef', '#eef6ff'][layer],
      }
    })
  }, [])

  return (
    <>
      <group ref={orbit} name="orbital-drift">
        <AsteroidField />
        <DistantShip />
        <mesh position={[-8, 18, -66]} name="distant-moon">
          <sphereGeometry args={[3.4, 32, 24]} />
          <meshStandardMaterial color="#8b8b89" roughness={1} />
        </mesh>
        <mesh
          position={[44, 8, -61]}
          rotation={[0.15, -0.4, -0.18]}
          name="distant-planet"
        >
          <sphereGeometry args={[6.5, 48, 32]} />
          <shaderMaterial
            vertexShader={planetVertex}
            fragmentShader={distantPlanetFragment}
          />
        </mesh>
        <group ref={starField} name="orbital-stars">
          {layers.map((layer, index) => (
            <points key={index}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[layer.positions, 3]}
                />
              </bufferGeometry>
              <pointsMaterial
                color={layer.color}
                size={layer.size}
                sizeAttenuation
              />
            </points>
          ))}
        </group>
        <mesh
          ref={planet}
          name="orbital-planet"
          position={[-25, 10, -38]}
          rotation={[0.2, -0.5, 0.3]}
        >
          <sphereGeometry args={[13, 128, 96]} />
          <shaderMaterial
            vertexShader={planetVertex}
            fragmentShader={planetFragment}
          />
        </mesh>
      </group>
    </>
  )
}
