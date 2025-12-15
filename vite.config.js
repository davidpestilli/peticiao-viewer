import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/peticiao-viewer/', // Nome do repositório para GitHub Pages
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
