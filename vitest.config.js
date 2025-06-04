import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
    exclude: ['**/e2e/**', '**/node_modules/**'],
    reporters: ['html', 'default'],
    outputFile: {
      html: './test-results/vitest-report.html'
    }
  }
}) 