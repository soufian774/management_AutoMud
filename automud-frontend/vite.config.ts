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
    host: '0.0.0.0',      // ✅ Permette connessioni dalla rete locale
    port: 5173,           // ✅ Porta standard Vite
    strictPort: true,     // ✅ Fallisce se porta è occupata
    watch: {
      usePolling: true,   // ✅ Mantieni il polling per il watch
    },
    // ✅ PROXY SEMPLICE - Tutte le richieste /api vanno al backend localhost
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
});