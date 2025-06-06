import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
    exclude: ['**/e2e/**', 'dist/**', '**/node_modules/**'],
    reporters: ['default'],
    coverage: {
      reporter: ['html', 'text'],
      reportsDirectory: './test-results/coverage'
    }
  }
})