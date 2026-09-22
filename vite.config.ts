import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Prod su GitHub Pages: https://unitoolkit.github.io/uniorario/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/uniorario/' : '/',
  plugins: [react(), tailwindcss()],
}))
