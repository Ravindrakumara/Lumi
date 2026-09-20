import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this as a project site at /Lumi/, not the domain
  // root, so built asset URLs need that prefix. Dev server stays at root.
  base: command === 'build' ? '/Lumi/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the existing FastAPI backend during dev,
      // so the React app can call the same real endpoints (/api/chat,
      // /api/tts, /api/lessons, etc.) with no CORS setup needed.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
}))
