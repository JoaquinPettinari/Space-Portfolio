/** Screenshot conveniences are opt-in and never included in a production build. */
export function readDevelopmentMode(
  command: 'build' | 'serve',
  mode: string,
  value: string | undefined,
) {
  return command === 'serve' && mode !== 'production' && value === 'true'
}
