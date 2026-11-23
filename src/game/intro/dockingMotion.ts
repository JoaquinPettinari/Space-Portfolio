export type Position3 = readonly [number, number, number]

export type DockingSample = Readonly<{
  time: number
  pampaPosition: Position3
  pampaYaw: number
  cameraPosition: Position3
  cameraTarget: Position3
  clampClosure: number
}>

export type DockingMotion = Readonly<{
  duration: number
  fps: number
  samples: readonly DockingSample[]
}>

function invalid(field: string): never {
  throw new Error(`Invalid docking motion: ${field}`)
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return invalid(field)
  return value as Record<string, unknown>
}

function finite(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    return invalid(field)
  return value
}

function position(value: unknown, field: string): Position3 {
  if (!Array.isArray(value) || value.length !== 3) return invalid(field)
  return [
    finite(value[0], field),
    finite(value[1], field),
    finite(value[2], field),
  ]
}

/** Validate external JSON once, before it can reach camera or object transforms. */
export function parseDockingMotion(text: string): DockingMotion {
  const source = record(JSON.parse(text) as unknown, 'root')
  const duration = finite(source.duration, 'duration')
  const fps = finite(source.fps, 'fps')
  if (duration <= 0 || fps <= 0)
    return invalid('positive duration and fps required')
  if (!Array.isArray(source.samples) || source.samples.length < 2)
    return invalid('at least two samples required')
  const samples = source.samples.map((value: unknown, index): DockingSample => {
    const sample = record(value, `samples[${index}]`)
    const field = `samples[${index}]`
    const clampClosure = finite(sample.clampClosure, `${field}.clampClosure`)
    if (clampClosure < 0 || clampClosure > 1)
      return invalid(`${field}.clampClosure outside [0, 1]`)
    return {
      time: finite(sample.time, `${field}.time`),
      pampaPosition: position(sample.pampaPosition, `${field}.pampaPosition`),
      pampaYaw: finite(sample.pampaYaw, `${field}.pampaYaw`),
      cameraPosition: position(
        sample.cameraPosition,
        `${field}.cameraPosition`,
      ),
      cameraTarget: position(sample.cameraTarget, `${field}.cameraTarget`),
      clampClosure,
    }
  })
  if (samples[0].time !== 0) return invalid('first sample must start at zero')
  for (let index = 1; index < samples.length; index++) {
    if (samples[index].time <= samples[index - 1].time)
      return invalid('sample times must be strictly increasing')
  }
  if (Math.abs(samples[samples.length - 1].time - duration) > 1e-6)
    return invalid('last sample must match duration')
  return { duration, fps, samples }
}

/** Allocation-free cursor: A=floor(cursor), B=min(A+1,last), alpha=cursor-A.
 * Binary search also handles non-uniform authored samples. */
export function getDockingSampleCursor(motion: DockingMotion, time: number) {
  const samples = motion.samples
  const last = samples.length - 1
  if (time >= samples[last].time) return last
  if (!Number.isFinite(time) || time <= 0) return 0
  let lower = 0
  let upper = last
  while (upper - lower > 1) {
    const middle = Math.floor((lower + upper) / 2)
    if (samples[middle].time <= time) lower = middle
    else upper = middle
  }
  return (
    lower +
    (time - samples[lower].time) / (samples[upper].time - samples[lower].time)
  )
}
