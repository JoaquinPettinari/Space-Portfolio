import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readSecurityHeaders } from './server/securityHeaders.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: { headers: readSecurityHeaders() },
})
