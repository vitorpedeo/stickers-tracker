import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    alias: {
      'virtual:pwa-register/react': resolve(
        __dirname,
        './src/test/mocks/pwa-register-react.ts',
      ),
    },
  },
})
