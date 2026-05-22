import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configuration Vite - SoloFin
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Proxy les appels /api vers le backend Express (port 3001)
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
