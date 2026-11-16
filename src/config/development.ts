/** Vite substitutes only this boolean; server environment values never enter the client. */
declare const __DEV_MODE__: boolean

export function developmentCaptureMode() {
  return (
    import.meta.env.DEV && typeof __DEV_MODE__ !== 'undefined' && __DEV_MODE__
  )
}
