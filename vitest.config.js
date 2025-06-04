import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: ['default'],
    coverage: {
      reporter: ['text'],
      reportsDirectory: './coverage'
    },
    exclude: ['**/e2e/**', '**/node_modules/**'],
    environment: 'happy-dom'
  }
}) 