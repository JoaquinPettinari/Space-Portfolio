import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { playScanner } from './scannerAudio'

/** A quiet engine and ventilation bed, synthesized without downloaded audio. */
function createAmbience() {
  const context = new AudioContext()
  const master = context.createGain()
  master.gain.value = 0.12
  master.connect(context.destination)

  const engine = context.createOscillator()
  const engineGain = context.createGain()
  engine.frequency.value = 55
  engineGain.gain.value = 0.18
  engine.connect(engineGain).connect(master)

  const air = context.createBufferSource()
  const buffer = context.createBuffer(
    1,
    context.sampleRate * 4,
    context.sampleRate,
  )
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = Math.random() * 2 - 1
  }
  air.buffer = buffer
  air.loop = true
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 280
  filter.Q.value = 0.3
  air.connect(filter).connect(master)
  engine.start()
  air.start()

  return context
}

export function AmbientAudio({
  hidden = false,
  suspended = false,
  scanSignal = 0,
  scanning = false,
}: {
  hidden?: boolean
  suspended?: boolean
  scanSignal?: number
  scanning?: boolean
}) {
  const contextRef = useRef<AudioContext | null>(null)
  const enabledRef = useRef(false)
  const mountedRef = useRef(false)
  const [enabled, setEnabled] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const supported = typeof AudioContext !== 'undefined'

  const syncAudio = useEffectEvent(() => {
    const context = contextRef.current
    if (!context || context.state === 'closed') return
    const action =
      suspended || document.hidden || !enabledRef.current
        ? context.suspend()
        : context.resume()
    void action.catch(() => {
      if (!mountedRef.current) return
      enabledRef.current = false
      setEnabled(false)
      setError('Audio paused. Try turning sound on again.')
    })
  })
  useEffect(() => {
    mountedRef.current = true
    const onVisibility = () => syncAudio()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      mountedRef.current = false
      document.removeEventListener('visibilitychange', onVisibility)
      const context = contextRef.current
      contextRef.current = null
      if (context && context.state !== 'closed')
        void context.close().catch(() => {})
    }
  }, [])
  useEffect(() => {
    syncAudio()
  }, [suspended])
  useEffect(() => {
    const context = contextRef.current
    if (
      !scanSignal ||
      !scanning ||
      !enabled ||
      suspended ||
      document.hidden ||
      !context ||
      context.state !== 'running'
    )
      return
    return playScanner(context)
  }, [scanSignal, scanning, enabled, suspended])

  const toggle = async () => {
    setPending(true)
    setError('')
    const next = !enabledRef.current
    try {
      // AudioContext creation and resume stay inside a real user gesture.
      const context = contextRef.current ?? createAmbience()
      contextRef.current = context
      enabledRef.current = next
      if (next && !document.hidden && !suspended) await context.resume()
      else await context.suspend()
      if (mountedRef.current) setEnabled(next)
    } catch {
      enabledRef.current = false
      if (mountedRef.current) {
        setEnabled(false)
        setError('Audio is unavailable. You can keep exploring without sound.')
      }
    } finally {
      if (mountedRef.current) setPending(false)
    }
  }

  return (
    <div className="ambient-audio" hidden={hidden}>
      <button
        type="button"
        aria-label="Ambient sound"
        aria-pressed={enabled}
        disabled={!supported || pending}
        onClick={() => void toggle()}
      >
        Sound {enabled ? 'on' : 'off'}
      </button>
      <p role="status">
        {supported ? error : 'Audio is unavailable in this browser.'}
      </p>
    </div>
  )
}
