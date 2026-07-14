import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/upload':  { target: 'http://localhost:8000', changeOrigin: true },
      '/ranking': { target: 'http://localhost:8000', changeOrigin: true },
      '/chat':    { target: 'http://localhost:8000', changeOrigin: true },
      '/reveal':  { target: 'http://localhost:8000', changeOrigin: true },
      '/health':  { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  build: {
    outDir: '../static',
    emptyOutDir: true,
  },
})
