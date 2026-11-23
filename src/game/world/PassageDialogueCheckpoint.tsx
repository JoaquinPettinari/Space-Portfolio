import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { crossedPassageMidpoint } from '../passageDialogue'

export function PassageDialogueCheckpoint({
  active,
  onCross,
}: {
  active: boolean
  onCross: () => void
}) {
  const previous = useRef(new Vector3())
  const initialized = useRef(false)
  const crossed = useRef(false)
  useFrame(({ camera }) => {
    if (crossed.current) return
    if (!active) {
      initialized.current = false
      return
    }
    if (
      initialized.current &&
      crossedPassageMidpoint(previous.current, camera.position)
    ) {
      crossed.current = true
      onCross()
    }
    previous.current.copy(camera.position)
    initialized.current = true
  })
  return null
}
