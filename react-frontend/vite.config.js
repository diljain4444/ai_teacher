import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Capacitor requires assets to be loaded relative to the file system, not from /
  base: process.env.VITE_BUILD_TARGET === 'web' ? '/' : './',
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    // Prevent Vite from scanning android/ Capacitor assets
    entries: ['index.html', 'src/**/*.{js,jsx,ts,tsx}'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
