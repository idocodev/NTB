import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from GitHub Pages at https://idocodev.github.io/NTB/
export default defineConfig({
  base: '/NTB/',
  plugins: [react()],
})
