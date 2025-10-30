import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/pokesaso/',
  plugins: [react()],
  server: {
    proxy: {
      '/api-tcg': {
        target: 'https://api.pokemontcg.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-tcg/, ''),
      },
    },
  },
})
