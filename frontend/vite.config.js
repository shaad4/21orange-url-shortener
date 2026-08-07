import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from the root directory (../)
  const env = loadEnv(mode, '../', '')
  
  return {
    plugins: [react()],
    envDir: '../',
    server: {
      port: parseInt(env.VITE_PORT) || 3000,
    },
  }
})
