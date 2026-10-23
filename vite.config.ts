import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // The workbook parser is only needed by the administrator import tool.
          // Keep it out of the initial student-facing application bundle.
          if (id.includes('/node_modules/xlsx/')) return 'spreadsheet'
        },
      },
    },
  },
})
