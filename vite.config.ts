import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { readDevelopmentMode } from './server/developmentMode.ts'
import { readSecurityHeaders } from './server/securityHeaders.ts'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const { DEV_MODE } = loadEnv(mode, process.cwd(), 'DEV_MODE')
  return {
    plugins: [react()],
    define: {
      __DEV_MODE__: JSON.stringify(
        readDevelopmentMode(command, mode, DEV_MODE),
      ),
    },
    preview: { headers: readSecurityHeaders() },
  }
})
