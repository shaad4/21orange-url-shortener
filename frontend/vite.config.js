import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Check if .env exists in the parent directory, otherwise use the current directory
  const envDir = fs.existsSync('../.env') ? '../' : './'
  
  const env = loadEnv(mode, envDir, '')
  
  return {
    plugins: [react()],
    envDir: envDir,
    server: {
      host: '0.0.0.0',
      port: parseInt(env.VITE_PORT) || 3000,
      allowedHosts: ['21orange.local'],
    },
  }
})
