import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Bind 0.0.0.0, not just localhost, so the dev server is reachable
    // from phones/tablets on the same network for real-device testing.
    // /api calls still resolve here and get proxied below, so the phone
    // needs no backend URL of its own.
    host: true,
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
})
