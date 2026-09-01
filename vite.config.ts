/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // jsdom gives the core tests a localStorage to exercise the stores against.
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
