export const SOLAR_TEXTURES = '/textures/solar-system/'
export const EARTH_SURFACE = SOLAR_TEXTURES + 'earth-day.webp'
export const EARTH_CLOUDS = SOLAR_TEXTURES + 'earth-clouds.webp'
export const EARTH_NIGHT = SOLAR_TEXTURES + 'earth-night.webp'
export const GALACTIC_SKY = SOLAR_TEXTURES + 'milky-way.webp'
export const EARTH_POSITION: [number, number, number] = [-26, -7, -62]
export const EARTH_RADIUS = 24

/** Three r186 stops recursive picking when an Object3D raycast returns false.
 * All exterior scenery is decorative and farther than the interaction range.
 */
export function skipExteriorRaycast() {
  return false
}

export function createIndependentStars(count = 2200) {
  let seed = 73129
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const positions = new Float32Array(count * 3)
  const phases = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const y = random() * 2 - 1
    const angle = random() * Math.PI * 2
    const radial = Math.sqrt(1 - y * y)
    positions.set(
      [Math.cos(angle) * radial * 92, y * 92, Math.sin(angle) * radial * 92],
      i * 3,
    )
    phases[i] = random()
  }
  return { positions, phases }
}

export const earthVertex = `
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewNormal;
varying vec3 vView;
varying vec3 vWorldView;
void main() {
  vUv = uv;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vViewNormal = normalize(normalMatrix * normal);
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-p.xyz);
  vWorldView = cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * p;
}`
export const earthFragment = `
uniform sampler2D surface;
uniform sampler2D clouds;
uniform sampler2D night;
uniform float cloudOffset;
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewNormal;
varying vec3 vView;
varying vec3 vWorldView;
void main() {
  float sun = dot(normalize(vWorldNormal), normalize(vec3(0.7, 0.6, 0.8)));
  float day = smoothstep(-0.12, 0.32, sun);
  vec3 land = texture2D(surface, vUv).rgb;
  float cloud = texture2D(clouds, vec2(fract(vUv.x + cloudOffset), vUv.y)).r;
  vec3 color = mix(land, vec3(0.95), smoothstep(0.07, 0.85, cloud) * 0.85);
  color *= 0.018 + pow(max(sun, 0.0), 0.65) * 0.92;
  float ocean = smoothstep(0.02, 0.15, land.b - max(land.r, land.g));
  float glint = pow(max(dot(reflect(-normalize(vec3(0.7, 0.6, 0.8)), normalize(vWorldNormal)), normalize(vWorldView)), 0.0), 48.0);
  color += vec3(0.35, 0.4, 0.44) * glint * ocean * (1.0 - cloud) * day;
  color += texture2D(night, vUv).rgb * (1.0 - day) * 1.3;
  float rim = pow(1.0 - max(dot(normalize(vViewNormal), normalize(vView)), 0.0), 4.0);
  color += vec3(0.025, 0.18, 0.42) * rim * (0.12 + 0.88 * day);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`
export const starVertex = `
uniform float time;
attribute float phase;
varying float brightness;
void main() {
  vec3 drift = vec3(sin(time * 0.002 + phase * 12.3), cos(time * 0.003 + phase * 31.1), 0.0) * 0.06;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + drift, 1.0);
  gl_PointSize = 0.65 + phase * 0.8;
  brightness = 0.5 + 0.08 * sin(time * (0.15 + phase) + phase * 300.0);
}`

export type CelestialBody = {
  name: string
  map: string
  position: [number, number, number]
  radius: number
}
// Cinematic distant views, not simultaneous real-world orbital positions or scale.
export const DISTANT_PLANETS: readonly CelestialBody[] = [
  { name: 'Mercury', map: 'mercury', position: [-73, 19, -35], radius: 0.22 },
  { name: 'Venus', map: 'venus', position: [-60, 24, -59], radius: 0.55 },
  { name: 'Mars', map: 'mars', position: [51, 5, -67], radius: 0.65 },
  { name: 'Jupiter', map: 'jupiter', position: [64, 18, -60], radius: 4 },
  { name: 'Saturn', map: 'saturn', position: [38, 8, -58], radius: 8 },
  { name: 'Uranus', map: 'uranus', position: [-72, 17, 39], radius: 0.6 },
  { name: 'Neptune', map: 'neptune', position: [-63, 5, 58], radius: 0.65 },
  { name: 'Moon', map: 'moon', position: [7, 6, -78], radius: 2.1 },
]
export const planetFragment = `
uniform sampler2D surface;
varying vec2 vUv;
varying vec3 vWorldNormal;
void main() {
  float sun = max(dot(normalize(vWorldNormal), normalize(vec3(0.7, 0.6, 0.8))), 0.0);
  gl_FragColor = vec4(texture2D(surface, vUv).rgb * (0.025 + sun * 0.9), 1.0);
  #include <colorspace_fragment>
}`
export const starFragment = `
varying float brightness;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  gl_FragColor = vec4(vec3(0.72, 0.85, 1.0) * brightness, 1.0);
  #include <colorspace_fragment>
}`
