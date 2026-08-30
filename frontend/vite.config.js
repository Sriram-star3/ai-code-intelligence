import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/summarize': 'http://localhost:8000',
      '/diagram':   'http://localhost:8000',
      '/index':     'http://localhost:8000',
      '/related':   'http://localhost:8000',
      '/docs-check':'http://localhost:8000',
      '/health':    'http://localhost:8000',
    },
  },
})
