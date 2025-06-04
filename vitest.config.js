import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: ['default'],
    coverage: {
      reporter: ['text'],
      reportsDirectory: './coverage'
    }
  }
}) 