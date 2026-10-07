import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const dataSource = (env.VITE_DATA_SOURCE || 'api').toLowerCase()
  const backendTarget = dataSource === 'mock'
    ? (env.VITE_MOCK_SERVER_TARGET || 'http://localhost:3001')
    : (env.VITE_DEV_SERVER_TARGET || 'http://localhost:8080')

  return {
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
  }
})
