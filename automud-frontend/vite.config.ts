import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  cacheDir: 'node_modules/.vite_cache',
  clearScreen: false,
  server: {
    watch: {
      usePolling: true,
    },
  },
});