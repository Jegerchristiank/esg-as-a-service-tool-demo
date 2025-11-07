/**
 * Vitest opsætning til komponent- og hooktests i webappen.
 */
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const currentDir = dirname(fileURLToPath(import.meta.url))
const sharedEntry = resolve(currentDir, '../../packages/shared/index.ts')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@org/shared': sharedEntry
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['tests/e2e/**', 'node_modules/**']
  }
})
