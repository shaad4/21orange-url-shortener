import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig(({ mode }) => {
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
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test-setup.js',
      coverage: {
        reporter: ['lcov', 'text'],
      },
    },
  }
})