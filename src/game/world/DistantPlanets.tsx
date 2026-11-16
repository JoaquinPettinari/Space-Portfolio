import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { DoubleSide, SRGBColorSpace } from 'three'
import {
  DISTANT_PLANETS,
  SOLAR_TEXTURES,
  earthVertex,
  planetFragment,
  type CelestialBody,
} from './spaceScenery'

function Planet({ body }: { body: CelestialBody }) {
  const surface = useTexture(SOLAR_TEXTURES + body.map + '.webp', (map) => {
    if (!Array.isArray(map)) map.colorSpace = SRGBColorSpace
  })
  const uniforms = useMemo(() => ({ surface: { value: surface } }), [surface])
  const ringUniforms = useMemo(
    () => ({ radius: { value: body.radius } }),
    [body.radius],
  )
  return (
    <group position={body.position} name={'distant-' + body.name.toLowerCase()}>
      <mesh rotation={[0.15, -0.5, 0.1]}>
        <sphereGeometry args={[body.radius, 32, 20]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={earthVertex}
          fragmentShader={planetFragment}
          toneMapped={false}
        />
      </mesh>
      {body.name === 'Saturn' && (
        <mesh rotation={[Math.PI / 2 - 0.4, 0.1, 0.3]}>
          <ringGeometry args={[body.radius * 1.3, body.radius * 2.1, 64]} />
          <shaderMaterial
            uniforms={ringUniforms}
            vertexShader={`varying float radial; uniform float radius;
              void main() { radial = length(position.xy) / radius;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
            fragmentShader={`varying float radial;
              void main() {
                if (abs(radial - 1.86) < 0.035) discard;
                float bands = 0.62 + 0.13 * sin(radial * 170.0) + 0.08 * sin(radial * 53.0);
                gl_FragColor = vec4(vec3(0.53, 0.46, 0.34) * bands, 1.0);
                #include <colorspace_fragment>
              }`}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  )
}

export function DistantPlanets() {
  return DISTANT_PLANETS.map((body) => <Planet key={body.name} body={body} />)
}
