import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: ['html', 'default'],
    outputFile: {
      html: './test-results/report.html'
    },
    coverage: {
      reporter: ['html', 'text'],
      reportsDirectory: './coverage'
    },
    exclude: [
      'e2e/**',
      'node_modules/**',
      'dist/**',
    ]
  }
})