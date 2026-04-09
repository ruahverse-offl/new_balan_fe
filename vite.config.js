import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: [
      "newbalanpharmacy.com",
      "localhost",
      "newbalan-frontend"
    ]
  }
})
