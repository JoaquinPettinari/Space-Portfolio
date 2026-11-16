import { useEffect, useRef } from 'react'

/** Animation preference read by frame callbacks without triggering React renders. */
export function useReducedMotionRef(onChange?: () => void) {
  const reduced = useRef(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reduced.current = query.matches
      onChange?.()
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [onChange])
  return reduced
}
